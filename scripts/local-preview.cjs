// Isolated local preview: never connects to Firestore or writes real orders.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const folder = path.join(root, '.local-preview');
const file = path.join(folder, 'data.json');
const secretFile = path.join(folder, 'session-secret');
const initial = {
  products: {
    'demo-pack': { type: 'pack', title: 'Pack exemple', description: 'Pack de démonstration : modifiable dans l’administration.', price: 199, stock: 10, featured: true, images: [], createdAt: new Date().toISOString() },
    'demo-produit': { type: 'product', title: 'Produit exemple', description: 'Produit de démonstration.', price: 70, stock: 10, featured: true, images: [], createdAt: new Date().toISOString() }
  },
  settings: {}, promoCodes: {}, orders: {}
};
fs.mkdirSync(folder, { recursive: true });
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'));
const secret = fs.readFileSync(secretFile, 'utf8');
const sign = payload => crypto.createHmac('sha256', secret).update(payload).digest('hex');
let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : initial;
const save = () => fs.writeFileSync(file, JSON.stringify(data, null, 2));
if (!fs.existsSync(file)) save();
const respond = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const item = (id, entry) => ({ id, data: entry });
const fixDates = object => Object.fromEntries(Object.entries(object || {}).map(([key, value]) => [key, value && value.__serverTimestamp ? new Date().toISOString() : value]));

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') return respond(res, 405, { error: 'Méthode invalide.' });
  let raw = '';
  req.on('data', chunk => { raw += chunk; if (raw.length > 1024 * 1024) req.destroy(); });
  req.on('end', () => {
    try {
      const body = JSON.parse(raw || '{}');
      if (req.url === '/api/admin-login') {
        if (body.password !== 'Glow.Admin_1') return respond(res, 401, { error: 'Mot de passe incorrect.' });
        const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 30 * 24 * 60 * 60 * 1000, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
        res.setHeader('Set-Cookie', `glow_admin=${payload}.${sign(payload)}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Strict`);
        return respond(res, 200, { ok: true });
      }
      if (req.url === '/api/preview/read') {
        if (!['products', 'settings', 'promoCodes'].includes(body.name)) return respond(res, 403, { error: 'Interdit.' });
        const items = data[body.name];
        if (body.id) return respond(res, 200, items[body.id] ? { found: true, document: item(body.id, items[body.id]) } : { found: false });
        return respond(res, 200, { documents: Object.entries(items).map(([id, entry]) => item(id, entry)) });
      }
      if (req.url === '/.netlify/functions/create-order') {
        return respond(res, 200, { ok: true, preview: true, orderId: 'preview-only' });
      }
      if (req.url !== '/.netlify/functions/admin-api') return respond(res, 404, { error: 'Introuvable.' });
      const cookie = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('glow_admin='));
      const [payload, signature] = (cookie ? cookie.slice('glow_admin='.length) : '').split('.');
      let session;
      try { session = JSON.parse(Buffer.from(payload || '', 'base64url').toString()); } catch (_) { session = null; }
      if (!payload || !signature || signature !== sign(payload) || !session || session.exp < Date.now()) return respond(res, 401, { error: 'Session expirée. Reconnectez-vous.' });
      const store = data[body.collection];
      if (!store) return respond(res, 400, { error: 'Collection invalide.' });
      if (body.action === 'list') return respond(res, 200, { documents: Object.entries(store).map(([id, entry]) => item(id, entry)) });
      if (body.action === 'get') return respond(res, 200, store[body.id] ? { found: true, document: item(body.id, store[body.id]) } : { found: false });
      if (body.action === 'delete') { delete store[body.id]; save(); return respond(res, 200, { ok: true }); }
      if (['add', 'update', 'set'].includes(body.action)) {
        const id = body.action === 'add' ? crypto.randomUUID() : body.id;
        store[id] = body.action === 'update' || body.merge ? { ...store[id], ...fixDates(body.data) } : fixDates(body.data);
        save(); return respond(res, 200, { found: true, document: item(id, store[id]) });
      }
      return respond(res, 400, { error: 'Action invalide.' });
    } catch (error) { console.error('Preview error:', error.message); return respond(res, 500, { error: 'Erreur du serveur local.' }); }
  });
});

server.listen(3101, '127.0.0.1', () => {
  console.log('Mode test local : http://127.0.0.1:3100');
  console.log('Les données et commandes sont isolées du site en ligne.');
  const react = spawn(process.execPath, [path.join(root, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js'), 'start'], {
    cwd: root, stdio: 'inherit', env: { ...process.env, HOST: '127.0.0.1', PORT: '3100', BROWSER: 'none', DANGEROUSLY_DISABLE_HOST_CHECK: 'true', REACT_APP_LOCAL_PREVIEW: 'true' }
  });
  react.on('exit', code => { server.close(); process.exitCode = code || 0; });
  process.on('SIGINT', () => { react.kill(); server.close(); });
  process.on('SIGTERM', () => { react.kill(); server.close(); });
});
server.on('error', error => { console.error('Impossible de démarrer le serveur local:', error.message); process.exitCode = 1; });

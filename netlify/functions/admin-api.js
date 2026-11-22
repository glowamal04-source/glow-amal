const crypto = require('crypto');

const respond = (statusCode, data) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(data) });
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const signature = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a || '')); const y = Buffer.from(String(b || '')); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const value = v => {
  if (v && v.__serverTimestamp === true) return { timestampValue: new Date().toISOString() };
  if (v === null || v === undefined) return { nullValue: null };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'object') return { mapValue: { fields: fields(v) } };
  return { stringValue: String(v) };
};
const fields = object => Object.fromEntries(Object.entries(object).map(([k, v]) => [k, value(v)]));
const decode = v => {
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, decode(x)]));
  return null;
};
async function accessToken() {
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Firebase service account is not configured');
  const now = Math.floor(Date.now() / 1000);
  const body = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const assertion = `${body}.${crypto.sign('RSA-SHA256', Buffer.from(body), key).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  if (!response.ok) throw new Error('Firebase authentication failed');
  return (await response.json()).access_token;
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  try {
    const data = JSON.parse(event.body || '{}');
    const password = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!password || !secret || secret.length < 32) return respond(503, { error: 'Administration non configurée sur le serveur.' });
    if (data.action === 'login') return respond(404, { error: 'Endpoint invalide.' });
    const cookie = String(event.headers.cookie || event.headers.Cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('glow_admin='));
    const [payload, sig] = (cookie ? cookie.slice('glow_admin='.length) : '').split('.');
    if (!payload || !same(sig, signature(payload, secret))) return respond(401, { error: 'Session expirée. Reconnectez-vous.' });
    let session; try { session = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch (_) { return respond(401, { error: 'Session invalide.' }); }
    if (!session.exp || session.exp < Date.now()) return respond(401, { error: 'Session expirée. Reconnectez-vous.' });
    if (!['products', 'orders', 'settings', 'promoCodes'].includes(data.collection)) return respond(400, { error: 'Collection invalide.' });
    if (data.id && !/^[A-Za-z0-9_-]{1,120}$/.test(data.id)) return respond(400, { error: 'Identifiant invalide.' });
    const project = process.env.FIREBASE_PROJECT_ID || 'glow-aml-store';
    const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${data.collection}`;
    const token = await accessToken();
    let url = base, method = 'GET', body;
    if (data.action === 'get') url += `/${data.id}`;
    else if (data.action === 'list') url += '?pageSize=1000';
    else if (data.action === 'delete') { url += `/${data.id}`; method = 'DELETE'; }
    else if (data.action === 'add') { method = 'POST'; body = { fields: fields(data.data || {}) }; }
    else if (data.action === 'set' || data.action === 'update') {
      method = 'PATCH'; url += `/${data.id}`;
      const input = data.data || {};
      if (data.action === 'update' || data.merge) url += '?' + Object.keys(input).map(key => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&');
      body = { fields: fields(input) };
    } else return respond(400, { error: 'Action invalide.' });
    const result = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (result.status === 404 && data.action === 'get') return respond(200, { found: false });
    if (!result.ok) throw new Error(`Firestore error ${result.status}`);
    if (data.action === 'delete') return respond(200, { ok: true });
    const output = await result.json();
    if (data.action === 'list') {
      while (output.nextPageToken) {
        const next = await fetch(`${base}?pageSize=1000&pageToken=${encodeURIComponent(output.nextPageToken)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!next.ok) throw new Error(`Firestore error ${next.status}`);
        const page = await next.json();
        output.documents = [...(output.documents || []), ...(page.documents || [])];
        output.nextPageToken = page.nextPageToken;
      }
    }
    const parse = d => ({ id: d.name.split('/').pop(), data: Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, decode(v)])) });
    return respond(200, data.action === 'list' ? { documents: (output.documents || []).map(parse) } : { found: true, document: parse(output) });
  } catch (error) { console.error('Admin API:', error.message); return respond(500, { error: 'Erreur du serveur. Réessayez ou vérifiez sa configuration.' }); }
};

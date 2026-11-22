import crypto from 'node:crypto';

export const config = {
  path: '/api/admin-login',
  method: 'POST',
  rateLimit: { windowLimit: 10, windowSize: 180, aggregateBy: ['ip', 'domain'] }
};

export default async request => {
  const json = (status, data) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) {
    const issues = [];
    if (!password) issues.push('ADMIN_PASSWORD absent');
    if (!secret) issues.push('ADMIN_SESSION_SECRET absent');
    else if (secret.length < 32) issues.push('ADMIN_SESSION_SECRET inférieur à 32 caractères');
    console.error('Configuration admin:', issues.join('; '));
    return json(503, { error: 'Administration non configurée sur le serveur.' });
  }
  let input;
  try { input = await request.json(); } catch (_) { return json(400, { error: 'Requête invalide.' }); }
  const given = Buffer.from(String(input.password || ''));
  const expected = Buffer.from(password);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return json(401, { error: 'Mot de passe incorrect.' });
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 30 * 24 * 60 * 60 * 1000, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return Response.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store', 'Set-Cookie': `glow_admin=${payload}.${sig}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Strict` } });
};

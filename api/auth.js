const { scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { USERNAME, getSession, createSession, sessionCookie } = require('../lib/session');
const derive = promisify(scrypt);
const SALT = '58bc4ded99a2fd8ebcfff8b5ec1e866ab85bb48dc1426a27';
const PASSWORD_HASH = Buffer.from('14cdbd44f5f50b6eae7f667745d215340452dda57e96263fe0f299d3735cdea26db7f7d39b761b326c71cfb3755eee636334942736d6902f483b044749a6c942', 'hex');
const attempts = new Map();

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const session = getSession(req);
    return json(res, 200, { authenticated: Boolean(session), username: session?.user || null });
  }
  if (!['POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  }
  // Verify same-origin mutation requests; cookie is also SameSite=Strict.
  try {
    if (!req.headers.origin || new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: 'Request not allowed' });
  } catch { return json(res, 403, { error: 'Request not allowed' }); }
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie(req, '', true));
    return json(res, 200, { authenticated: false });
  }
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'JSON is required' });
  if (Number(req.headers['content-length']) > 2048) return json(res, 413, { error: 'Request too large' });
  const now = Date.now();
  for (const [ip, entry] of attempts) if (entry.until < now) attempts.delete(ip);
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const entry = attempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.count >= 8) {
    res.setHeader('Retry-After', Math.ceil((entry.until - now) / 1000));
    return json(res, 429, { error: 'Too many attempts. Please try again in a few minutes.' });
  }
  // Per-instance attempt limit is bounded to avoid unbounded memory growth.
  if (attempts.size > 10000) return json(res, 429, { error: 'Please try again shortly.' });
  entry.count += 1; attempts.set(ip, entry);
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const username = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (username.length > 80 || password.length > 256) return json(res, 401, { error: 'Incorrect username or password.' });
    const actual = await derive(password, SALT, 64);
    if (!timingSafeEqual(actual, PASSWORD_HASH) || username !== USERNAME) return json(res, 401, { error: 'Incorrect username or password.' });
    const session = createSession();
    attempts.delete(ip);
    res.setHeader('Set-Cookie', sessionCookie(req, session));
    return json(res, 200, { authenticated: true, username: USERNAME });
  } catch { return json(res, 503, { error: 'Sign in is temporarily unavailable. Please try again.' }); }
};

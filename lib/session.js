const { createHmac, timingSafeEqual, hkdfSync } = require('node:crypto');

const COOKIE = 'blue_maruya_session';
const MAX_AGE = 8 * 60 * 60;
const USERNAME = 'wakengwapo';

function signingKey() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.TMDB_BEARER_TOKEN;
  if (!secret) throw new Error('Session signing secret is missing');
  // Domain-separated key: the TMDB token never appears in a session cookie.
  return Buffer.from(hkdfSync('sha256', secret, 'blue-maruya-v1', 'member-session', 32));
}

function sign(value) { return createHmac('sha256', signingKey()).update(value).digest('base64url'); }
function createSession() {
  const payload = Buffer.from(JSON.stringify({ user: USERNAME, exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function getSession(req) {
  try {
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
      const separator = part.indexOf('=');
      return [part.slice(0, separator).trim(), part.slice(separator + 1)];
    }));
    const token = cookies[COOKIE];
    if (!token || token.length > 1024) return null;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (session.user !== USERNAME || !Number.isFinite(session.exp) || session.exp <= Date.now() / 1000) return null;
    return session;
  } catch { return null; }
}

function sessionCookie(req, value, clear = false) {
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : MAX_AGE}${secure ? '; Secure' : ''}`;
}

module.exports = { USERNAME, getSession, createSession, sessionCookie };

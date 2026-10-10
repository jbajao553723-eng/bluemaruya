const { createSession, sessionCookie } = require('../lib/session');
const { seeds, readMember, writeMember, verifyPassword, passwordRecord, publicMember, memberSession } = require('../lib/members');
const attempts = new Map();

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
function throttle(req, res, scope) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const key = `${scope}:${ip}`;
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.count >= 8 || attempts.size > 10000) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((entry.until - now) / 1000)));
    json(res, 429, { error: 'Too many attempts. Please try again in a few minutes.' });
    return null;
  }
  entry.count++; attempts.set(key, entry);
  return key;
}
module.exports = async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (req.method !== 'GET') {
    try { if (!req.headers.origin || new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: 'Request not allowed' }); }
    catch { return json(res, 403, { error: 'Request not allowed' }); }
  }
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie(req, '', true));
    return json(res, 200, { authenticated: false });
  }
  if (req.method !== 'GET') {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'JSON is required' });
    if (Number(req.headers['content-length']) > 2048) return json(res, 413, { error: 'Request too large' });
  }
  try {
    if (req.method === 'GET') {
      const active = await memberSession(req);
      return json(res, 200, active ? { authenticated: true, ...publicMember(active.member) } : { authenticated: false, username: null, displayName: null });
    }
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}; }
    catch { return json(res, 400, { error: 'Invalid request' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Invalid request' });
    if (req.method === 'POST') {
      const key = throttle(req, res, 'login'); if (!key) return;
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (username.length > 80 || password.length > 256) return json(res, 401, { error: 'Incorrect username or password.' });
      const record = await readMember(username);
      const valid = await verifyPassword(password, record?.member || seeds.wakengwapo);
      if (!record || !valid) return json(res, 401, { error: 'Incorrect username or password.' });
      attempts.delete(key);
      res.setHeader('Set-Cookie', sessionCookie(req, createSession(username, record.member.version)));
      return json(res, 200, { authenticated: true, ...publicMember(record.member) });
    }
    const active = await memberSession(req);
    if (!active) return json(res, 401, { error: 'Your session ended. Please sign in again.' });
    const member = { ...active.member };
    if (body.action === 'profile') {
      const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
      if (!displayName || displayName.length > 40 || /[\u0000-\u001f\u007f<>]/u.test(displayName)) return json(res, 400, { error: 'Enter a name between 1 and 40 characters.' });
      member.displayName = displayName;
    } else if (body.action === 'password') {
      const key = throttle(req, res, `password:${member.username}`); if (!key) return;
      const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
      const next = typeof body.newPassword === 'string' ? body.newPassword : '';
      if (current.length > 256 || next.length < 8 || next.length > 128) return json(res, 400, { error: 'Your new password must contain 8–128 characters.' });
      if (!await verifyPassword(current, member)) return json(res, 400, { error: 'Your current password is incorrect.' });
      if (current === next) return json(res, 400, { error: 'Choose a different new password.' });
      Object.assign(member, await passwordRecord(next));
      await writeMember(member, active.etag);
      attempts.delete(key);
      res.setHeader('Set-Cookie', sessionCookie(req, createSession(member.username, member.version)));
      return json(res, 200, { authenticated: true, ...publicMember(member), message: 'Password updated. Other sessions have been signed out.' });
    } else return json(res, 400, { error: 'Choose a settings action.' });
    await writeMember(member, active.etag);
    return json(res, 200, { authenticated: true, ...publicMember(member), message: 'Your name has been updated.' });
  } catch (error) {
    return json(res, error.status || 503, { error: error.status === 409 ? error.message : 'Account services are temporarily unavailable. Please try again.' });
  }
};

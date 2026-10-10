const { scrypt, randomBytes, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const { readFile, writeFile, rename, mkdir } = require('node:fs/promises');
const { dirname } = require('node:path');
const { getSession } = require('./session');
const derive = promisify(scrypt);
const seeds = {
  wakengwapo: { username: 'wakengwapo', displayName: 'waken', version: 0, salt: '58bc4ded99a2fd8ebcfff8b5ec1e866ab85bb48dc1426a27', hash: '14cdbd44f5f50b6eae7f667745d215340452dda57e96263fe0f299d3735cdea26db7f7d39b761b326c71cfb3755eee636334942736d6902f483b044749a6c942' },
  kdumangas: { username: 'kdumangas', displayName: 'kristine', version: 0, salt: '8a7e54af4ab849f0b47c32bfaf78121528dff9afe1485caa', hash: 'a3b74789030503b204bb0547381fce04ee2c0c6c6fd2ae1ae7873e03318a1aea7898d9798578206055f9d48d24d2b9fc139680b2085c04bd17ed0fb088329ed9' }
};
const pathFor = username => `members/v1/${username}.json`;
const localFile = username => `${process.env.ACCOUNT_STORE_DIR}/${username}.json`;
const localMode = () => !process.env.VERCEL && Boolean(process.env.ACCOUNT_STORE_DIR);
const conflict = () => Object.assign(new Error('Your settings changed in another tab. Reopen Settings and try again.'), { status: 409 });
let writes = Promise.resolve();

function validate(member, username) {
  if (member?.username !== username || typeof member.displayName !== 'string' || !member.displayName.trim() || member.displayName.length > 40 || !/^[a-f0-9]{48}$/.test(member.salt) || !/^[a-f0-9]{128}$/.test(member.hash) || !(member.version === 0 || /^[a-f0-9]{32}$/.test(member.version))) throw new Error('Invalid member record');
  return member;
}
async function readMember(username) {
  if (!Object.hasOwn(seeds, username)) return null;
  if (localMode()) {
    try { const data = await readFile(localFile(username), 'utf8'); return { member: validate(JSON.parse(data), username), etag: createHash('sha256').update(data).digest('hex') }; }
    catch (error) { if (error.code !== 'ENOENT') throw error; return { member: { ...seeds[username] }, etag: null }; }
  }
  const { get } = await import('@vercel/blob');
  const blob = await get(pathFor(username), { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(12000) });
  if (!blob) return { member: { ...seeds[username] }, etag: null };
  const data = await new Response(blob.stream).json();
  return { member: validate(data, username), etag: blob.blob.etag };
}
async function writeMember(member, etag) {
  validate(member, member.username);
  const data = JSON.stringify(member);
  if (localMode()) {
    const operation = writes.then(async () => {
      const latest = await readMember(member.username);
      if (latest.etag !== etag) throw conflict();
      const file = localFile(member.username);
      await mkdir(dirname(file), { recursive: true });
      const temporary = `${file}.${randomBytes(6).toString('hex')}.tmp`;
      await writeFile(temporary, data, { mode: 0o600 });
      await rename(temporary, file);
    });
    writes = operation.catch(() => {});
    await operation; return;
  }
  const { put, BlobPreconditionFailedError } = await import('@vercel/blob');
  try {
    await put(pathFor(member.username), data, { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}), abortSignal: AbortSignal.timeout(12000) });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || /already exists/i.test(error.message)) throw conflict();
    throw error;
  }
}
async function verifyPassword(password, member) {
  const hash = await derive(password, member.salt, 64);
  return timingSafeEqual(hash, Buffer.from(member.hash, 'hex'));
}
async function passwordRecord(password) {
  const salt = randomBytes(24).toString('hex');
  const hash = (await derive(password, salt, 64)).toString('hex');
  return { salt, hash, version: randomBytes(16).toString('hex') };
}
const publicMember = member => ({ username: member.username, displayName: member.displayName });
async function memberSession(req) {
  const session = getSession(req);
  if (!session) return null;
  const record = await readMember(session.user);
  if (!record || (session.version ?? 0) !== record.member.version) return null;
  return { session, ...record };
}
module.exports = { seeds, readMember, writeMember, verifyPassword, passwordRecord, publicMember, memberSession };

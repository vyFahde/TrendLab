const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const hashPattern = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{64})$/;
const legacyDemoAccounts = new Set([
  'teresa.tavares@trendlab.com',
  'gabriel.gomes@trendlab.com',
  'admin@trendlab.com',
  'teste@teste.com',
  'teste@trendlab.com',
  'testando@email.com',
]);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 32, scryptOptions);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const match = hashPattern.exec(storedHash);
  const salt = match ? Buffer.from(match[1], 'hex') : Buffer.alloc(16);
  const expected = match ? Buffer.from(match[2], 'hex') : Buffer.alloc(32);
  const actual = await scrypt(password, salt, expected.length, scryptOptions);
  return crypto.timingSafeEqual(actual, expected) && Boolean(match);
}

async function migratePasswords(db) {
  db.exec('PRAGMA secure_delete = ON; BEGIN IMMEDIATE;');
  try {
    const columns = db.prepare('PRAGMA table_info(users)').all();
    if (columns.some((column) => column.name === 'password')) {
      db.exec('ALTER TABLE users RENAME COLUMN password TO password_hash');
      const users = db.prepare('SELECT id, email, password_hash FROM users').all();
      const update = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
      for (const user of users) {
        const hash = legacyDemoAccounts.has(user.email.toLowerCase())
          ? 'disabled'
          : await hashPassword(user.password_hash);
        update.run(hash, user.id);
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

function signJwt(header, payload, secret) {
  return crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
}

function issueSession(user, secret) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expires = issuedAt + 3600;
  const payload = Buffer.from(JSON.stringify({
    sub: String(user.id),
    iat: issuedAt,
    exp: expires,
  })).toString('base64url');

  return {
    jwt: `${jwtHeader}.${payload}.${signJwt(jwtHeader, payload, secret)}`,
    expiresAt: expires * 1000,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

function verifyJwt(authorization, secret) {
  const match = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/i.exec(authorization || '');
  if (!match || match[1] !== jwtHeader) return null;

  const [, header, payload, signature] = match;
  const expected = signJwt(header, payload, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isInteger(claims.exp) || claims.exp <= Date.now() / 1000) return null;

    const id = Number(claims.sub);
    return typeof claims.sub === 'string' && Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, migratePasswords, issueSession, verifyJwt };

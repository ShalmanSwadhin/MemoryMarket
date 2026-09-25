const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Falls back to a dev-only secret so local testing works without a .env file,
// but refuses to serve real traffic with it: routes check requireProdSecret().
const SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production';
const isDev = !process.env.JWT_SECRET;

function requireProdSecret() {
  if (isDev && process.env.VERCEL_ENV === 'production') {
    throw new Error('JWT_SECRET is not set. Set it in the Vercel project environment variables before going live.');
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(e) { return typeof e === 'string' && e.length <= 254 && EMAIL_RE.test(e); }
function isValidPassword(p) { return typeof p === 'string' && p.length >= 8 && p.length <= 200; }
function isValidUsername(u) { return typeof u === 'string' && u.trim().length >= 2 && u.trim().length <= 40; }

async function hashPassword(pw) { return bcrypt.hash(pw, 10); }
async function verifyPassword(pw, hash) { return bcrypt.compare(pw, hash); }

function signUserToken(user) {
  requireProdSecret();
  return jwt.sign({ sub: user.id, email: user.email, username: user.username }, SECRET, { expiresIn: '30d' });
}
function signAdminToken() {
  requireProdSecret();
  return jwt.sign({ admin: true }, SECRET, { expiresIn: '8h' });
}
function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch (e) { return null; }
}

function isAdminRequest(req) {
  const { parseCookies } = require('./http');
  const cookies = parseCookies(req);
  const payload = cookies.mm_admin && verifyToken(cookies.mm_admin);
  return !!(payload && payload.admin);
}

module.exports = { hashPassword, verifyPassword, signUserToken, signAdminToken, verifyToken, isValidEmail, isValidPassword, isValidUsername, isAdminRequest, SECRET_IS_DEV: isDev };

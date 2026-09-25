const bcrypt = require('bcryptjs');
const { signAdminToken } = require('../_lib/auth');
const { readJsonBody, setCookie, sendJson, rateLimited } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (rateLimited('adminlogin:' + ip, 8, 10 * 60 * 1000)) return sendJson(res, 429, { error: 'rate_limited' });

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    console.error('ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not configured');
    return sendJson(res, 503, { error: 'admin_not_configured', message: 'Admin access has not been configured on this deployment yet.' });
  }

  let body;
  try { body = await readJsonBody(req); } catch (e) { return sendJson(res, 400, { error: 'bad_request' }); }
  const { email, password } = body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return sendJson(res, 400, { error: 'invalid_credentials' });

  const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
  const passOk = emailOk && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!emailOk || !passOk) return sendJson(res, 401, { error: 'invalid_credentials', message: 'Incorrect admin email or password.' });

  const token = signAdminToken();
  setCookie(res, 'mm_admin', token, { maxAge: 60 * 60 * 8, sameSite: 'Strict' });
  return sendJson(res, 200, { ok: true });
};

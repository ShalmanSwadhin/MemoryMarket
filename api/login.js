const db = require('./_lib/db');
const { verifyPassword, signUserToken, isValidEmail } = require('./_lib/auth');
const { readJsonBody, setCookie, sendJson, rateLimited } = require('./_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (rateLimited('login:' + ip, 10, 5 * 60 * 1000)) return sendJson(res, 429, { error: 'rate_limited', message: 'Too many attempts. Please wait a few minutes.' });

  let body;
  try { body = await readJsonBody(req); } catch (e) { return sendJson(res, 400, { error: 'bad_request' }); }
  const { email, password } = body || {};
  if (!isValidEmail(email) || typeof password !== 'string' || !password) {
    return sendJson(res, 400, { error: 'invalid_credentials', message: 'Enter a valid email and password.' });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return sendJson(res, 401, { error: 'invalid_credentials', message: 'Incorrect email or password.' });
    }
    const token = signUserToken(user);
    setCookie(res, 'mm_session', token, { maxAge: 60 * 60 * 24 * 30 });
    return sendJson(res, 200, { user: { id: user.id, username: user.username, email: user.email } });
  } catch (e) {
    console.error('login failed', e);
    return sendJson(res, 500, { error: 'server_error', message: 'Unable to log in right now. Please try again.' });
  }
};

const db = require('./_lib/db');
const { hashPassword, signUserToken, isValidEmail, isValidPassword, isValidUsername } = require('./_lib/auth');
const { readJsonBody, setCookie, sendJson } = require('./_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });
  let body;
  try { body = await readJsonBody(req); } catch (e) { return sendJson(res, 400, { error: 'bad_request' }); }
  const { username, email, password } = body || {};

  if (!isValidUsername(username)) return sendJson(res, 400, { error: 'invalid_username', message: 'Display name must be 2-40 characters.' });
  if (!isValidEmail(email)) return sendJson(res, 400, { error: 'invalid_email', message: 'That does not look like a valid email address.' });
  if (!isValidPassword(password)) return sendJson(res, 400, { error: 'invalid_password', message: 'Password must be at least 8 characters.' });

  try {
    const existing = await db.getUserByEmail(email);
    if (existing) return sendJson(res, 409, { error: 'email_taken', message: 'An account with that email already exists.' });

    const passwordHash = await hashPassword(password);
    const user = await db.createUser({ username: username.trim(), email, passwordHash });
    const token = signUserToken(user);
    setCookie(res, 'mm_session', token, { maxAge: 60 * 60 * 24 * 30 });
    return sendJson(res, 201, { user: { id: user.id, username: user.username, email: user.email } });
  } catch (e) {
    console.error('register failed', e);
    return sendJson(res, 500, { error: 'server_error', message: 'Unable to create account. Please try again.' });
  }
};

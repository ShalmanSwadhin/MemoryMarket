const db = require('./_lib/db');
const { verifyToken } = require('./_lib/auth');
const { parseCookies, sendJson } = require('./_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' });
  const cookies = parseCookies(req);
  const payload = cookies.mm_session && verifyToken(cookies.mm_session);
  if (!payload) return sendJson(res, 401, { error: 'not_authenticated' });
  try {
    const user = await db.getUserById(payload.sub);
    if (!user) return sendJson(res, 401, { error: 'not_authenticated' });
    return sendJson(res, 200, { user: { id: user.id, username: user.username, email: user.email } });
  } catch (e) {
    console.error('me failed', e);
    return sendJson(res, 500, { error: 'server_error' });
  }
};

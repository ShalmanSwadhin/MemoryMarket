const { clearCookie, sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });
  clearCookie(res, 'mm_admin');
  return sendJson(res, 200, { ok: true });
};

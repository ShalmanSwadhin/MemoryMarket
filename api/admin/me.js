const { isAdminRequest } = require('../_lib/auth');
const { sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' });
  return sendJson(res, isAdminRequest(req) ? 200 : 401, { admin: isAdminRequest(req) });
};

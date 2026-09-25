const db = require('../../_lib/db');
const { isAdminRequest } = require('../../_lib/auth');
const { readJsonBody, sendJson } = require('../../_lib/http');

const STATUSES = ['open', 'investigating', 'fixed', 'closed'];

module.exports = async (req, res) => {
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: 'not_authenticated' });

  const id = (req.query && req.query.id) || req.url.split('/').filter(Boolean).pop().split('?')[0];

  if (req.method === 'GET') {
    try {
      const report = await db.getBugReport(id);
      if (!report) return sendJson(res, 404, { error: 'not_found' });
      return sendJson(res, 200, { report });
    } catch (e) { console.error('admin get report failed', e); return sendJson(res, 500, { error: 'server_error' }); }
  }

  if (req.method === 'PATCH') {
    let body;
    try { body = await readJsonBody(req); } catch (e) { return sendJson(res, 400, { error: 'bad_request' }); }
    const { status, developerNotes } = body || {};
    if (status !== undefined && !STATUSES.includes(status)) return sendJson(res, 400, { error: 'invalid_status' });
    if (developerNotes !== undefined && (typeof developerNotes !== 'string' || developerNotes.length > 4000)) return sendJson(res, 400, { error: 'invalid_notes' });
    try {
      const report = await db.updateBugReport(id, { status, developerNotes });
      if (!report) return sendJson(res, 404, { error: 'not_found' });
      return sendJson(res, 200, { report });
    } catch (e) { console.error('admin update report failed', e); return sendJson(res, 500, { error: 'server_error' }); }
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
};

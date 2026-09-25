const db = require('../_lib/db');
const { isAdminRequest } = require('../_lib/auth');
const { sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: 'not_authenticated' });
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' });

  const url = new URL(req.url, 'http://localhost');
  const filters = {
    status: url.searchParams.get('status') || undefined,
    severity: url.searchParams.get('severity') || undefined,
    chapter: url.searchParams.get('chapter') || undefined,
    language: url.searchParams.get('language') || undefined,
    limit: Math.min(500, Number(url.searchParams.get('limit')) || 100)
  };

  try {
    const reports = await db.listBugReports(filters);
    return sendJson(res, 200, { reports });
  } catch (e) {
    console.error('admin bug-reports list failed', e);
    return sendJson(res, 500, { error: 'server_error' });
  }
};

const db = require('./_lib/db');
const { verifyToken } = require('./_lib/auth');
const { parseCookies, readJsonBody, sendJson } = require('./_lib/http');

const CURRENT_SAVE_VERSION = 1;

function requireUser(req) {
  const cookies = parseCookies(req);
  const payload = cookies.mm_session && verifyToken(cookies.mm_session);
  return payload ? payload.sub : null;
};

module.exports = async (req, res) => {
  const userId = requireUser(req);
  if (!userId) return sendJson(res, 401, { error: 'not_authenticated' });

  if (req.method === 'GET') {
    try {
      const progress = await db.getProgress(userId);
      return sendJson(res, 200, { progress: progress || null });
    } catch (e) {
      console.error('progress GET failed', e);
      return sendJson(res, 500, { error: 'server_error', message: 'Your local progress is still available. Cloud synchronization could not be completed.' });
    }
  }

  if (req.method === 'PUT') {
    let body;
    try { body = await readJsonBody(req); } catch (e) { return sendJson(res, 400, { error: 'bad_request' }); }
    const { language, chapter, gameState, settings } = body || {};
    if (typeof chapter !== 'number' || chapter < 0 || chapter > 6) return sendJson(res, 400, { error: 'invalid_progress' });

    try {
      const existing = await db.getProgress(userId);
      // Conflict rule: never silently overwrite a MORE advanced save with a less
      // advanced one. Chapter number is the save-granularity boundary the whole
      // game already saves at, so it's the right proxy for "more advanced".
      if (existing && existing.chapter > chapter) {
        return sendJson(res, 200, { resolved: 'existing', progress: existing, message: 'Your account already has more advanced progress (Chapter ' + existing.chapter + '). That was kept instead.' });
      }
      const saved = await db.upsertProgress(userId, {
        saveVersion: CURRENT_SAVE_VERSION,
        language: language === 'bn' ? 'bn' : 'en',
        chapter,
        gameState: gameState || {},
        settings: settings || {}
      });
      return sendJson(res, 200, { resolved: existing ? 'merged' : 'created', progress: saved });
    } catch (e) {
      console.error('progress PUT failed', e);
      return sendJson(res, 500, { error: 'server_error', message: 'Your local progress is still available. Cloud synchronization could not be completed.' });
    }
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
};

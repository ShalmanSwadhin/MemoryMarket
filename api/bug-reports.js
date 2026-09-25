const db = require('./_lib/db');
const { verifyToken } = require('./_lib/auth');
const { readJsonBody, parseCookies, sendJson, rateLimited } = require('./_lib/http');

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const MAX_DESC = 4000, MAX_STEPS = 4000, MAX_SHORT = 200;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (rateLimited('bugreport:' + ip, 8, 10 * 60 * 1000)) {
    return sendJson(res, 429, { error: 'rate_limited', message: 'Too many reports submitted. Please wait a while before sending another.' });
  }

  let body;
  try { body = await readJsonBody(req); } catch (e) { return sendJson(res, 400, { error: 'bad_request' }); }
  const {
    description, steps, severity, device, browser, os, screenWidth, screenHeight,
    gameVersion, chapter, language, guestId, contactEmail
  } = body || {};
  // attribution to an account comes from the verified session, never from
  // client-supplied input - otherwise any caller could claim to be any user
  const cookies = parseCookies(req);
  const sessionPayload = cookies.mm_session && verifyToken(cookies.mm_session);
  const userId = sessionPayload ? sessionPayload.sub : null;

  if (typeof description !== 'string' || !description.trim() || description.length > MAX_DESC) {
    return sendJson(res, 400, { error: 'invalid_description', message: 'Please describe what happened (up to 4000 characters).' });
  }
  if (steps !== undefined && steps !== null && (typeof steps !== 'string' || steps.length > MAX_STEPS)) {
    return sendJson(res, 400, { error: 'invalid_steps' });
  }
  const sev = SEVERITIES.includes(severity) ? severity : 'low';
  if (contactEmail && (typeof contactEmail !== 'string' || contactEmail.length > MAX_SHORT)) {
    return sendJson(res, 400, { error: 'invalid_email' });
  }

  const clamp = (s, n) => (typeof s === 'string' ? s.slice(0, n) : null);

  try {
    // per-identity duplicate/spam guard, in addition to the per-IP one above
    const since = 60 * 1000;
    const recentCount = await db.countRecentReportsFrom({ guestId: clamp(guestId, 80), userId: clamp(userId, 80), sinceMs: since });
    if (recentCount >= 2) return sendJson(res, 429, { error: 'rate_limited', message: 'Please wait a moment before submitting another report.' });

    const report = await db.createBugReport({
      description: description.trim().slice(0, MAX_DESC),
      steps: steps ? steps.trim().slice(0, MAX_STEPS) : null,
      severity: sev,
      device: clamp(device, MAX_SHORT),
      browser: clamp(browser, MAX_SHORT),
      os: clamp(os, MAX_SHORT),
      screenWidth: Number.isFinite(screenWidth) ? Math.round(screenWidth) : null,
      screenHeight: Number.isFinite(screenHeight) ? Math.round(screenHeight) : null,
      gameVersion: clamp(gameVersion, 40),
      chapter: Number.isFinite(chapter) ? Math.round(chapter) : null,
      language: clamp(language, 10),
      userId: clamp(userId, 80),
      guestId: clamp(guestId, 80),
      contactEmail: clamp(contactEmail, MAX_SHORT)
    });
    return sendJson(res, 201, { id: report.id });
  } catch (e) {
    console.error('bug report failed', e);
    return sendJson(res, 500, { error: 'server_error', message: 'Your report could not be submitted. Please try again.' });
  }
};

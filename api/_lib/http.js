/* Small portable helpers so the same handler code works under Vercel's Node
   runtime (which pre-parses req.body/req.cookies) and under the plain
   http.createServer harness used for local testing (scripts/dev-server.js). */

async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') { try { return req.body ? JSON.parse(req.body) : {}; } catch (e) { return {}; } }
    return req.body || {};
  }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function parseCookies(req) {
  if (req.cookies) return req.cookies;
  const header = req.headers && req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  parts.push('HttpOnly');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (process.env.NODE_ENV !== 'development') parts.push('Secure');
  const prev = res.getHeader('Set-Cookie');
  const arr = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
  arr.push(parts.join('; '));
  res.setHeader('Set-Cookie', arr);
}

function clearCookie(res, name) { setCookie(res, name, '', { maxAge: 0 }); }

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// crude in-memory rate limit, per serverless instance - good enough alongside
// the per-identity DB-backed check in bug-reports.js; resets on cold start.
const hits = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}

module.exports = { readJsonBody, parseCookies, setCookie, clearCookie, sendJson, rateLimited };

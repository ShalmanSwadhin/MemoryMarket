#!/usr/bin/env node
/* Local dev/test server that mirrors Vercel's own routing (api/*.js files
   become HTTP routes at the matching /api/* path; everything else is served
   as a static file from the project root) closely enough to exercise the
   real handler code with real HTTP requests + cookies, without needing the
   Vercel CLI or an account login. Used by scripts/run-tests.js. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8090;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain', '.png': 'image/png', '.svg': 'image/svg+xml' };

// Route table: exact paths + one dynamic segment for [id].js style files.
const routes = [
  ['POST', '/api/register', '../api/register.js'],
  ['POST', '/api/login', '../api/login.js'],
  ['POST', '/api/logout', '../api/logout.js'],
  ['GET', '/api/me', '../api/me.js'],
  ['GET', '/api/progress', '../api/progress.js'],
  ['PUT', '/api/progress', '../api/progress.js'],
  ['POST', '/api/bug-reports', '../api/bug-reports.js'],
  ['POST', '/api/admin/login', '../api/admin/login.js'],
  ['POST', '/api/admin/logout', '../api/admin/logout.js'],
  ['GET', '/api/admin/me', '../api/admin/me.js'],
  ['GET', '/api/admin/bug-reports', '../api/admin/bug-reports.js']
];

function matchDynamic(pathname) {
  const m = pathname.match(/^\/api\/admin\/bug-reports\/([^/]+)$/);
  if (m) return { file: '../api/admin/bug-reports/[id].js', params: { id: m[1] } };
  return null;
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const pathname = decodeURIComponent(parsed.pathname);

  const exact = routes.find(([method, p]) => method === req.method && p === pathname);
  const dyn = !exact && matchDynamic(pathname);

  if (exact || dyn) {
    try {
      const modPath = exact ? exact[2] : dyn.file;
      delete require.cache[require.resolve(modPath)];
      const handler = require(modPath);
      req.query = dyn ? dyn.params : {};
      await handler(req, res);
    } catch (e) {
      console.error('handler error', pathname, e);
      if (!res.headersSent) { res.statusCode = 500; res.end(JSON.stringify({ error: 'server_error' })); }
    }
    return;
  }

  // static files
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT)) { res.statusCode = 403; return res.end('forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('not found: ' + pathname); }
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));

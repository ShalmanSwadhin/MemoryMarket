#!/usr/bin/env node
/* Automated backend regression test: boots the dev server against a throwaway
   SQLite file (never touches a real DATABASE_URL) and exercises the actual
   API routes over real HTTP - registration, login, the save-conflict rule,
   guest bug reports, and admin auth/listing/update. Run with `npm test`. */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 8099;
const BASE = `http://localhost:${PORT}`;
const DB_FILE = path.join(os.tmpdir(), 'memory-market-test-' + Date.now() + '.sqlite');

let pass = 0, fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log('  ok -', label); }
  else { fail++; console.error('  FAIL -', label); }
}

function cookieJar() {
  const jar = {};
  return {
    apply(headers) { const c = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '); if (c) headers.Cookie = c; },
    capture(res) {
      const set = res.headers.raw ? res.headers.raw()['set-cookie'] : res.headers.get('set-cookie');
      const arr = Array.isArray(set) ? set : (set ? [set] : []);
      arr.forEach((c) => { const [pair] = c.split(';'); const i = pair.indexOf('='); if (i > -1) jar[pair.slice(0, i)] = pair.slice(i + 1); });
    }
  };
}
async function call(jar, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (jar) jar.apply(headers);
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (jar) jar.capture(res);
  let json = {}; try { json = await res.json(); } catch (e) { }
  return { status: res.status, body: json };
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE + '/index.html'); if (r.ok) return true; } catch (e) { }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('dev server did not start in time');
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, 'dev-server.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), MM_SQLITE_PATH: DB_FILE, NODE_ENV: 'development',
      JWT_SECRET: 'test-secret', ADMIN_EMAIL: 'admin@test.local', ADMIN_PASSWORD_HASH: require('bcryptjs').hashSync('testadminpw', 10)
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout.on('data', () => { }); server.stderr.on('data', (d) => process.stderr.write('[server] ' + d));

  try {
    await waitForServer();
    const email = `test${Date.now()}@example.com`;

    console.log('Auth + progress:');
    const jar = cookieJar();
    let r = await call(jar, 'POST', '/api/register', { username: 'Tester', email, password: 'testpass123' });
    assert(r.status === 201 && r.body.user, 'register succeeds');
    r = await call(jar, 'GET', '/api/me');
    assert(r.status === 200 && r.body.user.email === email, 'session cookie authenticates /api/me');
    r = await call(jar, 'PUT', '/api/progress', { language: 'en', chapter: 3, gameState: { evidence: { E01: 1 } }, settings: {} });
    assert(r.status === 200 && r.body.progress.chapter === 3, 'progress save (chapter 3) succeeds');
    r = await call(jar, 'PUT', '/api/progress', { language: 'en', chapter: 1, gameState: {}, settings: {} });
    assert(r.status === 200 && r.body.resolved === 'existing' && r.body.progress.chapter === 3, 'save-conflict rule keeps the more advanced save (ch3, not ch1)');
    r = await call(null, 'POST', '/api/register', { username: 'Dup', email, password: 'testpass123' });
    assert(r.status === 409, 'duplicate email is rejected');
    r = await call(null, 'POST', '/api/login', { email, password: 'wrongpassword' });
    assert(r.status === 401, 'wrong password is rejected');

    console.log('Bug reports:');
    r = await call(null, 'POST', '/api/bug-reports', { description: 'automated test report', severity: 'high', guestId: 'test-guest-1' });
    assert(r.status === 201 && r.body.id, 'guest bug report submission succeeds');
    r = await call(null, 'POST', '/api/bug-reports', { description: '' });
    assert(r.status === 400, 'empty description is rejected');

    console.log('Admin:');
    const adminJar = cookieJar();
    r = await call(adminJar, 'GET', '/api/admin/bug-reports');
    assert(r.status === 401, 'admin routes reject an unauthenticated request');
    r = await call(adminJar, 'POST', '/api/admin/login', { email: 'admin@test.local', password: 'wrong' });
    assert(r.status === 401, 'wrong admin password is rejected');
    r = await call(adminJar, 'POST', '/api/admin/login', { email: 'admin@test.local', password: 'testadminpw' });
    assert(r.status === 200, 'admin login succeeds');
    r = await call(adminJar, 'GET', '/api/admin/bug-reports');
    assert(r.status === 200 && r.body.reports.some((x) => x.description === 'automated test report'), 'admin can list the submitted report');
    const id = r.body.reports.find((x) => x.description === 'automated test report').id;
    r = await call(adminJar, 'PATCH', '/api/admin/bug-reports/' + id, { status: 'fixed', developerNotes: 'closed by test' });
    assert(r.status === 200 && r.body.report.status === 'fixed', 'admin can update report status + notes');
  } finally {
    server.kill();
    try { fs.unlinkSync(DB_FILE); } catch (e) { }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('test runner crashed:', e); process.exit(1); });

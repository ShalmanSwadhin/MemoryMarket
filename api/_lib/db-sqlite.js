/* Local-dev-only persistence backend. Used ONLY when no DATABASE_URL/POSTGRES_URL
   env var is set, so that backend logic can be developed and tested end-to-end
   without a hosted database. Production on Vercel must set DATABASE_URL (or the
   Vercel Postgres POSTGRES_URL), which switches to db-pg.js instead - see db.js. */
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const FILE = process.env.MM_SQLITE_PATH || path.join(__dirname, '..', '..', '.data', 'dev.sqlite');
require('fs').mkdirSync(path.dirname(FILE), { recursive: true });

const db = new DatabaseSync(FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS game_progress (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    save_version INTEGER NOT NULL DEFAULT 1,
    language TEXT NOT NULL DEFAULT 'en',
    chapter INTEGER NOT NULL DEFAULT 0,
    game_state TEXT NOT NULL DEFAULT '{}',
    settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bug_reports (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    steps TEXT,
    severity TEXT NOT NULL DEFAULT 'low',
    device TEXT, browser TEXT, os TEXT,
    screen_width INTEGER, screen_height INTEGER,
    game_version TEXT,
    chapter INTEGER,
    language TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    guest_id TEXT,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    developer_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const row2user = (r) => r && { id: r.id, username: r.username, email: r.email, passwordHash: r.password_hash, createdAt: r.created_at, updatedAt: r.updated_at };
const row2progress = (r) => r && { userId: r.user_id, saveVersion: r.save_version, language: r.language, chapter: r.chapter, gameState: JSON.parse(r.game_state), settings: JSON.parse(r.settings), createdAt: r.created_at, updatedAt: r.updated_at };
const row2report = (r) => r && { id: r.id, description: r.description, steps: r.steps, severity: r.severity, device: r.device, browser: r.browser, os: r.os, screenWidth: r.screen_width, screenHeight: r.screen_height, gameVersion: r.game_version, chapter: r.chapter, language: r.language, userId: r.user_id, guestId: r.guest_id, contactEmail: r.contact_email, status: r.status, developerNotes: r.developer_notes, createdAt: r.created_at, updatedAt: r.updated_at };

module.exports = {
  backend: 'sqlite-dev',

  async createUser({ username, email, passwordHash }) {
    const id = uuid(), t = now();
    db.prepare('INSERT INTO users (id, username, email, password_hash, created_at, updated_at) VALUES (?,?,?,?,?,?)')
      .run(id, username, email.toLowerCase(), passwordHash, t, t);
    return row2user(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  },
  async getUserByEmail(email) {
    return row2user(db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase()));
  },
  async getUserById(id) {
    return row2user(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  },

  async getProgress(userId) {
    return row2progress(db.prepare('SELECT * FROM game_progress WHERE user_id = ?').get(userId));
  },
  async upsertProgress(userId, { saveVersion, language, chapter, gameState, settings }) {
    const t = now();
    const existing = db.prepare('SELECT user_id FROM game_progress WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare('UPDATE game_progress SET save_version=?, language=?, chapter=?, game_state=?, settings=?, updated_at=? WHERE user_id=?')
        .run(saveVersion, language, chapter, JSON.stringify(gameState || {}), JSON.stringify(settings || {}), t, userId);
    } else {
      db.prepare('INSERT INTO game_progress (user_id, save_version, language, chapter, game_state, settings, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(userId, saveVersion, language, chapter, JSON.stringify(gameState || {}), JSON.stringify(settings || {}), t, t);
    }
    return row2progress(db.prepare('SELECT * FROM game_progress WHERE user_id = ?').get(userId));
  },

  async createBugReport(r) {
    const id = uuid(), t = now();
    db.prepare(`INSERT INTO bug_reports (id, description, steps, severity, device, browser, os, screen_width, screen_height, game_version, chapter, language, user_id, guest_id, contact_email, status, developer_notes, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, r.description, r.steps || null, r.severity, r.device || null, r.browser || null, r.os || null,
        r.screenWidth || null, r.screenHeight || null, r.gameVersion || null, r.chapter ?? null, r.language || null,
        r.userId || null, r.guestId || null, r.contactEmail || null, 'open', null, t, t);
    return row2report(db.prepare('SELECT * FROM bug_reports WHERE id = ?').get(id));
  },
  async listBugReports({ status, severity, chapter, language, limit = 100 } = {}) {
    let sql = 'SELECT * FROM bug_reports WHERE 1=1', params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (severity) { sql += ' AND severity = ?'; params.push(severity); }
    if (chapter !== undefined && chapter !== null && chapter !== '') { sql += ' AND chapter = ?'; params.push(Number(chapter)); }
    if (language) { sql += ' AND language = ?'; params.push(language); }
    sql += ' ORDER BY created_at DESC LIMIT ?'; params.push(limit);
    return db.prepare(sql).all(...params).map(row2report);
  },
  async getBugReport(id) {
    return row2report(db.prepare('SELECT * FROM bug_reports WHERE id = ?').get(id));
  },
  async updateBugReport(id, { status, developerNotes }) {
    const t = now();
    const cur = db.prepare('SELECT * FROM bug_reports WHERE id = ?').get(id);
    if (!cur) return null;
    db.prepare('UPDATE bug_reports SET status = COALESCE(?, status), developer_notes = COALESCE(?, developer_notes), updated_at = ? WHERE id = ?')
      .run(status || null, developerNotes === undefined ? null : developerNotes, t, id);
    return row2report(db.prepare('SELECT * FROM bug_reports WHERE id = ?').get(id));
  },

  async countRecentReportsFrom({ guestId, userId, ip, sinceMs }) {
    const since = new Date(Date.now() - sinceMs).toISOString();
    if (userId) return db.prepare('SELECT COUNT(*) c FROM bug_reports WHERE user_id = ? AND created_at > ?').get(userId, since).c;
    if (guestId) return db.prepare('SELECT COUNT(*) c FROM bug_reports WHERE guest_id = ? AND created_at > ?').get(guestId, since).c;
    return 0;
  }
};

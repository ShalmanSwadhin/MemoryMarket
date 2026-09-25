/* Production persistence backend: Postgres via Neon's serverless driver (the
   driver Vercel's own Postgres integration is now built on), used whenever
   DATABASE_URL / POSTGRES_URL is set. Same function surface as db-sqlite.js so
   api/*.js never needs to know which one it's talking to (see db.js). */
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL, { fullResults: true });

let initPromise = null;
function ensureSchema() {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
      await sql`CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS game_progress (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        save_version INT NOT NULL DEFAULT 1,
        language TEXT NOT NULL DEFAULT 'en',
        chapter INT NOT NULL DEFAULT 0,
        game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS bug_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description TEXT NOT NULL,
        steps TEXT,
        severity TEXT NOT NULL DEFAULT 'low',
        device TEXT, browser TEXT, os TEXT,
        screen_width INT, screen_height INT,
        game_version TEXT,
        chapter INT,
        language TEXT,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        guest_id TEXT,
        contact_email TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        developer_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON bug_reports (status)`;
      await sql`CREATE INDEX IF NOT EXISTS bug_reports_created_idx ON bug_reports (created_at DESC)`;
    })();
  }
  return initPromise;
}

const row2user = (r) => r && { id: r.id, username: r.username, email: r.email, passwordHash: r.password_hash, createdAt: r.created_at, updatedAt: r.updated_at };
const row2progress = (r) => r && { userId: r.user_id, saveVersion: r.save_version, language: r.language, chapter: r.chapter, gameState: r.game_state, settings: r.settings, createdAt: r.created_at, updatedAt: r.updated_at };
const row2report = (r) => r && { id: r.id, description: r.description, steps: r.steps, severity: r.severity, device: r.device, browser: r.browser, os: r.os, screenWidth: r.screen_width, screenHeight: r.screen_height, gameVersion: r.game_version, chapter: r.chapter, language: r.language, userId: r.user_id, guestId: r.guest_id, contactEmail: r.contact_email, status: r.status, developerNotes: r.developer_notes, createdAt: r.created_at, updatedAt: r.updated_at };

module.exports = {
  backend: 'postgres',

  async createUser({ username, email, passwordHash }) {
    await ensureSchema();
    const { rows } = await sql`INSERT INTO users (username, email, password_hash) VALUES (${username}, ${email.toLowerCase()}, ${passwordHash}) RETURNING *`;
    return row2user(rows[0]);
  },
  async getUserByEmail(email) {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase()}`;
    return row2user(rows[0]);
  },
  async getUserById(id) {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`;
    return row2user(rows[0]);
  },

  async getProgress(userId) {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM game_progress WHERE user_id = ${userId}`;
    return row2progress(rows[0]);
  },
  async upsertProgress(userId, { saveVersion, language, chapter, gameState, settings }) {
    await ensureSchema();
    const { rows } = await sql`
      INSERT INTO game_progress (user_id, save_version, language, chapter, game_state, settings, updated_at)
      VALUES (${userId}, ${saveVersion}, ${language}, ${chapter}, ${JSON.stringify(gameState || {})}::jsonb, ${JSON.stringify(settings || {})}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET
        save_version = EXCLUDED.save_version, language = EXCLUDED.language, chapter = EXCLUDED.chapter,
        game_state = EXCLUDED.game_state, settings = EXCLUDED.settings, updated_at = now()
      RETURNING *`;
    return row2progress(rows[0]);
  },

  async createBugReport(r) {
    await ensureSchema();
    const { rows } = await sql`
      INSERT INTO bug_reports (description, steps, severity, device, browser, os, screen_width, screen_height, game_version, chapter, language, user_id, guest_id, contact_email)
      VALUES (${r.description}, ${r.steps || null}, ${r.severity}, ${r.device || null}, ${r.browser || null}, ${r.os || null},
        ${r.screenWidth || null}, ${r.screenHeight || null}, ${r.gameVersion || null}, ${r.chapter ?? null}, ${r.language || null},
        ${r.userId || null}, ${r.guestId || null}, ${r.contactEmail || null})
      RETURNING *`;
    return row2report(rows[0]);
  },
  async listBugReports({ status, severity, chapter, language, limit = 100 } = {}) {
    await ensureSchema();
    const { rows } = await sql`
      SELECT * FROM bug_reports
      WHERE (${status || null}::text IS NULL OR status = ${status || null})
        AND (${severity || null}::text IS NULL OR severity = ${severity || null})
        AND (${(chapter === undefined || chapter === null || chapter === '') ? null : Number(chapter)}::int IS NULL OR chapter = ${(chapter === undefined || chapter === null || chapter === '') ? null : Number(chapter)}::int)
        AND (${language || null}::text IS NULL OR language = ${language || null})
      ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map(row2report);
  },
  async getBugReport(id) {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM bug_reports WHERE id = ${id}`;
    return row2report(rows[0]);
  },
  async updateBugReport(id, { status, developerNotes }) {
    await ensureSchema();
    const { rows } = await sql`
      UPDATE bug_reports SET
        status = COALESCE(${status || null}, status),
        developer_notes = COALESCE(${developerNotes === undefined ? null : developerNotes}, developer_notes),
        updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return row2report(rows[0]);
  },

  async countRecentReportsFrom({ guestId, userId, sinceMs }) {
    await ensureSchema();
    const sinceIso = new Date(Date.now() - sinceMs).toISOString();
    if (userId) { const { rows } = await sql`SELECT COUNT(*)::int c FROM bug_reports WHERE user_id = ${userId} AND created_at > ${sinceIso}`; return rows[0].c; }
    if (guestId) { const { rows } = await sql`SELECT COUNT(*)::int c FROM bug_reports WHERE guest_id = ${guestId} AND created_at > ${sinceIso}`; return rows[0].c; }
    return 0;
  }
};

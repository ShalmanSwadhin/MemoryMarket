/* Picks the real backend: Postgres in production (DATABASE_URL or POSTGRES_URL
   set - Vercel's own "Create Database -> Postgres" integration sets POSTGRES_URL
   automatically), or a local SQLite file when neither is set, so the API routes
   can be developed and tested without a hosted database. api/*.js files should
   only ever import this module, never db-pg.js/db-sqlite.js directly. */
const hasProdDb = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
module.exports = hasProdDb ? require('./db-pg') : require('./db-sqlite');

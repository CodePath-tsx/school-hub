// better-sqlite3 persistence for the packaged desktop app.
//
// The renderer keeps one JSON document (the same shape as src/lib/store.ts).
// We persist it inside a real SQLite file at <userData>/schoolbyte.db so the
// data survives restarts, can be backed up as a single file, and can later be
// normalised into proper tables without changing the renderer API.

const path = require("path");
const fs = require("fs");

let db = null;
let dbFile = null;

function init(userDataDir) {
  if (db) return db;
  fs.mkdirSync(userDataDir, { recursive: true });
  dbFile = path.join(userDataDir, "schoolbyte.db");

  // Loaded lazily so the app still boots (with a JSON fallback) when the
  // native module was not rebuilt for this Electron version.
  const Database = require("better-sqlite3");
  db = new Database(dbFile);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backups (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      value      TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

function read() {
  if (!db) return null;
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("db");
  return row ? row.value : null;
}

function write(json) {
  if (!db) return false;
  db.prepare(
    `INSERT INTO app_state (key, value, updated_at) VALUES ('db', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(json, new Date().toISOString());
  return true;
}

function backup() {
  if (!db) return false;
  const current = read();
  if (!current) return false;
  db.prepare("INSERT INTO backups (value, created_at) VALUES (?, ?)").run(current, new Date().toISOString());
  // keep the last 20 snapshots only
  db.exec("DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT 20)");
  return true;
}

function file() {
  return dbFile;
}

module.exports = { init, read, write, backup, file };

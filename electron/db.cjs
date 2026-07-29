const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db;

function getDbPath() {
  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, 'schoolhub.db');
}

function init() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.prepare(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      dob TEXT,
      grade TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      teacher TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `).run();
}

function getAll(table) {
  const stmt = db.prepare(`SELECT * FROM ${table}`);
  return stmt.all();
}

function insert(table, row) {
  const keys = Object.keys(row);
  if (keys.length === 0) return { lastInsertRowid: null };
  const placeholders = keys.map(() => '?').join(', ');
  const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
  const info = stmt.run(...keys.map(k => row[k]));
  return { lastInsertRowid: info.lastInsertRowid };
}

function update(table, id, row) {
  const keys = Object.keys(row);
  if (keys.length === 0) return { changes: 0 };
  const assignments = keys.map(k => `${k} = ?`).join(', ');
  const stmt = db.prepare(`UPDATE ${table} SET ${assignments}, updated_at = datetime('now') WHERE id = ?`);
  const info = stmt.run(...keys.map(k => row[k]), id);
  return { changes: info.changes };
}

function del(table, id) {
  const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
  const info = stmt.run(id);
  return { changes: info.changes };
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    // reader property indicates SELECT
    if (stmt.reader) return stmt.all(...params);
    return stmt.run(...params);
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { init, getAll, insert, update, delete: del, query };

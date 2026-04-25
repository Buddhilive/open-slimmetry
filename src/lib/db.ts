import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'slimmetry.db')

function initDb(): Database.Database {
  const dir = path.dirname(DB_PATH)
  fs.mkdirSync(dir, { recursive: true })

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      trace_id    TEXT,
      log_type    TEXT,
      log         TEXT NOT NULL,
      service     TEXT,
      environment TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_received_at ON logs(received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_trace_id    ON logs(trace_id);
    CREATE INDEX IF NOT EXISTS idx_log_type    ON logs(log_type);

    CREATE VIRTUAL TABLE IF NOT EXISTS logs_fts USING fts5(
      log,
      log_type,
      service,
      content='logs',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS logs_ai AFTER INSERT ON logs BEGIN
      INSERT INTO logs_fts(rowid, log, log_type, service)
      VALUES (new.id, new.log, new.log_type, new.service);
    END;

    CREATE TRIGGER IF NOT EXISTS logs_ad AFTER DELETE ON logs BEGIN
      INSERT INTO logs_fts(logs_fts, rowid, log, log_type, service)
      VALUES ('delete', old.id, old.log, old.log_type, old.service);
    END;
  `)

  return db
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = initDb()
  }
  return _db
}

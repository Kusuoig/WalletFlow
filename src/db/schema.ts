import * as SQLite from 'expo-sqlite';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('tarjetas.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS cards (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      bank        TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('debit', 'credit')),
      balance     REAL NOT NULL DEFAULT 0,
      credit_limit REAL,          -- only for credit, can be null
      due_date    INTEGER,        -- cut-off day of the month (1-31), only credit
      color       TEXT,           -- hex color for the card in UI
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      description     TEXT NOT NULL,
      type            TEXT NOT NULL CHECK(type IN ('payment', 'adjustment', 'transfer')),
      amount          REAL NOT NULL,
      source_card_id  INTEGER REFERENCES cards(id) ON DELETE SET NULL,
      target_card_id  INTEGER REFERENCES cards(id) ON DELETE SET NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
  
  return db;
}

export const getDb = async () => {
  return await SQLite.openDatabaseAsync('tarjetas.db');
};

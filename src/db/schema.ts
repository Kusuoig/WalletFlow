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
      payment_due_day INTEGER,    -- payment due day of the month (1-31), only credit
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

  // Migración para añadir payment_due_day a bases de datos existentes
  try {
    await db.execAsync('ALTER TABLE cards ADD COLUMN payment_due_day INTEGER;');
  } catch (error) {
    // Si la columna ya existe, SQLite lanzará un error que podemos ignorar
  }
  
  return db;
}

export const getDb = async () => {
  return await SQLite.openDatabaseAsync('tarjetas.db');
};

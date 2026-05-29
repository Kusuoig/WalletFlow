import { getDb } from './schema';
import { Card, Transaction } from '../types';

export const exportData = async () => {
  const db = await getDb();
  const cards = await db.getAllAsync<Card>('SELECT * FROM cards');
  const transactions = await db.getAllAsync<Transaction>('SELECT * FROM transactions');
  return { cards, transactions };
};

export const importData = async (data: { cards: Card[]; transactions: Transaction[] }) => {
  const db = await getDb();
  
  // Borrar datos actuales
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM transactions;
    DELETE FROM cards;
    UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('cards', 'transactions');
    PRAGMA foreign_keys = ON;
  `);

  // Insertar tarjetas
  for (const card of data.cards) {
    await db.runAsync(
      `INSERT INTO cards (id, name, bank, type, balance, credit_limit, due_date, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id, card.name, card.bank, card.type, card.balance, 
        card.credit_limit || null, card.due_date || null, card.color || null,
        card.created_at, card.updated_at
      ]
    );
  }

  // Insertar transacciones
  for (const t of data.transactions) {
    await db.runAsync(
      `INSERT INTO transactions (id, description, type, amount, source_card_id, target_card_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.description, t.type, t.amount, 
        t.source_card_id || null, t.target_card_id || null, t.created_at
      ]
    );
  }
};

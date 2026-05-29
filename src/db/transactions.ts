import { getDb } from './schema';
import { Transaction } from '../types';

export const getTransactionsByCard = async (cardId: number): Promise<Transaction[]> => {
  const db = await getDb();
  return await db.getAllAsync<Transaction>(
    `SELECT * FROM transactions 
     WHERE source_card_id = ? OR target_card_id = ? 
     ORDER BY created_at DESC`,
    [cardId, cardId]
  );
};

export const addAdjustment = async (
  cardId: number, 
  description: string, 
  amount: number, 
  newBalance: number
) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO transactions (description, type, amount, source_card_id, target_card_id) 
     VALUES (?, ?, ?, ?, ?)`,
    [description, 'adjustment', amount, cardId, null]
  );

  await db.runAsync(
    'UPDATE cards SET balance = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
    [newBalance, cardId]
  );
};

export const processPayment = async (
  creditCardId: number,
  newCreditBalance: number,
  payments: { sourceId: number; amount: number; newSourceBalance: number }[],
  description: string
) => {
  const db = await getDb();
  
  for (const pay of payments) {
    if (pay.amount <= 0) continue;
    
    await db.runAsync(
      `INSERT INTO transactions (description, type, amount, source_card_id, target_card_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [description, 'payment', pay.amount, pay.sourceId, creditCardId]
    );

    await db.runAsync(
      'UPDATE cards SET balance = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
      [pay.newSourceBalance, pay.sourceId]
    );
  }

  await db.runAsync(
    'UPDATE cards SET balance = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
    [newCreditBalance, creditCardId]
  );
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = await getDb();
  return await db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY created_at DESC');
};

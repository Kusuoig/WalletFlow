import { getDb } from './schema';
import { Card } from '../types';

export const getCards = async (): Promise<Card[]> => {
  const db = await getDb();
  return await db.getAllAsync<Card>('SELECT * FROM cards ORDER BY created_at DESC');
};

export const addCard = async (
  name: string,
  bank: string,
  type: 'debit' | 'credit',
  balance: number,
  creditLimit?: number,
  dueDate?: number,
  color?: string
): Promise<number> => {
  const db = await getDb();
  
  const result = await db.runAsync(
    `INSERT INTO cards (name, bank, type, balance, credit_limit, due_date, color) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      bank,
      type,
      type === 'credit' ? -Math.abs(balance) : balance,
      creditLimit || null,
      dueDate || null,
      color || null,
    ]
  );
  
  return result.lastInsertRowId;
};

export const updateCardBalance = async (id: number, newBalance: number) => {
  const db = await getDb();
  await db.runAsync(
    'UPDATE cards SET balance = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
    [newBalance, id]
  );
};

export const deleteCard = async (id: number) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
};

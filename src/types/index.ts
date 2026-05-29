export type CardType = 'debit' | 'credit';
export type TransactionType = 'payment' | 'adjustment' | 'transfer';

export interface Card {
  id: number;
  name: string;
  bank: string;
  type: CardType;
  balance: number;        // negative if credit, positive if debit
  credit_limit?: number | null;
  due_date?: number | null;      // day of the month
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  description: string;
  type: TransactionType;
  amount: number;
  source_card_id?: number | null;
  target_card_id?: number | null;
  created_at: string;
}

export interface PaymentSource {
  card: Card;
  amount: number;
}

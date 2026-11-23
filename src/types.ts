export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  createdAt: string;
};

export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt'>;
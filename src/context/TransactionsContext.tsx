import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loadTransactions, saveTransactions } from '../storage/transactions';
import type { Transaction, TransactionDraft } from '../types';

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (draft: TransactionDraft) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  balance: number;
  totalIncome: number;
  totalExpense: number;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

function sortByDateDesc(items: Transaction[]): Transaction[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadTransactions();
      if (!cancelled) {
        setTransactions(sortByDateDesc(stored));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: Transaction[]) => {
    const sorted = sortByDateDesc(next);
    setTransactions(sorted);
    await saveTransactions(sorted);
  }, []);

  const addTransaction = useCallback(
    async (draft: TransactionDraft) => {
      const entry: Transaction = {
        ...draft,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      await persist([entry, ...transactions]);
    },
    [persist, transactions],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await persist(transactions.filter((t) => t.id !== id));
    },
    [persist, transactions],
  );

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  const value = useMemo(
    () => ({
      transactions,
      loading,
      addTransaction,
      removeTransaction,
      balance,
      totalIncome,
      totalExpense,
    }),
    [
      transactions,
      loading,
      addTransaction,
      removeTransaction,
      balance,
      totalIncome,
      totalExpense,
    ],
  );

  return (
    <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error('useTransactions debe usarse dentro de TransactionsProvider');
  }
  return ctx;
}
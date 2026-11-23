import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  computeAccountBalances,
  currentMonthKey,
  liquidBalance,
  mergeAccountNames,
  monthRealFlow,
  totalAccountBalance,
  type AccountBalance,
  type MonthFlow,
} from '../domain/summaries';
import { DEFAULT_ACCOUNTS } from '../domain/nekoCatalog';
import { applyImport, parseNekoCsv } from '../import/parseNekoCsv';
import { loadScheduledPayments, saveScheduledPayments } from '../storage/scheduled';
import { loadTransactions, saveTransactions } from '../storage/transactions';
import type {
  ImportResult,
  ScheduledPayment,
  ScheduledPaymentDraft,
  Transaction,
  TransactionDraft,
} from '../types';

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  transactionCount: number;
  addTransaction: (draft: TransactionDraft) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  importNekoCsv: (csv: string, mode: 'replace' | 'merge') => Promise<ImportResult>;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  transferCount: number;
  accountBalances: AccountBalance[];
  totalInAccounts: number;
  liquidAvailable: number;
  monthFlow: MonthFlow;
  accountNames: string[];
  scheduledPayments: ScheduledPayment[];
  addScheduledPayment: (draft: ScheduledPaymentDraft) => Promise<void>;
  removeScheduledPayment: (id: string) => Promise<void>;
  toggleScheduledPayment: (id: string, active: boolean) => Promise<void>;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

function sortByDateDesc(items: Transaction[]): Transaction[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, scheduled] = await Promise.all([
        loadTransactions(),
        loadScheduledPayments(),
      ]);
      if (!cancelled) {
        setTransactions(sortByDateDesc(stored));
        setScheduledPayments(scheduled);
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
      const now = new Date();
      const entry: Transaction = {
        ...draft,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: now.toISOString(),
        postedDate: draft.postedDate || now.toISOString().slice(0, 10),
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

  const persistScheduled = useCallback(async (next: ScheduledPayment[]) => {
    setScheduledPayments(next);
    await saveScheduledPayments(next);
  }, []);

  const addScheduledPayment = useCallback(
    async (draft: ScheduledPaymentDraft) => {
      const entry: ScheduledPayment = {
        ...draft,
        id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      await persistScheduled([entry, ...scheduledPayments]);
    },
    [persistScheduled, scheduledPayments],
  );

  const removeScheduledPayment = useCallback(
    async (id: string) => {
      await persistScheduled(scheduledPayments.filter((p) => p.id !== id));
    },
    [persistScheduled, scheduledPayments],
  );

  const toggleScheduledPayment = useCallback(
    async (id: string, active: boolean) => {
      await persistScheduled(
        scheduledPayments.map((p) => (p.id === id ? { ...p, active } : p)),
      );
    },
    [persistScheduled, scheduledPayments],
  );

  const importNekoCsv = useCallback(
    async (csv: string, mode: 'replace' | 'merge'): Promise<ImportResult> => {
      const { transactions: incoming, errors: parseErrors } = parseNekoCsv(csv);
      if (incoming.length === 0 && parseErrors.length > 0) {
        return { imported: 0, skipped: 0, errors: parseErrors };
      }

      const { next, result } = applyImport(transactions, incoming, mode);
      await persist(next);
      return {
        imported: result.imported,
        skipped: result.skipped,
        errors: [...parseErrors, ...result.errors],
      };
    },
    [persist, transactions],
  );

  const {
    totalIncome,
    totalExpense,
    balance,
    transferCount,
    accountBalances,
    totalInAccounts,
    liquidAvailable,
    monthFlow,
    accountNames,
  } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfers = 0;
    for (const t of transactions) {
      if (t.kind === 'transfer') {
        transfers += 1;
        continue;
      }
      if (t.kind === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    const balances = computeAccountBalances(transactions);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transferCount: transfers,
      accountBalances: balances,
      totalInAccounts: totalAccountBalance(balances),
      liquidAvailable: liquidBalance(balances),
      monthFlow: monthRealFlow(transactions, currentMonthKey()),
      accountNames: mergeAccountNames(DEFAULT_ACCOUNTS, transactions),
    };
  }, [transactions]);

  const value = useMemo(
    () => ({
      transactions,
      loading,
      transactionCount: transactions.length,
      addTransaction,
      removeTransaction,
      importNekoCsv,
      balance,
      totalIncome,
      totalExpense,
      transferCount,
      accountBalances,
      totalInAccounts,
      liquidAvailable,
      monthFlow,
      accountNames,
      scheduledPayments,
      addScheduledPayment,
      removeScheduledPayment,
      toggleScheduledPayment,
    }),
    [
      transactions,
      loading,
      addTransaction,
      removeTransaction,
      importNekoCsv,
      balance,
      totalIncome,
      totalExpense,
      transferCount,
      accountBalances,
      totalInAccounts,
      liquidAvailable,
      monthFlow,
      accountNames,
      scheduledPayments,
      addScheduledPayment,
      removeScheduledPayment,
      toggleScheduledPayment,
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
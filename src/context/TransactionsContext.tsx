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
  creditCardSummaries,
  enrichAccountsWithBillingDefaults,
} from '../domain/accounts/creditSummary';
import { applyCreditPresetToDraft } from '../domain/credit/creditPresets';
import { activeAccountNames, isAccountLiquid } from '../domain/accounts/resolveAccounts';
import { budgetProgressForMonth, type BudgetProgress } from '../domain/budgets';
import type { CreditCardSummary } from '../domain/accounts/creditSummary';
import { defaultLiquidForKind, inferAccountKind } from '../domain/accounts/inferAccountKind';
import {
  computeAccountBalances,
  currentMonthKey,
  liquidBalance,
  monthRealFlow,
  totalAccountBalance,
  type AccountBalance,
  type MonthFlow,
} from '../domain/summaries';
import { loadAccounts, saveAccounts } from '../storage/accounts';
import { loadBudgets, saveBudgets } from '../storage/budgets';
import { loadCategoryTree, saveCategoryTree, type CategoryTree } from '../storage/categoryTree';
import { applyImport, parseNekoCsv } from '../import/parseNekoCsv';
import { buildTodayAgenda, buildTomorrowHeadline } from '../domain/today';
import { buildUpcoming, type UpcomingItem } from '../domain/upcoming';
import { loadInstallmentPlans, saveInstallmentPlans } from '../storage/installments';
import { loadScheduledPayments, saveScheduledPayments } from '../storage/scheduled';
import { loadTransactions, saveTransactions } from '../storage/transactions';
import { classifyNekoType } from '../import/nekoMapping';
import type {
  AccountDef,
  AccountDefDraft,
  CategoryBudget,
  CategoryBudgetDraft,
  ImportResult,
  InstallmentPlan,
  InstallmentPlanDraft,
  InstallmentPlanUpdate,
  ScheduledPayment,
  ScheduledPaymentDraft,
  Transaction,
  TransactionDraft,
  TransactionUpdate,
} from '../types';

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  transactionCount: number;
  addTransaction: (draft: TransactionDraft) => Promise<void>;
  addTransferPair: (params: {
    amount: number;
    postedDate: string;
    description: string;
    notes: string;
    fromAccount: string;
    toAccount: string;
  }) => Promise<void>;
  updateTransaction: (id: string, update: TransactionUpdate) => Promise<void>;
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
  accounts: AccountDef[];
  addAccount: (draft: AccountDefDraft) => Promise<void>;
  updateAccount: (id: string, draft: AccountDefDraft) => Promise<void>;
  categoryTree: CategoryTree;
  saveCategoryTreeState: (tree: CategoryTree) => Promise<void>;
  addCategoryGroup: (name: string) => Promise<void>;
  addCategoryToGroup: (group: string, category: string) => Promise<void>;
  budgets: CategoryBudget[];
  budgetProgress: BudgetProgress[];
  creditCardSummaries: CreditCardSummary[];
  addBudget: (draft: CategoryBudgetDraft) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  toggleBudget: (id: string, active: boolean) => Promise<void>;
  scheduledPayments: ScheduledPayment[];
  addScheduledPayment: (draft: ScheduledPaymentDraft) => Promise<void>;
  removeScheduledPayment: (id: string) => Promise<void>;
  toggleScheduledPayment: (id: string, active: boolean) => Promise<void>;
  installmentPlans: InstallmentPlan[];
  addInstallmentPlan: (draft: InstallmentPlanDraft) => Promise<void>;
  removeInstallmentPlan: (id: string) => Promise<void>;
  toggleInstallmentPlan: (id: string, active: boolean) => Promise<void>;
  updateInstallmentPlan: (id: string, update: InstallmentPlanUpdate) => Promise<void>;
  upcomingItems: UpcomingItem[];
  todayAgenda: ReturnType<typeof buildTodayAgenda>;
  tomorrowHeadline: UpcomingItem[];
  addInstallmentPlansBatch: (drafts: InstallmentPlanDraft[]) => Promise<number>;
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
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [accounts, setAccounts] = useState<AccountDef[]>([]);
  const [categoryTree, setCategoryTreeState] = useState<CategoryTree>({});
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, scheduled, installments, accs, tree, budgetList] = await Promise.all([
        loadTransactions(),
        loadScheduledPayments(),
        loadInstallmentPlans(),
        loadAccounts(),
        loadCategoryTree(),
        loadBudgets(),
      ]);
      if (!cancelled) {
        const sorted = sortByDateDesc(stored);
        setTransactions(sorted);
        setScheduledPayments(scheduled);
        setInstallmentPlans(installments);
        const enrichedAccs = enrichAccountsWithBillingDefaults(accs);
        setAccounts(enrichedAccs);
        if (JSON.stringify(enrichedAccs) !== JSON.stringify(accs)) {
          await saveAccounts(enrichedAccs);
        }
        setCategoryTreeState(tree);
        setBudgets(budgetList);
        setLoading(false);
        // Sincronizar cuentas nuevas del CSV sin bloquear la UI
        const existing = new Set(accs.map((a) => a.name.trim().toLowerCase()));
        const additions: AccountDef[] = [];
        for (const t of sorted) {
          const name = t.account.trim();
          if (!name || existing.has(name.toLowerCase())) {
            continue;
          }
          existing.add(name.toLowerCase());
          const kind = inferAccountKind(name);
          additions.push({
            id: `acc-sync-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name,
            kind,
            liquid: defaultLiquidForKind(kind),
            notes: '',
            archived: false,
          });
        }
        if (additions.length) {
          const merged = [...accs, ...additions];
          setAccounts(merged);
          await saveAccounts(merged);
        }
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

  const addTransferPair = useCallback(
    async (params: {
      amount: number;
      postedDate: string;
      description: string;
      notes: string;
      fromAccount: string;
      toAccount: string;
    }) => {
      if (params.fromAccount === params.toAccount) {
        throw new Error('Las cuentas deben ser distintas');
      }
      const now = new Date().toISOString();
      const desc = params.description.trim() || 'Transferencia';
      const base = {
        kind: 'transfer' as const,
        type: 'expense' as const,
        amount: params.amount,
        postedDate: params.postedDate,
        nekoType: 'Transferencia',
        description: desc,
        categoryGroup: '',
        category: 'Transferencia',
        notes: params.notes.trim(),
        source: 'manual' as const,
      };
      const out: Transaction = {
        ...base,
        id: `${Date.now()}-out-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        account: params.fromAccount,
        signedAmount: -params.amount,
      };
      const entry: Transaction = {
        ...base,
        id: `${Date.now()}-in-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        account: params.toAccount,
        signedAmount: params.amount,
      };
      await persist([out, entry, ...transactions]);
    },
    [persist, transactions],
  );

  const updateTransaction = useCallback(
    async (id: string, update: TransactionUpdate) => {
      const idx = transactions.findIndex((t) => t.id === id);
      if (idx < 0) {
        return;
      }
      const prev = transactions[idx];
      const kind = classifyNekoType(update.nekoType);
      const type = kind === 'income' ? 'income' : 'expense';
      let signedAmount = update.signedAmount;
      if (kind !== 'transfer') {
        signedAmount = kind === 'income' ? update.amount : -update.amount;
      } else if (signedAmount === 0 || Math.sign(signedAmount) === 0) {
        signedAmount = prev.signedAmount >= 0 ? update.amount : -update.amount;
      } else {
        signedAmount = Math.sign(signedAmount) * update.amount;
      }

      const nextTx: Transaction = {
        ...prev,
        ...update,
        kind,
        type,
        signedAmount,
        source: update.source ?? prev.source,
      };
      const next = [...transactions];
      next[idx] = nextTx;
      await persist(next);
    },
    [persist, transactions],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await persist(transactions.filter((t) => t.id !== id));
    },
    [persist, transactions],
  );

  const persistAccounts = useCallback(async (next: AccountDef[]) => {
    setAccounts(next);
    await saveAccounts(next);
  }, []);

  /** Añade cuentas del historial que aún no están en el catálogo. */
  const syncAccountsFromTransactions = useCallback(
    async (txs: Transaction[]) => {
      const existing = new Set(accounts.map((a) => a.name.trim().toLowerCase()));
      const additions: AccountDef[] = [];
      for (const t of txs) {
        const name = t.account.trim();
        if (!name) {
          continue;
        }
        const key = name.toLowerCase();
        if (existing.has(key)) {
          continue;
        }
        existing.add(key);
        const kind = inferAccountKind(name);
        additions.push({
          id: `acc-sync-${key.replace(/\s+/g, '-')}-${Date.now()}`,
          name,
          kind,
          liquid: defaultLiquidForKind(kind),
          notes: '',
          archived: false,
        });
      }
      if (additions.length) {
        await persistAccounts([...accounts, ...additions]);
      }
    },
    [accounts, persistAccounts],
  );

  const addAccount = useCallback(
    async (draft: AccountDefDraft) => {
      const withPreset = applyCreditPresetToDraft(draft.name, draft) as AccountDefDraft;
      const entry: AccountDef = {
        ...withPreset,
        id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      await persistAccounts([...accounts, entry]);
    },
    [accounts, persistAccounts],
  );

  const persistCategoryTree = useCallback(async (tree: CategoryTree) => {
    setCategoryTreeState(tree);
    await saveCategoryTree(tree);
  }, []);

  const saveCategoryTreeState = persistCategoryTree;

  const addCategoryGroup = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || categoryTree[trimmed]) {
        return;
      }
      await persistCategoryTree({ ...categoryTree, [trimmed]: [] });
    },
    [categoryTree, persistCategoryTree],
  );

  const persistBudgets = useCallback(async (next: CategoryBudget[]) => {
    setBudgets(next);
    await saveBudgets(next);
  }, []);

  const addBudget = useCallback(
    async (draft: CategoryBudgetDraft) => {
      const entry: CategoryBudget = {
        ...draft,
        id: `bud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      await persistBudgets([...budgets, entry]);
    },
    [budgets, persistBudgets],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      await persistBudgets(budgets.filter((b) => b.id !== id));
    },
    [budgets, persistBudgets],
  );

  const toggleBudget = useCallback(
    async (id: string, active: boolean) => {
      await persistBudgets(budgets.map((b) => (b.id === id ? { ...b, active } : b)));
    },
    [budgets, persistBudgets],
  );

  const addCategoryToGroup = useCallback(
    async (group: string, category: string) => {
      const cat = category.trim();
      if (!cat || !categoryTree[group]) {
        return;
      }
      const list = categoryTree[group];
      if (list.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        return;
      }
      await persistCategoryTree({
        ...categoryTree,
        [group]: [...list, cat],
      });
    },
    [categoryTree, persistCategoryTree],
  );

  const updateAccount = useCallback(
    async (id: string, draft: AccountDefDraft) => {
      await persistAccounts(
        accounts.map((a) => (a.id === id ? { ...a, ...draft, id: a.id } : a)),
      );
    },
    [accounts, persistAccounts],
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

  const persistInstallments = useCallback(async (next: InstallmentPlan[]) => {
    setInstallmentPlans(next);
    await saveInstallmentPlans(next);
  }, []);

  const addInstallmentPlan = useCallback(
    async (draft: InstallmentPlanDraft) => {
      const entry: InstallmentPlan = {
        ...draft,
        id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      await persistInstallments([entry, ...installmentPlans]);
    },
    [persistInstallments, installmentPlans],
  );

  const removeInstallmentPlan = useCallback(
    async (id: string) => {
      await persistInstallments(installmentPlans.filter((p) => p.id !== id));
    },
    [persistInstallments, installmentPlans],
  );

  const toggleInstallmentPlan = useCallback(
    async (id: string, active: boolean) => {
      await persistInstallments(
        installmentPlans.map((p) => (p.id === id ? { ...p, active } : p)),
      );
    },
    [persistInstallments, installmentPlans],
  );

  const updateInstallmentPlan = useCallback(
    async (id: string, update: InstallmentPlanUpdate) => {
      await persistInstallments(
        installmentPlans.map((p) => (p.id === id ? { ...p, ...update } : p)),
      );
    },
    [persistInstallments, installmentPlans],
  );

  const upcomingItems = useMemo(
    () => buildUpcoming(scheduledPayments, installmentPlans, accounts, transactions),
    [scheduledPayments, installmentPlans, accounts, transactions],
  );

  const todayAgenda = useMemo(
    () => buildTodayAgenda(transactions, upcomingItems),
    [transactions, upcomingItems],
  );

  const tomorrowHeadline = useMemo(
    () => buildTomorrowHeadline(upcomingItems),
    [upcomingItems],
  );

  const addInstallmentPlansBatch = useCallback(
    async (drafts: InstallmentPlanDraft[]) => {
      if (!drafts.length) {
        return 0;
      }
      const entries: InstallmentPlan[] = drafts.map((draft) => ({
        ...draft,
        id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      }));
      await persistInstallments([...entries, ...installmentPlans]);
      return entries.length;
    },
    [persistInstallments, installmentPlans],
  );

  const importNekoCsv = useCallback(
    async (csv: string, mode: 'replace' | 'merge'): Promise<ImportResult> => {
      const { transactions: incoming, errors: parseErrors } = parseNekoCsv(csv);
      if (incoming.length === 0 && parseErrors.length > 0) {
        return { imported: 0, skipped: 0, errors: parseErrors, transactionsAfter: transactions };
      }

      const { next, result } = applyImport(transactions, incoming, mode);
      await persist(next);
      await syncAccountsFromTransactions(next);
      return {
        imported: result.imported,
        skipped: result.skipped,
        errors: [...parseErrors, ...result.errors],
        transactionsAfter: next,
      };
    },
    [persist, transactions, syncAccountsFromTransactions],
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
    creditSummary,
    budgetProg,
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
    const liquidFn = (name: string) => isAccountLiquid(accounts, name);
    const monthKey = currentMonthKey();
  const creditSummary = creditCardSummaries(accounts, balances, transactions, installmentPlans);
    const budgetProg = budgetProgressForMonth(budgets, transactions, monthKey);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transferCount: transfers,
      accountBalances: balances,
      totalInAccounts: totalAccountBalance(balances),
      liquidAvailable: liquidBalance(balances, liquidFn),
      monthFlow: monthRealFlow(transactions, monthKey),
      accountNames: activeAccountNames(accounts, transactions),
      creditSummary,
      budgetProg,
    };
  }, [transactions, accounts, budgets, installmentPlans]);

  const value = useMemo(
    () => ({
      transactions,
      loading,
      transactionCount: transactions.length,
      addTransaction,
      addTransferPair,
      updateTransaction,
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
      accounts,
      addAccount,
      updateAccount,
      categoryTree,
      saveCategoryTreeState,
      addCategoryGroup,
      addCategoryToGroup,
      budgets,
      budgetProgress: budgetProg,
      creditCardSummaries: creditSummary,
      addBudget,
      removeBudget,
      toggleBudget,
      scheduledPayments,
      addScheduledPayment,
      removeScheduledPayment,
      toggleScheduledPayment,
      installmentPlans,
      addInstallmentPlan,
      removeInstallmentPlan,
      toggleInstallmentPlan,
      updateInstallmentPlan,
      upcomingItems,
      todayAgenda,
      tomorrowHeadline,
      addInstallmentPlansBatch,
    }),
    [
      transactions,
      loading,
      addTransaction,
      addTransferPair,
      updateTransaction,
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
      creditSummary,
      budgetProg,
      accounts,
      addAccount,
      updateAccount,
      categoryTree,
      saveCategoryTreeState,
      addCategoryGroup,
      addCategoryToGroup,
      budgets,
      addBudget,
      removeBudget,
      toggleBudget,
      scheduledPayments,
      addScheduledPayment,
      removeScheduledPayment,
      toggleScheduledPayment,
      installmentPlans,
      addInstallmentPlan,
      removeInstallmentPlan,
      toggleInstallmentPlan,
      updateInstallmentPlan,
      upcomingItems,
      todayAgenda,
      tomorrowHeadline,
      addInstallmentPlansBatch,
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
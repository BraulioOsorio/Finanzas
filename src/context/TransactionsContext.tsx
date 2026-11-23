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
import { dedupeAccounts } from '../domain/accounts/dedupeAccounts';
import { accountDefByName, activeAccountNames, isAccountLiquid } from '../domain/accounts/resolveAccounts';
import { budgetProgressForMonth, type BudgetProgress } from '../domain/budgets';
import type { HistoryFilterState } from '../domain/historyFilters';
import { debtBucketSummaries, type DebtBucketSummary } from '../domain/debtSummary';
import type { CreditCardSummary } from '../domain/accounts/creditSummary';
import { defaultLiquidForKind, inferAccountKind } from '../domain/accounts/inferAccountKind';
import { computeNekoAccountBalances, hasNekoLedger } from '../domain/nekoLedger';
import { nekoSummaryToday, type NekoTodaySummary } from '../domain/nekoDisplay';
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
import {
  reorderCategoryInGroup,
  reorderGroup,
  renameGroupKey,
} from '../domain/category/treeOrder';
import { loadCategoryTree, saveCategoryTree, type CategoryTree } from '../storage/categoryTree';
import { applyImport, parseNekoCsv } from '../import/parseNekoCsv';
import { parseNekoSqliteFromUri } from '../import/nekoSqliteMobile';
import { mergeNekoSqliteAccounts } from '../import/parseNekoSqlite';
import { buildTodayAgenda, buildTomorrowHeadline } from '../domain/today';
import { findOverdraftAlerts, type OverdraftAlert } from '../domain/overdraftAlerts';
import { buildUpcoming, type UpcomingItem } from '../domain/upcoming';
import { loadInstallmentPlans, saveInstallmentPlans } from '../storage/installments';
import { loadScheduledPayments, saveScheduledPayments } from '../storage/scheduled';
import { loadDemoTransactionsFromBundledCsv } from '../seed/demoSeed';
import { loadTransactions, saveTransactions } from '../storage/transactions';
import { classifyNekoType } from '../import/nekoMapping';
import type {
  AccountDef,
  AccountDefDraft,
  CategoryBudget,
  CategoryBudgetDraft,
  ImportResult,
  NekoSqliteImportResult,
  InstallmentPlan,
  InstallmentPlanDraft,
  InstallmentPlanUpdate,
  ScheduledPayment,
  ScheduledPaymentDraft,
  ScheduledPaymentUpdate,
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
  /** Export completo NEKO «My Data» (SQLite), con cuentas, Plan y cuotas. */
  importNekoSqlite: (pickedUri: string, mode: 'replace' | 'merge') => Promise<NekoSqliteImportResult>;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  transferCount: number;
  accountBalances: AccountBalance[];
  totalInAccounts: number;
  liquidAvailable: number;
  /** Totales al estilo NEKO (Cuentas / TC / listas) cuando hay import SQLite. */
  nekoSummary: NekoTodaySummary | null;
  monthFlow: MonthFlow;
  accountNames: string[];
  accounts: AccountDef[];
  addAccount: (draft: AccountDefDraft) => Promise<void>;
  updateAccount: (id: string, draft: AccountDefDraft) => Promise<void>;
  categoryTree: CategoryTree;
  saveCategoryTreeState: (tree: CategoryTree) => Promise<void>;
  addCategoryGroup: (name: string) => Promise<void>;
  addCategoryToGroup: (group: string, category: string) => Promise<void>;
  renameCategoryGroup: (from: string, to: string) => Promise<void>;
  removeCategoryGroup: (group: string) => Promise<void>;
  renameCategoryInGroup: (group: string, from: string, to: string) => Promise<void>;
  removeCategoryInGroup: (group: string, category: string) => Promise<void>;
  moveCategoryGroup: (group: string, direction: -1 | 1) => Promise<void>;
  moveCategoryInGroup: (group: string, category: string, direction: -1 | 1) => Promise<void>;
  budgets: CategoryBudget[];
  budgetProgress: BudgetProgress[];
  creditCardSummaries: CreditCardSummary[];
  debtSummaries: DebtBucketSummary[];
  addBudget: (draft: CategoryBudgetDraft) => Promise<void>;
  updateBudget: (id: string, monthlyLimit: number) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  toggleBudget: (id: string, active: boolean) => Promise<void>;
  addStarterAccounts: () => Promise<void>;
  scheduledPayments: ScheduledPayment[];
  addScheduledPayment: (draft: ScheduledPaymentDraft) => Promise<void>;
  removeScheduledPayment: (id: string) => Promise<void>;
  updateScheduledPayment: (id: string, update: ScheduledPaymentUpdate) => Promise<void>;
  toggleScheduledPayment: (id: string, active: boolean) => Promise<void>;
  installmentPlans: InstallmentPlan[];
  addInstallmentPlan: (draft: InstallmentPlanDraft) => Promise<void>;
  removeInstallmentPlan: (id: string) => Promise<void>;
  toggleInstallmentPlan: (id: string, active: boolean) => Promise<void>;
  updateInstallmentPlan: (id: string, update: InstallmentPlanUpdate) => Promise<void>;
  upcomingItems: UpcomingItem[];
  overdraftAlerts: OverdraftAlert[];
  todayAgenda: ReturnType<typeof buildTodayAgenda>;
  tomorrowHeadline: UpcomingItem[];
  addInstallmentPlansBatch: (drafts: InstallmentPlanDraft[]) => Promise<number>;
  historyFilterSeed: HistoryFilterState | null;
  setHistoryFilterSeed: (filter: HistoryFilterState | null) => void;
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
  const [historyFilterSeed, setHistoryFilterSeed] = useState<HistoryFilterState | null>(null);
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
        let loaded = stored;
        if (loaded.length === 0) {
          const demo = await loadDemoTransactionsFromBundledCsv();
          if (demo.length > 0) {
            loaded = demo;
            await saveTransactions(sortByDateDesc(demo));
          }
        }
        const sorted = sortByDateDesc(loaded);
        setTransactions(sorted);
        setScheduledPayments(scheduled);
        setInstallmentPlans(installments);
        const enrichedAccs = dedupeAccounts(enrichAccountsWithBillingDefaults(accs));
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
      const fromDef = accountDefByName(accounts, params.fromAccount);
      const toDef = accountDefByName(accounts, params.toAccount);
      const out: Transaction = {
        ...base,
        id: `${Date.now()}-out-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        account: params.fromAccount,
        nekoAccountId: fromDef?.nekoSqliteId ?? fromDef?.id,
        signedAmount: -params.amount,
      };
      const entry: Transaction = {
        ...base,
        id: `${Date.now()}-in-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        account: params.toAccount,
        nekoAccountId: toDef?.nekoSqliteId ?? toDef?.id,
        signedAmount: params.amount,
      };
      await persist([out, entry, ...transactions]);
    },
    [accounts, persist, transactions],
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
        createdAt: update.createdAt ?? prev.createdAt,
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
    const cleaned = dedupeAccounts(next);
    setAccounts(cleaned);
    await saveAccounts(cleaned);
  }, []);

  /** Añade cuentas huérfanas del historial (p. ej. CSV). Tras SQLite, pasar el catálogo ya fusionado. */
  const syncAccountsFromTransactions = useCallback(
    async (txs: Transaction[], catalog?: AccountDef[]) => {
      const base = catalog ?? accounts;
      const knownNekoIds = new Set(
        base.map((a) => a.nekoSqliteId).filter((id): id is string => Boolean(id)),
      );
      const knownIds = new Set(base.map((a) => a.id));
      const knownNames = new Set(base.map((a) => a.name.trim().toLowerCase()));
      const additions: AccountDef[] = [];

      for (const t of txs) {
        if (t.nekoAccountId) {
          if (knownNekoIds.has(t.nekoAccountId) || knownIds.has(t.nekoAccountId)) {
            continue;
          }
        }
        const name = t.account.trim();
        if (!name) {
          continue;
        }
        const nameKey = name.toLowerCase();
        if (knownNames.has(nameKey)) {
          continue;
        }
        knownNames.add(nameKey);
        const kind = inferAccountKind(name);
        const id =
          t.nekoAccountId ??
          `acc-sync-${nameKey.replace(/\s+/g, '-')}-${additions.length}`;
        if (t.nekoAccountId) {
          knownNekoIds.add(t.nekoAccountId);
        }
        knownIds.add(id);
        additions.push({
          id,
          name,
          kind,
          liquid: defaultLiquidForKind(kind),
          nekoSqliteId: t.nekoAccountId,
          notes: '',
          archived: false,
        });
      }
      if (additions.length) {
        await persistAccounts(dedupeAccounts([...base, ...additions]));
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

  const patchCategoryGroupInData = useCallback(
    async (from: string, to: string) => {
      const fg = from.trim();
      const tg = to.trim();
      if (!fg || !tg || fg === tg) {
        return;
      }
      const nextTx = transactions.map((t) =>
        t.categoryGroup.trim() === fg ? { ...t, categoryGroup: tg } : t,
      );
      if (nextTx !== transactions) {
        await persist(nextTx);
      }
      await persistBudgets(
        budgets.map((b) => (b.categoryGroup.trim() === fg ? { ...b, categoryGroup: tg } : b)),
      );
      const nextSch = scheduledPayments.map((p) =>
        p.categoryGroup.trim() === fg ? { ...p, categoryGroup: tg } : p,
      );
      setScheduledPayments(nextSch);
      await saveScheduledPayments(nextSch);
      const nextIns = installmentPlans.map((p) =>
        p.categoryGroup.trim() === fg ? { ...p, categoryGroup: tg } : p,
      );
      setInstallmentPlans(nextIns);
      await saveInstallmentPlans(nextIns);
    },
    [transactions, persist, budgets, persistBudgets, scheduledPayments, installmentPlans],
  );

  const patchCategoryInData = useCallback(
    async (group: string, from: string, to: string) => {
      const fc = from.trim();
      const tc = to.trim();
      if (!group || !fc || !tc || fc === tc) {
        return;
      }
      const nextTx = transactions.map((t) =>
        t.categoryGroup.trim() === group.trim() && t.category.trim() === fc
          ? { ...t, category: tc }
          : t,
      );
      if (nextTx !== transactions) {
        await persist(nextTx);
      }
      await persistBudgets(
        budgets.map((b) =>
          b.categoryGroup.trim() === group.trim() && b.category.trim() === fc
            ? { ...b, category: tc }
            : b,
        ),
      );
      const nextSch = scheduledPayments.map((p) =>
        p.categoryGroup.trim() === group.trim() && p.category.trim() === fc
          ? { ...p, category: tc }
          : p,
      );
      setScheduledPayments(nextSch);
      await saveScheduledPayments(nextSch);
      const nextIns = installmentPlans.map((p) =>
        p.categoryGroup.trim() === group.trim() && p.category.trim() === fc
          ? { ...p, category: tc }
          : p,
      );
      setInstallmentPlans(nextIns);
      await saveInstallmentPlans(nextIns);
    },
    [transactions, persist, budgets, persistBudgets, scheduledPayments, installmentPlans],
  );

  const renameCategoryGroup = useCallback(
    async (from: string, to: string) => {
      const nextTree = renameGroupKey(categoryTree, from, to);
      if (!nextTree) {
        return;
      }
      await patchCategoryGroupInData(from, to);
      await persistCategoryTree(nextTree);
    },
    [categoryTree, patchCategoryGroupInData, persistCategoryTree],
  );

  const removeCategoryGroup = useCallback(
    async (group: string) => {
      if (!categoryTree[group]) {
        return;
      }
      const { [group]: _removed, ...rest } = categoryTree;
      await persistCategoryTree(rest);
    },
    [categoryTree, persistCategoryTree],
  );

  const renameCategoryInGroup = useCallback(
    async (group: string, from: string, to: string) => {
      const tc = to.trim();
      const list = categoryTree[group];
      if (!list || !tc) {
        return;
      }
      const nextList = list.map((c) => (c === from ? tc : c));
      await patchCategoryInData(group, from, tc);
      await persistCategoryTree({ ...categoryTree, [group]: nextList });
    },
    [categoryTree, patchCategoryInData, persistCategoryTree],
  );

  const removeCategoryInGroup = useCallback(
    async (group: string, category: string) => {
      if (!categoryTree[group]) {
        return;
      }
      await persistCategoryTree({
        ...categoryTree,
        [group]: categoryTree[group].filter((c) => c !== category),
      });
    },
    [categoryTree, persistCategoryTree],
  );

  const moveCategoryGroup = useCallback(
    async (group: string, direction: -1 | 1) => {
      await persistCategoryTree(reorderGroup(categoryTree, group, direction));
    },
    [categoryTree, persistCategoryTree],
  );

  const moveCategoryInGroup = useCallback(
    async (group: string, category: string, direction: -1 | 1) => {
      await persistCategoryTree(reorderCategoryInGroup(categoryTree, group, category, direction));
    },
    [categoryTree, persistCategoryTree],
  );

  const updateBudget = useCallback(
    async (id: string, monthlyLimit: number) => {
      if (monthlyLimit <= 0) {
        return;
      }
      await persistBudgets(
        budgets.map((b) => (b.id === id ? { ...b, monthlyLimit: Math.round(monthlyLimit) } : b)),
      );
    },
    [budgets, persistBudgets],
  );

  const addStarterAccounts = useCallback(async () => {
    const existing = new Set(accounts.map((a) => a.name.trim().toLowerCase()));
    const seeds: AccountDefDraft[] = [
      {
        name: 'Efectivo',
        kind: 'cash',
        liquid: true,
        notes: '',
        archived: false,
      },
      {
        name: 'Bancolombia',
        kind: 'bank',
        liquid: true,
        notes: '',
        archived: false,
      },
    ];
    const additions: AccountDef[] = [];
    for (const s of seeds) {
      if (existing.has(s.name.toLowerCase())) {
        continue;
      }
      additions.push({
        ...applyCreditPresetToDraft(s.name, s) as AccountDefDraft,
        id: `acc-starter-${s.name.toLowerCase()}`,
      });
    }
    if (additions.length) {
      await persistAccounts([...accounts, ...additions]);
    }
  }, [accounts, persistAccounts]);

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

  const updateScheduledPayment = useCallback(
    async (id: string, update: ScheduledPaymentUpdate) => {
      await persistScheduled(
        scheduledPayments.map((p) => (p.id === id ? { ...p, ...update } : p)),
      );
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

  const overdraftAlerts = useMemo(
    () => findOverdraftAlerts(transactions, accounts, scheduledPayments, installmentPlans),
    [transactions, accounts, scheduledPayments, installmentPlans],
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

  const importNekoSqlite = useCallback(
    async (pickedUri: string, mode: 'replace' | 'merge'): Promise<NekoSqliteImportResult> => {
      let bundle;
      try {
        bundle = await parseNekoSqliteFromUri(pickedUri);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'No se pudo leer el backup NEKO.';
        throw new Error(message);
      }
      if (bundle.transactions.length === 0) {
        return {
          imported: 0,
          skipped: 0,
          errors: bundle.errors.length
            ? bundle.errors
            : ['No hay movimientos publicados en este archivo SQLite.'],
          transactionsAfter: transactions,
          stats: bundle.stats,
          accountsSaved: 0,
          plansSaved: 0,
          recurringSaved: 0,
        };
      }

      const { next: nextTx, result } = applyImport(transactions, bundle.transactions, mode);
      await persist(nextTx);
      const nextAccounts = mergeNekoSqliteAccounts(accounts, bundle.accounts, mode);
      await persistAccounts(nextAccounts);
      await syncAccountsFromTransactions(nextTx, nextAccounts);

      const newPlans: InstallmentPlan[] = bundle.installmentPlans.map((draft, i) => ({
        ...draft,
        id: `ins-neko-${i}-${draft.title.slice(0, 12).replace(/\s/g, '')}`,
      }));
      const newSched: ScheduledPayment[] = bundle.scheduledPayments.map((draft, i) => ({
        ...draft,
        id: `sch-neko-${i}-${draft.title.slice(0, 12).replace(/\s/g, '')}`,
      }));

      let plansSaved = 0;
      let recurringSaved = 0;

      if (mode === 'replace') {
        await persistInstallments(newPlans);
        setScheduledPayments(newSched);
        await saveScheduledPayments(newSched);
        plansSaved = newPlans.length;
        recurringSaved = newSched.length;
      } else {
        const planKeys = new Set(
          installmentPlans.map((p) => `${p.title}|${p.account}|${p.startDate}`.toLowerCase()),
        );
        const toAddPlans = newPlans.filter(
          (p) => !planKeys.has(`${p.title}|${p.account}|${p.startDate}`.toLowerCase()),
        );
        await persistInstallments([...toAddPlans, ...installmentPlans]);
        plansSaved = toAddPlans.length;
        const schKeys = new Set(scheduledPayments.map((s) => s.title.trim().toLowerCase()));
        const toAddSched = newSched.filter((s) => !schKeys.has(s.title.trim().toLowerCase()));
        const mergedSched = [...toAddSched, ...scheduledPayments];
        setScheduledPayments(mergedSched);
        await saveScheduledPayments(mergedSched);
        recurringSaved = toAddSched.length;
      }

      return {
        imported: result.imported,
        skipped: result.skipped,
        errors: bundle.errors.slice(0, 20),
        transactionsAfter: nextTx,
        stats: bundle.stats,
        accountsSaved: nextAccounts.length,
        plansSaved,
        recurringSaved,
      };
    },
    [
      accounts,
      installmentPlans,
      persist,
      persistAccounts,
      persistInstallments,
      scheduledPayments,
      syncAccountsFromTransactions,
      transactions,
    ],
  );

  const {
    totalIncome,
    totalExpense,
    balance,
    transferCount,
    accountBalances,
    totalInAccounts,
    liquidAvailable,
    nekoSummary,
    monthFlow,
    accountNames,
    creditSummary,
    debtSummary,
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
    const balances = hasNekoLedger(accounts)
      ? computeNekoAccountBalances(transactions, accounts)
      : computeAccountBalances(transactions);
    const nekoSummary = hasNekoLedger(accounts)
      ? nekoSummaryToday(transactions, accounts)
      : null;
    const liquidFn = (name: string) => isAccountLiquid(accounts, name);
    const monthKey = currentMonthKey();
  const creditSummary = creditCardSummaries(accounts, balances, transactions, installmentPlans);
    const debtSummary = debtBucketSummaries(accounts, balances, transactions, monthKey);
    const budgetProg = budgetProgressForMonth(budgets, transactions, monthKey, {
      includePlanned: true,
      scheduled: scheduledPayments,
      installmentPlans,
      accounts,
    });
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transferCount: transfers,
      accountBalances: balances,
      totalInAccounts: nekoSummary
        ? nekoSummary.liquidTotal
        : totalAccountBalance(balances),
      liquidAvailable: nekoSummary?.liquidTotal ?? liquidBalance(balances, liquidFn),
      nekoSummary,
      monthFlow: monthRealFlow(transactions, monthKey),
      accountNames: activeAccountNames(accounts, transactions),
      creditSummary,
      debtSummary,
      budgetProg,
    };
  }, [transactions, accounts, budgets, installmentPlans, scheduledPayments]);

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
      importNekoSqlite,
      balance,
      totalIncome,
      totalExpense,
      transferCount,
      accountBalances,
      totalInAccounts,
      liquidAvailable,
      nekoSummary,
      monthFlow,
      accountNames,
      accounts,
      addAccount,
      updateAccount,
      categoryTree,
      saveCategoryTreeState,
      addCategoryGroup,
      addCategoryToGroup,
      renameCategoryGroup,
      removeCategoryGroup,
      renameCategoryInGroup,
      removeCategoryInGroup,
      moveCategoryGroup,
      moveCategoryInGroup,
      budgets,
      budgetProgress: budgetProg,
      creditCardSummaries: creditSummary,
      debtSummaries: debtSummary,
      addBudget,
      updateBudget,
      removeBudget,
      toggleBudget,
      addStarterAccounts,
      scheduledPayments,
      addScheduledPayment,
      removeScheduledPayment,
      updateScheduledPayment,
      toggleScheduledPayment,
      installmentPlans,
      addInstallmentPlan,
      removeInstallmentPlan,
      toggleInstallmentPlan,
      updateInstallmentPlan,
      upcomingItems,
      overdraftAlerts,
      todayAgenda,
      tomorrowHeadline,
      addInstallmentPlansBatch,
      historyFilterSeed,
      setHistoryFilterSeed,
    }),
    [
      transactions,
      loading,
      addTransaction,
      addTransferPair,
      updateTransaction,
      removeTransaction,
      importNekoCsv,
      importNekoSqlite,
      balance,
      totalIncome,
      totalExpense,
      transferCount,
      accountBalances,
      totalInAccounts,
      liquidAvailable,
      nekoSummary,
      monthFlow,
      accountNames,
      creditSummary,
      debtSummary,
      budgetProg,
      accounts,
      addAccount,
      updateAccount,
      categoryTree,
      saveCategoryTreeState,
      addCategoryGroup,
      addCategoryToGroup,
      renameCategoryGroup,
      removeCategoryGroup,
      renameCategoryInGroup,
      removeCategoryInGroup,
      moveCategoryGroup,
      moveCategoryInGroup,
      budgets,
      addBudget,
      updateBudget,
      removeBudget,
      toggleBudget,
      addStarterAccounts,
      scheduledPayments,
      addScheduledPayment,
      removeScheduledPayment,
      updateScheduledPayment,
      toggleScheduledPayment,
      installmentPlans,
      addInstallmentPlan,
      removeInstallmentPlan,
      toggleInstallmentPlan,
      updateInstallmentPlan,
      upcomingItems,
      overdraftAlerts,
      todayAgenda,
      tomorrowHeadline,
      addInstallmentPlansBatch,
      historyFilterSeed,
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
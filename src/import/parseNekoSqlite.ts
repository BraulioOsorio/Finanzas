import { enrichAccountsWithBillingDefaults } from '../domain/accounts/creditSummary';
import { defaultLiquidForKind, inferAccountKind } from '../domain/accounts/inferAccountKind';
import { dedupeAccounts } from '../domain/accounts/dedupeAccounts';
import { deriveNekoOpeningBalances } from '../domain/nekoLedger';
import type {
  AccountDef,
  AccountDefDraft,
  InstallmentPlanDraft,
  NekoCsvRow,
  ScheduledPaymentDraft,
  Transaction,
} from '../types';
import { NEKO_ACCOUNT_TYPE_KIND, NEKO_SQLITE_DUAL_LEG, NEKO_SQLITE_TYPE_LABEL, nekoPeriodToFrequency } from './nekoSqliteMap';
import { nekoRowToDraft } from './nekoMapping';

export type NekoSqliteDriver = {
  all<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type NekoSqliteImportBundle = {
  transactions: Transaction[];
  accounts: AccountDefDraft[];
  installmentPlans: InstallmentPlanDraft[];
  scheduledPayments: ScheduledPaymentDraft[];
  errors: string[];
  stats: {
    postedRows: number;
    transactionLines: number;
    accounts: number;
    installmentPlans: number;
    recurring: number;
  };
};

type EntryRow = {
  _id: string;
  transaction_type_id: number;
  description: string;
  amount: number;
  account_from_id: string | null;
  account_to_id: string | null;
  category_id: string | null;
  notes: string | null;
  posted_date_str: string | null;
  scheduled_date_str: string | null;
  is_posted: number;
  category_name: string | null;
  group_name: string | null;
  account_from_name: string | null;
  account_to_name: string | null;
};

type AccountRow = {
  _id: string;
  description: string;
  balance: number;
  account_type_id: number;
  is_include_in_total_balance: number;
  credit_limit: number;
  closing_day: number;
  due_date_day: number;
  is_deleted: number;
};

type InstallmentRow = {
  _id: string;
  description: string;
  amount: number;
  num_of_installments: number;
  purchase_date_str: string | null;
  start_date_str: string | null;
  account_id: string;
  category_id: string | null;
  account_name: string | null;
  category_name: string | null;
  group_name: string | null;
};

type RecurringRow = {
  _id: string;
  transaction_type_id: number;
  description: string;
  amount: number;
  account_from_id: string | null;
  account_to_id: string | null;
  account_from_name: string | null;
  account_to_name: string | null;
  start_date_str: string | null;
  stop_date_str: string | null;
  period_type_id: number;
  period_type_days: string;
  is_never_stop: number;
};

function trimName(s: string | null | undefined): string {
  return (s ?? '').trim();
}

function isoDate(row: EntryRow): string | null {
  const d = trimName(row.posted_date_str) || trimName(row.scheduled_date_str);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  return null;
}

type SqliteLeg = { csv: NekoCsvRow; nekoAccountId: string };

function entryToLegs(row: EntryRow): SqliteLeg[] {
  const typeId = row.transaction_type_id;
  const label = NEKO_SQLITE_TYPE_LABEL[typeId] ?? 'Gasto';
  const amount = Math.abs(Number(row.amount) || 0);
  if (amount === 0) {
    return [];
  }
  const date = isoDate(row);
  if (!date) {
    return [];
  }
  const base = {
    postedDate: date,
    transactionType: label,
    description: trimName(row.description),
    categoryGroup: trimName(row.group_name),
    category: trimName(row.category_name),
    notes: trimName(row.notes),
  };

  const from = trimName(row.account_from_name);
  const to = trimName(row.account_to_name);
  const fromId = trimName(row.account_from_id);
  const toId = trimName(row.account_to_id);

  if (NEKO_SQLITE_DUAL_LEG.has(typeId) && from && to && fromId && toId) {
    return [
      { csv: { ...base, amount: -amount, account: from }, nekoAccountId: fromId },
      { csv: { ...base, amount, account: to }, nekoAccountId: toId },
    ];
  }

  if (typeId === 3 || typeId === 7) {
    const account = to || from;
    const accountId = toId || fromId;
    if (!account || !accountId) {
      return [];
    }
    return [{ csv: { ...base, amount, account }, nekoAccountId: accountId }];
  }

  const account = from || to;
  const accountId = fromId || toId;
  if (!account || !accountId) {
    return [];
  }
  return [{ csv: { ...base, amount: -amount, account }, nekoAccountId: accountId }];
}

function mapAccountRow(row: AccountRow): AccountDefDraft {
  const name = trimName(row.description);
  const mappedKind = NEKO_ACCOUNT_TYPE_KIND[row.account_type_id];
  const kind = mappedKind ?? inferAccountKind(name);
  const liquid =
    row.is_include_in_total_balance === 0
      ? false
      : kind === 'credit' || kind === 'loan'
        ? false
        : kind === 'savings'
          ? false
          : defaultLiquidForKind(kind);
  const draft: AccountDefDraft = {
    name,
    kind,
    liquid,
    nekoAccountTypeId: row.account_type_id,
    nekoStoredBalance: row.balance,
    nekoSqliteId: row._id,
    notes: '',
    archived: row.is_deleted === 1,
  };
  if (kind === 'credit') {
    if (row.credit_limit > 0) {
      draft.creditLimit = row.credit_limit;
    }
    if (row.closing_day > 0) {
      draft.statementCloseDay = row.closing_day;
    }
    if (row.due_date_day > 0) {
      draft.paymentDueDay = row.due_date_day;
    }
  }
  return draft;
}

function mapInstallmentRow(row: InstallmentRow): InstallmentPlanDraft | null {
  const title = trimName(row.description);
  const account = trimName(row.account_name);
  const n = Math.max(1, Number(row.num_of_installments) || 1);
  const total = Math.abs(Number(row.amount) || 0);
  if (!title || !account || total <= 0) {
    return null;
  }
  const per = total / n;
  const purchaseDate = trimName(row.purchase_date_str) || undefined;
  const startDate = trimName(row.start_date_str) || purchaseDate || new Date().toISOString().slice(0, 10);
  return {
    title,
    totalAmount: total,
    installmentCount: n,
    perInstallment: per,
    account,
    categoryGroup: trimName(row.group_name) || 'Sin grupo',
    category: trimName(row.category_name) || 'Sin categoría',
    startDate,
    purchaseDate,
    active: true,
    billingMode: 'calendar',
    cuotaSource: 'csv_exact',
  };
}

function mapRecurringRow(row: RecurringRow): ScheduledPaymentDraft | null {
  const start = trimName(row.start_date_str);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return null;
  }
  const typeId = row.transaction_type_id;
  const isIncome = typeId === 3 || typeId === 7;
  const account = isIncome
    ? trimName(row.account_to_name) || trimName(row.account_from_name)
    : trimName(row.account_from_name) || trimName(row.account_to_name);
  if (!account) {
    return null;
  }
  const amount = Math.abs(Number(row.amount) || 0);
  if (amount <= 0) {
    return null;
  }
  const label = NEKO_SQLITE_TYPE_LABEL[typeId] ?? (isIncome ? 'Ingreso' : 'Pago');
  const endRaw = trimName(row.stop_date_str);
  return {
    title: trimName(row.description) || label,
    kind: isIncome ? 'income' : 'expense',
    amount,
    account,
    nekoType: label,
    categoryGroup: '',
    category: '',
    frequency: nekoPeriodToFrequency(row.period_type_id, row.period_type_days),
    startDate: start,
    endDate: row.is_never_stop === 1 ? undefined : endRaw || undefined,
    active: true,
  };
}

const ENTRY_SQL = `
  SELECT
    t._id,
    t.transaction_type_id,
    t.description,
    t.amount,
    t.account_from_id,
    t.account_to_id,
    t.category_id,
    t.notes,
    t.posted_date_str,
    t.scheduled_date_str,
    t.is_posted,
    c.description AS category_name,
    g.description AS group_name,
    af.description AS account_from_name,
    at.description AS account_to_name
  FROM tbl_transaction_entry t
  LEFT JOIN tbl_category c ON t.category_id = c._id
  LEFT JOIN tbl_category_group g ON c.category_group_id = g._id
  LEFT JOIN tbl_account af ON t.account_from_id = af._id
  LEFT JOIN tbl_account at ON t.account_to_id = at._id
  WHERE t.is_deleted = 0 AND t.is_posted = 1
  ORDER BY t.posted_date_str, t._id
`;

const ACCOUNT_SQL = `
  SELECT _id, description, balance, account_type_id, is_include_in_total_balance,
         credit_limit, closing_day, due_date_day, is_deleted
  FROM tbl_account
  WHERE is_deleted = 0
`;

const INSTALLMENT_SQL = `
  SELECT p._id, p.description, p.amount, p.num_of_installments, p.purchase_date_str,
         p.start_date_str, p.account_id, p.category_id,
         a.description AS account_name,
         c.description AS category_name,
         g.description AS group_name
  FROM tbl_installment_plan p
  LEFT JOIN tbl_account a ON p.account_id = a._id
  LEFT JOIN tbl_category c ON p.category_id = c._id
  LEFT JOIN tbl_category_group g ON c.category_group_id = g._id
  WHERE p.is_deleted = 0
`;

const RECURRING_SQL = `
  SELECT r._id, r.transaction_type_id, r.description, r.amount,
         r.account_from_id, r.account_to_id,
         af.description AS account_from_name,
         at.description AS account_to_name,
         r.start_date_str, r.stop_date_str, r.period_type_id, r.period_type_days,
         r.is_never_stop
  FROM tbl_recurring_transaction r
  LEFT JOIN tbl_account af ON r.account_from_id = af._id
  LEFT JOIN tbl_account at ON r.account_to_id = at._id
  WHERE r.is_deleted = 0
`;

function slugAccountId(name: string): string {
  return `acc-neko-${name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function finalizeNekoSqliteAccounts(
  drafts: AccountDefDraft[],
  transactions: Transaction[],
): AccountDefDraft[] {
  const tempAccounts: AccountDef[] = drafts.map((d) => ({
    ...(d as AccountDef),
    id: d.nekoSqliteId ?? slugAccountId(d.name),
    nekoOpeningBalance: undefined,
  }));
  const openings = deriveNekoOpeningBalances(
    drafts.map((d) => ({
      id: d.nekoSqliteId ?? slugAccountId(d.name),
      name: d.name,
      nekoStoredBalance: d.nekoStoredBalance,
    })),
    transactions,
    tempAccounts,
  );
  return drafts.map((draft) => {
    const id = draft.nekoSqliteId ?? slugAccountId(draft.name);
    const { nekoStoredBalance: _s, ...rest } = draft;
    return {
      ...rest,
      nekoOpeningBalance: openings.get(id),
    };
  });
}

/** Fusiona catálogo SQLite con cuentas existentes (metadatos de tarjeta, límites, etc.). */
export function mergeNekoSqliteAccounts(
  existing: AccountDef[],
  drafts: AccountDefDraft[],
  mode: 'replace' | 'merge',
): AccountDef[] {
  if (mode === 'replace') {
    const usedIds = new Set<string>();
    const fresh: AccountDef[] = drafts.map((draft, index) => {
      let id = draft.nekoSqliteId ?? `${slugAccountId(draft.name)}-${index}`;
      while (usedIds.has(id)) {
        id = `${id}-dup-${index}`;
      }
      usedIds.add(id);
      return {
        ...draft,
        id,
        nekoSqliteId: draft.nekoSqliteId ?? id,
      };
    });
    return enrichAccountsWithBillingDefaults(dedupeAccounts(fresh));
  }

  const byKey = new Map(existing.map((a) => [a.name.trim().toLowerCase(), a]));
  const next = [...existing];
  for (const draft of drafts) {
    const nekoId = draft.nekoSqliteId;
    if (nekoId) {
      const idx = next.findIndex(
        (a) => a.nekoSqliteId === nekoId || a.id === nekoId,
      );
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          kind: draft.kind,
          liquid: draft.liquid,
          nekoOpeningBalance: draft.nekoOpeningBalance ?? next[idx].nekoOpeningBalance,
          nekoAccountTypeId: draft.nekoAccountTypeId ?? next[idx].nekoAccountTypeId,
          creditLimit: draft.creditLimit ?? next[idx].creditLimit,
          statementCloseDay: draft.statementCloseDay ?? next[idx].statementCloseDay,
          paymentDueDay: draft.paymentDueDay ?? next[idx].paymentDueDay,
        };
        continue;
      }
      next.push({
        ...draft,
        id: nekoId,
        nekoSqliteId: nekoId,
      });
      continue;
    }

    const key = draft.name.trim().toLowerCase();
    const prior = byKey.get(key);
    const idx = next.findIndex((a) => a.name.trim().toLowerCase() === key);
    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        kind: draft.kind,
        liquid: draft.liquid,
        nekoOpeningBalance: draft.nekoOpeningBalance ?? next[idx].nekoOpeningBalance,
        nekoAccountTypeId: draft.nekoAccountTypeId ?? next[idx].nekoAccountTypeId,
        creditLimit: draft.creditLimit ?? next[idx].creditLimit,
        statementCloseDay: draft.statementCloseDay ?? next[idx].statementCloseDay,
        paymentDueDay: draft.paymentDueDay ?? next[idx].paymentDueDay,
      };
    } else if (!prior) {
      const id = slugAccountId(draft.name);
      byKey.set(key, { ...draft, id } as AccountDef);
      next.push({
        ...draft,
        id,
      });
    }
  }
  return enrichAccountsWithBillingDefaults(dedupeAccounts(next));
}

export async function parseNekoSqlite(driver: NekoSqliteDriver): Promise<NekoSqliteImportBundle> {
  const errors: string[] = [];
  let entries: EntryRow[] = [];
  try {
    entries = (await driver.all(ENTRY_SQL)) as unknown as EntryRow[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      transactions: [],
      accounts: [],
      installmentPlans: [],
      scheduledPayments: [],
      errors: [`No se pudo leer el historial NEKO: ${msg}`],
      stats: { postedRows: 0, transactionLines: 0, accounts: 0, installmentPlans: 0, recurring: 0 },
    };
  }

  const transactions: Transaction[] = [];
  let lineIndex = 0;
  for (const row of entries) {
    const legs = entryToLegs(row);
    if (!legs.length) {
      errors.push(`Movimiento ${row._id}: no se pudo mapear (tipo ${row.transaction_type_id}).`);
      continue;
    }
    for (const leg of legs) {
      const { id, draft, postedIso } = nekoRowToDraft(leg.csv, lineIndex);
      transactions.push({
        id: `neko-sqlite-${row._id}-${lineIndex}`,
        ...draft,
        nekoAccountId: leg.nekoAccountId,
        createdAt: postedIso,
      });
      lineIndex += 1;
    }
  }

  let accountRows: AccountRow[] = [];
  try {
    accountRows = (await driver.all(ACCOUNT_SQL)) as unknown as AccountRow[];
  } catch (e) {
    errors.push(`Cuentas: ${e instanceof Error ? e.message : String(e)}`);
  }
  const accountDraftsRaw = accountRows.map(mapAccountRow).filter((a) => a.name.length > 0);
  const accounts = finalizeNekoSqliteAccounts(accountDraftsRaw, transactions);

  let installmentPlans: InstallmentPlanDraft[] = [];
  try {
    const insRows = (await driver.all(INSTALLMENT_SQL)) as unknown as InstallmentRow[];
    installmentPlans = insRows.map(mapInstallmentRow).filter((p): p is InstallmentPlanDraft => p != null);
  } catch (e) {
    errors.push(`Cuotas: ${e instanceof Error ? e.message : String(e)}`);
  }

  let scheduledPayments: ScheduledPaymentDraft[] = [];
  try {
    const recRows = (await driver.all(RECURRING_SQL)) as unknown as RecurringRow[];
    scheduledPayments = recRows.map(mapRecurringRow).filter((p): p is ScheduledPaymentDraft => p != null);
  } catch (e) {
    errors.push(`Recurrentes: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    transactions,
    accounts,
    installmentPlans,
    scheduledPayments,
    errors,
    stats: {
      postedRows: entries.length,
      transactionLines: transactions.length,
      accounts: accounts.length,
      installmentPlans: installmentPlans.length,
      recurring: scheduledPayments.length,
    },
  };
}
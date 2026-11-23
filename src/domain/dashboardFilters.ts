import { NEKO_TRANSACTION_TYPES } from './nekoCatalog';
import type { AccountDef, Transaction } from '../types';
import type { AccountBalance } from './summaries';
import type { UpcomingItem } from './upcoming';
import { normalizeAccount } from './summaries';

/** Pestaña «Transacciones» del sheet Filtros (Inicio). */
export const INICIO_TX_FILTER_ROWS = [
  { key: 'todos', label: 'Todos', icon: 'apps-outline' as const },
  { key: 'ingresos', label: 'Ingresos', icon: 'cash-outline' as const },
  { key: 'pagos', label: 'Pagos', icon: 'receipt-outline' as const },
  { key: 'transfer_in', label: 'Transferencias Entrantes', icon: 'arrow-down-outline' as const },
  { key: 'transfer_out', label: 'Transferencias Salientes', icon: 'arrow-up-outline' as const },
  { key: 'card_pay', label: 'Pagos de Tarjeta de Crédito', icon: 'card-outline' as const },
  { key: 'gastos', label: 'Gastos', icon: 'list-outline' as const },
  { key: 'cashback', label: 'Cashback', icon: 'pricetag-outline' as const },
] as const;

export type InicioTxFilterKey = (typeof INICIO_TX_FILTER_ROWS)[number]['key'];

export type InicioDashboardFilters = {
  /** Vacío = todas las cuentas activas en el cálculo. */
  disabledAccounts: string[];
  /** Si `todos` está activo, el resto se ignora para filtrar próximos. */
  txFilters: InicioTxFilterKey[];
};

export type ProximoPeriod = 'month' | 'year' | 'days_30' | 'days_90';

export type TriState = 'all' | 'yes' | 'no';

export const PROXIMO_TYPE_CHIPS = ['Todos', ...NEKO_TRANSACTION_TYPES] as const;

export type ProximoFilters = {
  period: ProximoPeriod;
  /** Primera cuenta activa (compatibilidad). */
  account: string;
  /** Vacío = todas; si no, solo estas cuentas. */
  accounts: string[];
  /** Vacío o «Todos» = sin filtrar por tipo Neko. */
  nekoTypes: string[];
  /** Grupos marcados en el sheet de categorías. Vacío = todos. */
  categoryGroups: string[];
  /** Pares `grupo::categoría` (subcategorías). Vacío = todas dentro del grupo. */
  categoryPairs: string[];
  recurrent: TriState;
  autoPay: TriState;
  /** Incluir cuentas archivadas en chips «Inactivas». */
  includeInactiveAccounts: boolean;
};

export const DEFAULT_INICIO_FILTERS: InicioDashboardFilters = {
  disabledAccounts: [],
  txFilters: ['todos'],
};

export const DEFAULT_PROXIMO_FILTERS: ProximoFilters = {
  period: 'year',
  account: '',
  accounts: [],
  nekoTypes: ['Todos'],
  categoryGroups: [],
  categoryPairs: [],
  recurrent: 'all',
  autoPay: 'all',
  includeInactiveAccounts: false,
};

export function clearProximoFilters(): ProximoFilters {
  return { ...DEFAULT_PROXIMO_FILTERS };
}

export function periodLabel(period: ProximoPeriod): string {
  switch (period) {
    case 'month':
      return 'Este mes';
    case 'year':
      return 'Este año';
    case 'days_30':
      return 'Próximos 30 días';
    case 'days_90':
      return 'Próximos 90 días';
  }
}

export function daysAheadForPeriod(period: ProximoPeriod): number {
  switch (period) {
    case 'month':
      return 31;
    case 'year':
      return 366;
    case 'days_30':
      return 30;
    case 'days_90':
      return 90;
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function proximoRangeEnd(period: ProximoPeriod, today = new Date().toISOString().slice(0, 10)): string {
  if (period === 'year') {
    return `${today.slice(0, 4)}-12-31`;
  }
  if (period === 'month') {
    const mk = today.slice(0, 7);
    const d = new Date(`${mk}-01T12:00:00`);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  }
  return addDays(today, daysAheadForPeriod(period));
}

function accountPasses(item: UpcomingItem, filters: ProximoFilters): boolean {
  const selected = filters.accounts.length
    ? filters.accounts
    : filters.account
      ? [filters.account]
      : [];
  if (!selected.length) {
    return true;
  }
  const keys = new Set(selected.map((a) => normalizeAccount(a).toLowerCase()));
  return keys.has(normalizeAccount(item.account).toLowerCase());
}

function nekoTypePasses(item: UpcomingItem, filters: ProximoFilters): boolean {
  if (!filters.nekoTypes.length || filters.nekoTypes.includes('Todos')) {
    return true;
  }
  const t = (item.nekoType ?? inferNekoType(item)).trim();
  return filters.nekoTypes.some((f) => f.toLowerCase() === t.toLowerCase());
}

function inferNekoType(item: UpcomingItem): string {
  if (item.signedAmount > 0) {
    return 'Ingreso';
  }
  if (item.kind === 'card_due') {
    return 'Pago de Tarjeta';
  }
  if (item.kind === 'loan_due') {
    return 'Pago de Préstamo';
  }
  if (item.kind === 'installment') {
    return 'Compra a meses';
  }
  return 'Pago';
}

function categoryPasses(item: UpcomingItem, filters: ProximoFilters): boolean {
  const groups = filters.categoryGroups;
  const pairs = filters.categoryPairs;
  if (!groups.length && !pairs.length) {
    return true;
  }
  const group = (item.categoryGroup ?? 'Sin grupo').trim();
  const cat = (item.category ?? '').trim();
  if (pairs.length) {
    const key = `${group}::${cat}`;
    return pairs.includes(key);
  }
  return groups.includes(group);
}

function triStatePasses(
  value: boolean | undefined,
  filter: TriState,
): boolean {
  if (filter === 'all') {
    return true;
  }
  const v = Boolean(value);
  return filter === 'yes' ? v : !v;
}

export function filterProximoList(
  items: UpcomingItem[],
  filters: ProximoFilters,
  today = new Date().toISOString().slice(0, 10),
): UpcomingItem[] {
  const end = proximoRangeEnd(filters.period, today);
  return items
    .filter((item) => item.date >= today && item.date <= end)
    .filter((item) => accountPasses(item, filters))
    .filter((item) => nekoTypePasses(item, filters))
    .filter((item) => categoryPasses(item, filters))
    .filter((item) => triStatePasses(item.recurring, filters.recurrent))
    .filter((item) => triStatePasses(item.autoPay, filters.autoPay))
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function toggleProximoAccount(
  account: string,
  current: ProximoFilters,
): ProximoFilters {
  const key = normalizeAccount(account);
  let next = current.accounts.map(normalizeAccount);
  if (next.includes(key)) {
    next = next.filter((a) => a !== key);
  } else {
    next = [...next, key];
  }
  return {
    ...current,
    accounts: next,
    account: next.length === 1 ? next[0] : '',
  };
}

export function toggleProximoNekoType(type: string, current: ProximoFilters): ProximoFilters {
  if (type === 'Todos') {
    return { ...current, nekoTypes: ['Todos'] };
  }
  let next = current.nekoTypes.filter((t) => t !== 'Todos');
  if (next.includes(type)) {
    next = next.filter((t) => t !== type);
  } else {
    next = [...next, type];
  }
  if (!next.length) {
    next = ['Todos'];
  }
  return { ...current, nekoTypes: next };
}

export function toggleProximoCategoryGroup(group: string, current: ProximoFilters): ProximoFilters {
  const has = current.categoryGroups.includes(group);
  const categoryGroups = has
    ? current.categoryGroups.filter((g) => g !== group)
  : [...current.categoryGroups, group];
  return { ...current, categoryGroups };
}

export function toggleProximoCategoryPair(
  group: string,
  category: string,
  current: ProximoFilters,
): ProximoFilters {
  const key = `${group}::${category}`;
  const has = current.categoryPairs.includes(key);
  const categoryPairs = has
    ? current.categoryPairs.filter((p) => p !== key)
    : [...current.categoryPairs, key];
  return { ...current, categoryPairs };
}

export function isAccountEnabledInDashboard(
  filters: InicioDashboardFilters,
  account: string,
): boolean {
  const key = normalizeAccount(account);
  return !filters.disabledAccounts.some((a) => normalizeAccount(a) === key);
}

export function filterBalancesByDashboard(
  balances: AccountBalance[],
  filters: InicioDashboardFilters,
): AccountBalance[] {
  return balances.filter((b) => isAccountEnabledInDashboard(filters, b.account));
}

function txTypeOfTransaction(t: Transaction): InicioTxFilterKey[] {
  const n = t.nekoType.trim().toLowerCase();
  const out: InicioTxFilterKey[] = [];
  if (n === 'ingreso' || t.kind === 'income') {
    out.push('ingresos');
  }
  if (n === 'gasto' || (t.kind === 'expense' && n !== 'pago')) {
    out.push('gastos');
  }
  if (n === 'pago' || n === 'pago de tarjeta' || n === 'pago de préstamo') {
    out.push('pagos');
  }
  if (n === 'transferencia') {
    if (t.signedAmount > 0) {
      out.push('transfer_in');
    } else {
      out.push('transfer_out');
    }
  }
  if (n === 'pago de tarjeta') {
    out.push('card_pay');
  }
  if (n === 'cashback' || n === 'reembolso') {
    out.push('cashback');
  }
  return out.length ? out : ['gastos'];
}

export function transactionPassesTxFilters(
  t: Transaction,
  filters: InicioDashboardFilters,
): boolean {
  if (filters.txFilters.includes('todos') || !filters.txFilters.length) {
    return true;
  }
  const tags = txTypeOfTransaction(t);
  return tags.some((tag) => filters.txFilters.includes(tag));
}

function upcomingTxTags(item: UpcomingItem): InicioTxFilterKey[] {
  if (item.signedAmount > 0) {
    return ['ingresos'];
  }
  if (item.kind === 'card_due') {
    return ['card_pay', 'pagos'];
  }
  if (item.kind === 'loan_due') {
    return ['pagos'];
  }
  if (item.signedAmount < 0) {
    return ['pagos', 'gastos'];
  }
  return ['pagos'];
}

export function filterUpcomingByDashboard(
  items: UpcomingItem[],
  filters: InicioDashboardFilters,
): UpcomingItem[] {
  const useTx = !filters.txFilters.includes('todos') && filters.txFilters.length > 0;
  return items.filter((item) => {
    if (!isAccountEnabledInDashboard(filters, item.account)) {
      return false;
    }
    if (!useTx) {
      return true;
    }
    const tags = upcomingTxTags(item);
    return tags.some((tag) => filters.txFilters.includes(tag));
  });
}

export function groupAccountsForFilters(accounts: AccountDef[]): {
  debit: AccountDef[];
  credit: AccountDef[];
} {
  const debit: AccountDef[] = [];
  const credit: AccountDef[] = [];
  for (const a of accounts) {
    if (a.archived) {
      continue;
    }
    if (a.kind === 'credit') {
      credit.push(a);
    } else {
      debit.push(a);
    }
  }
  debit.sort((x, y) => x.name.localeCompare(y.name, 'es'));
  credit.sort((x, y) => x.name.localeCompare(y.name, 'es'));
  return { debit, credit };
}

export function setAllAccountsEnabled(
  accountNames: string[],
  enabled: boolean,
  current: InicioDashboardFilters,
): InicioDashboardFilters {
  if (enabled) {
    return { ...current, disabledAccounts: [] };
  }
  return { ...current, disabledAccounts: [...accountNames] };
}

export function toggleAccountInFilters(
  account: string,
  enabled: boolean,
  current: InicioDashboardFilters,
): InicioDashboardFilters {
  const key = normalizeAccount(account);
  const disabled = new Set(current.disabledAccounts.map(normalizeAccount));
  if (enabled) {
    disabled.delete(key);
  } else {
    disabled.add(key);
  }
  return { ...current, disabledAccounts: [...disabled] };
}

export function toggleTxFilter(
  key: InicioTxFilterKey,
  current: InicioDashboardFilters,
): InicioDashboardFilters {
  if (key === 'todos') {
    return { ...current, txFilters: ['todos'] };
  }
  let next: InicioTxFilterKey[] = current.txFilters.filter((k) => k !== 'todos');
  if (next.includes(key)) {
    next = next.filter((k) => k !== key);
  } else {
    next = [...next, key];
  }
  if (!next.length) {
    next = ['todos'];
  }
  return { ...current, txFilters: next };
}
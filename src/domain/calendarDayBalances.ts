import { daysInMonth, scheduledByDate, type DayScheduledItem } from './calendar';
import {
  computeNekoAccountBalances,
  hasNekoLedger,
  nekoBalanceBuckets,
} from './nekoLedger';
import {
  isNekoCuentasHeaderTotal,
  isNekoCreditAccount,
} from './nekoCalendarAccounts';
import { normalizeAccount } from './summaries';
import type { AccountDef, InstallmentPlan, ScheduledPayment, Transaction } from '../types';

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type CalendarBalanceBreakdown = {
  liquidTotal: number;
  creditTotal: number;
  debitAccounts: { name: string; balance: number; accountId?: string }[];
  creditAccounts: { name: string; balance: number; accountId?: string }[];
  loanAccounts: { name: string; balance: number; accountId?: string }[];
};

function filterByAccount(transactions: Transaction[], accountFilter?: string): Transaction[] {
  if (!accountFilter) {
    return transactions;
  }
  const key = normalizeAccount(accountFilter);
  return transactions.filter((t) => normalizeAccount(t.account) === key);
}

/** Saldos por cuenta al cierre del día `asOfDate` (movimientos hasta esa fecha + apertura NEKO). */
export function calendarBalanceBreakdown(
  transactions: Transaction[],
  accounts: AccountDef[],
  asOfDate: string,
  accountFilter?: string,
  kinds?: { debitOnly?: boolean; creditOnly?: boolean },
): CalendarBalanceBreakdown {
  const slice = filterByAccount(transactions, accountFilter).filter((t) => t.postedDate <= asOfDate);
  if (hasNekoLedger(accounts)) {
    return nekoBalanceBuckets(slice, accounts, asOfDate, kinds);
  }
  return nekoBalanceBuckets(slice, accounts, asOfDate, kinds);
}

function applyDebitProjection(
  breakdown: CalendarBalanceBreakdown,
  scheduledMap: Map<string, DayScheduledItem[]>,
  rangeStart: string,
  rangeEnd: string,
  accounts: AccountDef[],
): CalendarBalanceBreakdown {
  const debitByName = new Map<string, number>(
    [...breakdown.debitAccounts, ...breakdown.loanAccounts].map((row) => [
      normalizeAccount(row.name),
      row.balance,
    ]),
  );

  for (let cursor = rangeStart; cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    for (const item of scheduledMap.get(cursor) ?? []) {
      if (isNekoCreditAccount(accounts, item.account)) {
        continue;
      }
      const key = normalizeAccount(item.account);
      debitByName.set(key, (debitByName.get(key) ?? 0) + item.signedAmount);
    }
  }

  const debitAccounts: { name: string; balance: number }[] = [];
  const loanAccounts: { name: string; balance: number }[] = [];
  let liquidTotal = 0;

  for (const [name, balance] of debitByName.entries()) {
    const row = breakdown.debitAccounts.find((r) => normalizeAccount(r.name) === name);
    const isLoan = breakdown.loanAccounts.some((r) => normalizeAccount(r.name) === name);
    if (isLoan) {
      loanAccounts.push({ name, balance });
    } else {
      debitAccounts.push({ name: row?.name ?? name, balance });
      if (isNekoCuentasHeaderTotal(accounts, row?.name ?? name)) {
        liquidTotal += balance;
      }
    }
  }

  debitAccounts.sort((a, b) => b.balance - a.balance);
  loanAccounts.sort((a, b) => b.balance - a.balance);

  return { ...breakdown, debitAccounts, loanAccounts, liquidTotal };
}

export type DayCalendarBreakdown = CalendarBalanceBreakdown & { hasWarning: boolean };

export function dayCalendarBreakdown(
  transactions: Transaction[],
  accounts: AccountDef[],
  date: string,
  todayIso: string,
  scheduled: ScheduledPayment[] = [],
  installmentPlans: InstallmentPlan[] = [],
  kinds?: { debitOnly?: boolean; creditOnly?: boolean },
  scheduledMap?: Map<string, DayScheduledItem[]>,
): DayCalendarBreakdown {
  const postedEnd = date <= todayIso ? date : todayIso;
  let breakdown = calendarBalanceBreakdown(transactions, accounts, postedEnd, undefined, kinds);

  if (date > todayIso && !kinds?.creditOnly) {
    const monthKey = date.slice(0, 7);
    const monthEnd = `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, '0')}`;
    const map =
      scheduledMap ??
      scheduledByDate(scheduled, installmentPlans, accounts, todayIso, monthEnd);
    breakdown = applyDebitProjection(
      breakdown,
      map,
      addDays(todayIso, 1),
      date,
      accounts,
    );
  }

  const hasWarning =
    breakdown.debitAccounts.some(
      (row) => isNekoCuentasHeaderTotal(accounts, row.name) && row.balance < 0,
    ) || breakdown.loanAccounts.some((row) => row.balance < 0);
  return { ...breakdown, hasWarning };
}

/** Saldo de una cuenta justo después de un movimiento (incluye apertura NEKO). */
function resolveBalanceAccountName(target: Transaction, accounts: AccountDef[]): string {
  if (target.nekoAccountId) {
    const def =
      accounts.find((a) => a.id === target.nekoAccountId || a.nekoSqliteId === target.nekoAccountId) ??
      accounts.find((a) => a.nekoSqliteId === target.nekoAccountId);
    if (def) {
      return normalizeAccount(def.name);
    }
  }
  return normalizeAccount(target.account);
}

export function balanceAfterTransaction(
  transactions: Transaction[],
  accounts: AccountDef[],
  targetId: string,
): number | undefined {
  const target = transactions.find((t) => t.id === targetId);
  if (!target) {
    return undefined;
  }
  const slice = transactions.filter((t) => t.postedDate <= target.postedDate);
  const ordered = [...slice].sort((a, b) => {
    if (a.postedDate !== b.postedDate) {
      return a.postedDate.localeCompare(b.postedDate);
    }
    const ca = a.createdAt?.length > 10 ? a.createdAt : `${a.postedDate}T12:00:00`;
    const cb = b.createdAt?.length > 10 ? b.createdAt : `${b.postedDate}T12:00:00`;
    if (ca !== cb) {
      return ca.localeCompare(cb);
    }
    return a.id.localeCompare(b.id);
  });
  const idx = ordered.findIndex((t) => t.id === targetId);
  if (idx < 0) {
    return undefined;
  }
  const through = ordered.slice(0, idx + 1);
  const rows = computeNekoAccountBalances(through, accounts);
  const accountKey = resolveBalanceAccountName(target, accounts);
  const row = rows.find((r) => normalizeAccount(r.account) === accountKey);
  return row?.balance;
}
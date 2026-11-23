import type { Transaction } from '../types';

export type DaySnapshot = {
  date: string;
  balance: number;
  transactions: Transaction[];
};

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
}

export function monthKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(year, month - 1 + delta, 1);
  return monthKeyFromDate(d);
}

export function daysInMonth(monthKey: string): number {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(year, month, 0).getDate();
}

function padDay(monthKey: string, day: number): string {
  return `${monthKey}-${String(day).padStart(2, '0')}`;
}

/** Lunes = 0 … Domingo = 6 */
export function weekdayIndexMonFirst(isoDate: string): number {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

export function buildMonthCalendar(
  transactions: Transaction[],
  monthKey: string,
  accountFilter?: string,
): { days: DaySnapshot[]; startPadding: number } {
  const filtered = accountFilter
    ? transactions.filter((t) => t.account.trim() === accountFilter)
    : transactions;

  const sorted = [...filtered].sort((a, b) => {
    const byDate = a.postedDate.localeCompare(b.postedDate);
    if (byDate !== 0) {
      return byDate;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = 0;
  const monthStart = `${monthKey}-01`;
  for (const t of sorted) {
    if (t.postedDate < monthStart) {
      running += t.signedAmount;
    }
  }

  const totalDays = daysInMonth(monthKey);
  const days: DaySnapshot[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const date = padDay(monthKey, d);
    const dayTxs = sorted.filter((t) => t.postedDate === date);
    for (const t of dayTxs) {
      running += t.signedAmount;
    }
    days.push({ date, balance: running, transactions: dayTxs });
  }

  const startPadding = days.length > 0 ? weekdayIndexMonFirst(days[0].date) : 0;
  return { days, startPadding };
}

export function formatMonthTitle(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const label = new Date(year, month - 1, 1).toLocaleDateString('es', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatCompactMoney(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${amount < 0 ? '−' : ''}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 100_000) {
    return `${amount < 0 ? '−' : ''}${Math.round(abs / 1000)}k`;
  }
  if (abs >= 10_000) {
    return `${amount < 0 ? '−' : ''}${(abs / 1000).toFixed(0)}k`;
  }
  return `${amount < 0 ? '−' : ''}${Math.round(abs / 1000) || '0'}`;
}
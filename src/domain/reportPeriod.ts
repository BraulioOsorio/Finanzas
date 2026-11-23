import { daysInMonth, parseMonthKey } from './calendar';
import type { Transaction } from '../types';
import type { MonthFlow } from './summaries';

export type ReportPeriodKind = 'month' | 'quarter' | 'year';

export function periodBounds(
  kind: ReportPeriodKind,
  monthKey: string,
): { start: string; end: string; label: string } {
  const { year, month } = parseMonthKey(monthKey);
  if (kind === 'month') {
    const last = daysInMonth(monthKey);
    return {
      start: `${monthKey}-01`,
      end: `${monthKey}-${String(last).padStart(2, '0')}`,
      label: monthKey,
    };
  }
  if (kind === 'year') {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: `${year}`,
    };
  }
  const qStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const endMonth = qStartMonth + 2;
  const endMonthKey = `${year}-${String(endMonth).padStart(2, '0')}`;
  const last = daysInMonth(endMonthKey);
  return {
    start: `${year}-${String(qStartMonth).padStart(2, '0')}-01`,
    end: `${endMonthKey}-${String(last).padStart(2, '0')}`,
    label: `T${Math.ceil(month / 3)} ${year}`,
  };
}

export function flowBetween(
  transactions: Transaction[],
  start: string,
  end: string,
  monthKeyLabel: string,
): MonthFlow {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.postedDate < start || t.postedDate > end) {
      continue;
    }
    if (t.kind === 'income') {
      income += t.amount;
    } else if (t.kind === 'expense') {
      expense += t.amount;
    }
  }
  return { monthKey: monthKeyLabel, income, expense, net: income - expense };
}

export function monthsSpanned(start: string, end: string): string[] {
  const out: string[] = [];
  let y = Number(start.slice(0, 4));
  let m = Number(start.slice(5, 7));
  const endY = Number(end.slice(0, 4));
  const endM = Number(end.slice(5, 7));
  let guard = 0;
  while (guard++ < 24) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push(key);
    if (y > endY || (y === endY && m >= endM)) {
      break;
    }
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
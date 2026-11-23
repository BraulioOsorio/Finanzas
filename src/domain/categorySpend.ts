import { daysInMonth } from './calendar';
import type { Transaction } from '../types';

export type CategorySpendRow = {
  key: string;
  label: string;
  spent: number;
  count: number;
  group: string;
  category: string;
};

export function topCategorySpendingBetween(
  transactions: Transaction[],
  start: string,
  end: string,
  limit = 10,
): CategorySpendRow[] {
  const map = new Map<string, { label: string; spent: number; count: number; group: string; category: string }>();
  for (const t of transactions) {
    if (t.kind !== 'expense' || t.postedDate < start || t.postedDate > end) {
      continue;
    }
    const group = t.categoryGroup.trim() || 'Sin grupo';
    const cat = t.category.trim();
    const label = cat ? `${group} › ${cat}` : group;
    const key = label.toLowerCase();
    const row = map.get(key) ?? { label, spent: 0, count: 0, group, category: cat };
    row.spent += t.amount;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.values()]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, limit)
    .map((r) => ({
      key: r.label,
      label: r.label,
      spent: r.spent,
      count: r.count,
      group: r.group,
      category: r.category,
    }));
}

export function topCategorySpending(
  transactions: Transaction[],
  monthKey: string,
  limit = 8,
): CategorySpendRow[] {
  const last = daysInMonth(monthKey);
  return topCategorySpendingBetween(
    transactions,
    `${monthKey}-01`,
    `${monthKey}-${String(last).padStart(2, '0')}`,
    limit,
  );
}
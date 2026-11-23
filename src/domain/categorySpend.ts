import type { Transaction } from '../types';

export type CategorySpendRow = {
  key: string;
  label: string;
  spent: number;
  count: number;
};

export function topCategorySpending(
  transactions: Transaction[],
  monthKey: string,
  limit = 8,
): CategorySpendRow[] {
  const map = new Map<string, { label: string; spent: number; count: number }>();
  for (const t of transactions) {
    if (t.kind !== 'expense' || !t.postedDate.startsWith(monthKey)) {
      continue;
    }
    const group = t.categoryGroup.trim() || 'Sin grupo';
    const cat = t.category.trim();
    const label = cat ? `${group} › ${cat}` : group;
    const key = label.toLowerCase();
    const row = map.get(key) ?? { label, spent: 0, count: 0 };
    row.spent += t.amount;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.values()]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, limit)
    .map((r) => ({ key: r.label, ...r }));
}
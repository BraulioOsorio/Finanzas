import type { Transaction } from '../types';

export type HistoryFilterState = {
  query: string;
  account: string;
  categoryGroup: string;
  monthKey: string;
  nekoType: string;
};

export const EMPTY_HISTORY_FILTER: HistoryFilterState = {
  query: '',
  account: '',
  categoryGroup: '',
  monthKey: '',
  nekoType: '',
};

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterTransactions(
  items: Transaction[],
  filters: HistoryFilterState,
): Transaction[] {
  const q = normalizeQuery(filters.query);
  return items.filter((t) => {
    if (filters.account && t.account !== filters.account) {
      return false;
    }
    if (filters.categoryGroup) {
      const g = t.categoryGroup.trim() || 'Sin grupo';
      if (g !== filters.categoryGroup) {
        return false;
      }
    }
    if (filters.monthKey && !t.postedDate.startsWith(filters.monthKey)) {
      return false;
    }
    if (filters.nekoType && t.nekoType.trim() !== filters.nekoType) {
      return false;
    }
    if (!q) {
      return true;
    }
    const haystack = normalizeQuery(
      [t.description, t.account, t.category, t.categoryGroup, t.nekoType, t.notes].join(' '),
    );
    return haystack.includes(q);
  });
}

export function distinctMonthKeys(items: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of items) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(t.postedDate)) {
      set.add(t.postedDate.slice(0, 7));
    }
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

export function distinctNekoTypes(items: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of items) {
    const n = t.nekoType.trim();
    if (n) {
      set.add(n);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

export function distinctCategoryGroups(items: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of items) {
    set.add(t.categoryGroup.trim() || 'Sin grupo');
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}
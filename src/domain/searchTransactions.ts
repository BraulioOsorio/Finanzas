import type { Transaction } from '../types';

export function searchTransactions(transactions: Transaction[], query: string, limit = 80): Transaction[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }
  const hits: Transaction[] = [];
  for (const t of transactions) {
    const hay = [
      t.description,
      t.account,
      t.categoryGroup,
      t.category,
      t.notes,
      t.nekoType,
    ]
      .join(' ')
      .toLowerCase();
    if (hay.includes(q)) {
      hits.push(t);
    }
    if (hits.length >= limit) {
      break;
    }
  }
  return hits.sort((a, b) => b.postedDate.localeCompare(a.postedDate));
}
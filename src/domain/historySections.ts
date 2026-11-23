import type { Transaction } from '../types';
import { formatHistorySectionTitle } from '../utils/format';

export type HistorySection = { title: string; data: Transaction[] };

/** Agrupa movimientos por día (más reciente primero), como el historial de NEKO. */
function sortDayTransactions(items: Transaction[]): Transaction[] {
  return [...items].sort((a, b) => {
    const ca = a.createdAt?.length > 10 ? a.createdAt : `${a.postedDate}T12:00:00`;
    const cb = b.createdAt?.length > 10 ? b.createdAt : `${b.postedDate}T12:00:00`;
    if (ca !== cb) {
      return cb.localeCompare(ca);
    }
    return b.id.localeCompare(a.id);
  });
}

export function groupTransactionsByDay(transactions: Transaction[]): HistorySection[] {
  const sorted = [...transactions].sort((a, b) => b.postedDate.localeCompare(a.postedDate));
  const map = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const key = tx.postedDate.slice(0, 10);
    const bucket = map.get(key) ?? [];
    bucket.push(tx);
    map.set(key, bucket);
  }
  return [...map.entries()].map(([day, data]) => ({
    title: formatHistorySectionTitle(day),
    data: sortDayTransactions(data),
  }));
}
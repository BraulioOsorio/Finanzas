import type { UpcomingItem } from './upcoming';
import type { Transaction } from '../types';

export type TodayItem =
  | { kind: 'transaction'; date: string; title: string; amount: number; account: string }
  | { kind: 'reminder'; item: UpcomingItem };

export function buildTodayAgenda(
  transactions: Transaction[],
  upcoming: UpcomingItem[],
  today = new Date().toISOString().slice(0, 10),
): TodayItem[] {
  const out: TodayItem[] = [];

  for (const t of transactions) {
    if (t.postedDate !== today) {
      continue;
    }
    if (t.kind === 'transfer') {
      continue;
    }
    out.push({
      kind: 'transaction',
      date: today,
      title: t.description.trim() || t.category || t.nekoType,
      amount: t.signedAmount,
      account: t.account,
    });
  }

  for (const u of upcoming) {
    if (u.date === today) {
      out.push({ kind: 'reminder', item: u });
    }
  }

  return out;
}

export function buildTomorrowHeadline(upcoming: UpcomingItem[], today = new Date().toISOString().slice(0, 10)): UpcomingItem[] {
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() + 1);
  const tomorrow = d.toISOString().slice(0, 10);
  return upcoming.filter((u) => u.date === tomorrow).slice(0, 5);
}
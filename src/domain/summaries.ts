import type { Transaction } from '../types';

export type AccountBalance = {
  account: string;
  balance: number;
  movementCount: number;
  /** Id de catálogo (necesario si hay dos cuentas con el mismo nombre, como en NEKO). */
  accountId?: string;
};

export type MonthFlow = {
  monthKey: string;
  income: number;
  expense: number;
  net: number;
};

export function normalizeAccount(name: string): string {
  return name.trim() || 'Sin cuenta';
}

export function computeAccountBalances(transactions: Transaction[]): AccountBalance[] {
  const map = new Map<string, { balance: number; count: number }>();

  for (const t of transactions) {
    const account = normalizeAccount(t.account);
    const prev = map.get(account) ?? { balance: 0, count: 0 };
    map.set(account, {
      balance: prev.balance + t.signedAmount,
      count: prev.count + 1,
    });
  }

  return [...map.entries()]
    .map(([account, { balance, count }]) => ({
      account,
      balance,
      movementCount: count,
    }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

export function totalAccountBalance(balances: AccountBalance[]): number {
  return balances.reduce((sum, row) => sum + row.balance, 0);
}

export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Flujo real del mes (sin transferencias), estilo “¿cuánto entró y salió?” */
export function monthRealFlow(transactions: Transaction[], monthKey = currentMonthKey()): MonthFlow {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (!t.postedDate.startsWith(monthKey)) {
      continue;
    }
    if (t.kind === 'income') {
      income += t.amount;
    } else if (t.kind === 'expense') {
      expense += t.amount;
    }
  }
  return { monthKey, income, expense, net: income - expense };
}

export function mergeAccountNames(seed: readonly string[], transactions: Transaction[]): string[] {
  const set = new Set(seed.map((a) => normalizeAccount(a)));
  for (const t of transactions) {
    set.add(normalizeAccount(t.account));
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

export function liquidBalance(
  balances: AccountBalance[],
  isLiquid: (accountName: string) => boolean,
): number {
  return balances
    .filter((b) => isLiquid(b.account))
    .reduce((sum, b) => sum + b.balance, 0);
}
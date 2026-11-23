import { accountDefByName } from './accounts/resolveAccounts';
import {
  isNekoCreditAccount,
  isNekoCuentasHeaderTotal,
  isNekoDebitListAccount,
  isNekoLoanAccount,
  nekoCreditDisplayBalance,
} from './nekoCalendarAccounts';
import { computeAccountBalances, normalizeAccount, type AccountBalance } from './summaries';
import type { AccountDef, Transaction } from '../types';

export function hasNekoLedger(accounts: AccountDef[]): boolean {
  return accounts.some(
    (a) => a.nekoOpeningBalance != null && Number.isFinite(a.nekoOpeningBalance),
  );
}

/** Clave estable para sumar movimientos (id NEKO si existe). */
export function transactionBalanceKey(
  t: Transaction,
  accounts: AccountDef[],
): string {
  if (t.nekoAccountId) {
    return t.nekoAccountId;
  }
  const def = accountDefByName(accounts, t.account);
  if (def?.id) {
    return def.id;
  }
  return `name:${normalizeAccount(t.account)}`;
}

function accountForKey(key: string, accounts: AccountDef[]): AccountDef | undefined {
  if (key.startsWith('name:')) {
    const name = key.slice(5);
    return accountDefByName(accounts, name);
  }
  return accounts.find((a) => a.id === key);
}

function displayNameForKey(key: string, accounts: AccountDef[], sampleName: string): string {
  const def = accountForKey(key, accounts);
  return def?.name ?? sampleName;
}

/**
 * Saldos al cierre de `asOfDate`, con saldo de apertura NEKO cuando el import trae SQLite.
 * Sin apertura: suma clásica de movimientos (registros manuales).
 */
export function computeNekoAccountBalances(
  transactions: Transaction[],
  accounts: AccountDef[],
  asOfDate?: string,
): AccountBalance[] {
  const useOpening = hasNekoLedger(accounts);
  const slice = asOfDate
    ? transactions.filter((t) => t.postedDate <= asOfDate)
    : transactions;

  if (!useOpening) {
    return computeAccountBalances(slice);
  }

  const movementSum = new Map<string, { sum: number; count: number; name: string }>();
  for (const t of slice) {
    const key = transactionBalanceKey(t, accounts);
    const prev = movementSum.get(key) ?? { sum: 0, count: 0, name: t.account };
    movementSum.set(key, {
      sum: prev.sum + t.signedAmount,
      count: prev.count + 1,
      name: prev.name || t.account,
    });
  }

  const rows: AccountBalance[] = [];
  const seen = new Set<string>();

  for (const acc of accounts) {
    seen.add(acc.id);
    const mov = movementSum.get(acc.id);
    const movement = mov?.sum ?? 0;
    const opening = acc.nekoOpeningBalance ?? 0;
    rows.push({
      account: acc.name,
      accountId: acc.id,
      balance: opening + movement,
      movementCount: mov?.count ?? 0,
    });
  }

  for (const [key, mov] of movementSum) {
    if (seen.has(key)) {
      continue;
    }
    const def = accountForKey(key, accounts);
    if (def) {
      continue;
    }
    const name = displayNameForKey(key, accounts, mov.name);
    rows.push({
      account: name,
      accountId: key.startsWith('name:') ? key : key,
      balance: mov.sum,
      movementCount: mov.count,
    });
  }

  return rows.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

/** Tras importar SQLite: apertura = saldo guardado en NEKO − suma de todos los movimientos. */
export function deriveNekoOpeningBalances(
  accountDrafts: { id: string; name: string; nekoStoredBalance?: number }[],
  transactions: Transaction[],
  accountsForKeys: AccountDef[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const acc of accountDrafts) {
    if (acc.nekoStoredBalance == null || !Number.isFinite(acc.nekoStoredBalance)) {
      continue;
    }
    const leg = transactions.filter((t) => transactionBalanceKey(t, accountsForKeys) === acc.id);
    const movement = leg.reduce((s, t) => s + t.signedAmount, 0);
    out.set(acc.id, acc.nekoStoredBalance - movement);
  }
  return out;
}

export function balancesAtDateMap(
  transactions: Transaction[],
  accounts: AccountDef[],
  asOfDate: string,
): Map<string, number> {
  const list = computeNekoAccountBalances(transactions, accounts, asOfDate);
  const map = new Map<string, number>();
  for (const row of list) {
    map.set(normalizeAccount(row.account), row.balance);
  }
  return map;
}

export type NekoBalanceBuckets = {
  liquidTotal: number;
  creditTotal: number;
  debitAccounts: { name: string; balance: number; accountId?: string }[];
  creditAccounts: { name: string; balance: number; accountId?: string }[];
  loanAccounts: { name: string; balance: number; accountId?: string }[];
};

export type NekoBalanceBucketOptions = {
  /** Pantalla Cuentas: filas distintas aunque compartan nombre. */
  preserveDuplicateRows?: boolean;
};

export function nekoBalanceBuckets(
  transactions: Transaction[],
  accounts: AccountDef[],
  asOfDate: string,
  kinds?: { debitOnly?: boolean; creditOnly?: boolean },
  options?: NekoBalanceBucketOptions,
): NekoBalanceBuckets {
  const rows = computeNekoAccountBalances(transactions, accounts, asOfDate);
  let liquidTotal = 0;
  let creditTotal = 0;
  const debitAccounts: { name: string; balance: number; accountId?: string }[] = [];
  const creditAccounts: { name: string; balance: number; accountId?: string }[] = [];
  const loanAccounts: { name: string; balance: number; accountId?: string }[] = [];

  for (const row of rows) {
    const isCredit = isNekoCreditAccount(accounts, row.account);
    const isLoan = isNekoLoanAccount(accounts, row.account);
    if (kinds?.debitOnly && isCredit) {
      continue;
    }
    if (kinds?.creditOnly && !isCredit) {
      continue;
    }
    if (isCredit) {
      const owed = nekoCreditDisplayBalance(row.balance);
      creditTotal += owed;
      creditAccounts.push({ name: row.account, balance: owed, accountId: row.accountId });
    } else if (isLoan) {
      loanAccounts.push({ name: row.account, balance: row.balance, accountId: row.accountId });
    } else if (isNekoDebitListAccount(accounts, row.account)) {
      debitAccounts.push({ name: row.account, balance: row.balance, accountId: row.accountId });
      if (isNekoCuentasHeaderTotal(accounts, row.account)) {
        liquidTotal += row.balance;
      }
    } else {
      debitAccounts.push({ name: row.account, balance: row.balance, accountId: row.accountId });
      liquidTotal += row.balance;
    }
  }

  debitAccounts.sort((a, b) => b.balance - a.balance);
  creditAccounts.sort((a, b) => b.balance - a.balance);
  loanAccounts.sort((a, b) => b.balance - a.balance);

  if (hasNekoLedger(accounts)) {
    const collapse = !options?.preserveDuplicateRows;
    return {
      liquidTotal,
      creditTotal,
      debitAccounts: collapse ? collapseDuplicateDisplayNames(debitAccounts) : [...debitAccounts],
      creditAccounts: collapse ? collapseDuplicateDisplayNames(creditAccounts) : [...creditAccounts],
      loanAccounts: collapse ? collapseDuplicateDisplayNames(loanAccounts) : [...loanAccounts],
    };
  }

  return { liquidTotal, creditTotal, debitAccounts, creditAccounts, loanAccounts };
}

/** NEKO muestra un solo renglón por nombre en listas; conservamos el saldo más representativo. */
function collapseDuplicateDisplayNames<T extends { name: string; balance: number; accountId?: string }>(
  rows: T[],
): T[] {
  const byName = new Map<string, T>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const prev = byName.get(key);
    if (!prev || Math.abs(row.balance) > Math.abs(prev.balance)) {
      byName.set(key, row);
    }
  }
  return [...byName.values()].sort((a, b) => b.balance - a.balance);
}
import type { AccountDef, Transaction } from '../../types';
import { normalizeAccount } from '../summaries';

/** Nombres para chips: catálogo activo + cuentas huérfanas en movimientos. */
export function activeAccountNames(
  accounts: AccountDef[],
  transactions: Transaction[],
): string[] {
  const set = new Set<string>();
  for (const a of accounts) {
    if (!a.archived) {
      set.add(normalizeAccount(a.name));
    }
  }
  for (const t of transactions) {
    set.add(normalizeAccount(t.account));
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

export function accountDefByName(accounts: AccountDef[], name: string): AccountDef | undefined {
  const key = normalizeAccount(name).toLowerCase();
  return accounts.find((a) => a.name.trim().toLowerCase() === key);
}

export function isAccountLiquid(accounts: AccountDef[], accountName: string): boolean {
  const def = accountDefByName(accounts, accountName);
  if (def) {
    return def.liquid;
  }
  return true;
}
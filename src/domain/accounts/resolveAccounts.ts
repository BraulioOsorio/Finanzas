import type { AccountDef, Transaction } from '../../types';
import { normalizeAccount } from '../summaries';

/** Nombres para chips: catálogo activo + cuentas huérfanas en movimientos. */
/** Cuentas activas con id estable (varias pueden compartir nombre, como en NEKO). */
export function activeAccountOptions(accounts: AccountDef[]): { id: string; name: string }[] {
  return accounts
    .filter((a) => !a.archived)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((a) => ({ id: a.id, name: a.name }));
}

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

export function accountDefById(accounts: AccountDef[], id: string): AccountDef | undefined {
  if (!id) {
    return undefined;
  }
  return accounts.find((a) => a.id === id || a.nekoSqliteId === id);
}

/** Resuelve la cuenta de un movimiento (preferir `nekoAccountId` si existe). */
export function accountDefForTransaction(
  accounts: AccountDef[],
  tx: Pick<Transaction, 'account' | 'nekoAccountId'>,
): AccountDef | undefined {
  if (tx.nekoAccountId) {
    const byId = accountDefById(accounts, tx.nekoAccountId);
    if (byId) {
      return byId;
    }
  }
  return accountDefByName(accounts, tx.account);
}

export function isAccountLiquid(accounts: AccountDef[], accountName: string): boolean {
  const def = accountDefByName(accounts, accountName);
  if (def) {
    return def.liquid;
  }
  return true;
}

/** Etiqueta para chips cuando hay varias cuentas con el mismo nombre. */
export function formatAccountPickerLabel(accounts: AccountDef[], id: string): string {
  const def = accountDefById(accounts, id);
  if (!def) {
    return id;
  }
  const key = normalizeAccount(def.name);
  const dupes = accounts.filter((a) => !a.archived && normalizeAccount(a.name) === key).length;
  if (dupes <= 1) {
    return def.name;
  }
  const tag = (def.nekoSqliteId ?? def.id).slice(-4);
  return `${def.name} #${tag}`;
}
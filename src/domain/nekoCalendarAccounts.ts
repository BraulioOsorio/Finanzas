import type { AccountDef } from '../types';
import { inferAccountKind } from './accounts/inferAccountKind';
import { accountDefByName } from './accounts/resolveAccounts';

/**
 * Reglas del calendario NEKO (tipos de cuenta del SQLite / export).
 * - Cabecera «Cuentas»: solo efectivo + débito (type 1–2).
 * - Lista expandida «Cuentas de débito»: + alcancías / routing (type 3).
 * - Préstamos (type 5) y tarjetas (type 4) van en sus bloques.
 */
export function nekoAccountTypeId(accounts: AccountDef[], accountName: string): number | undefined {
  return accountDefByName(accounts, accountName)?.nekoAccountTypeId;
}

export function isNekoCuentasHeaderTotal(
  accounts: AccountDef[],
  accountName: string,
): boolean {
  const def = accountDefByName(accounts, accountName);
  const typeId = def?.nekoAccountTypeId;
  if (typeId != null) {
    return typeId === 1 || typeId === 2;
  }
  if (!def) {
    const kind = inferAccountKind(accountName);
    return kind === 'cash' || kind === 'bank' || kind === 'fintech';
  }
  return def.kind === 'cash' || def.kind === 'bank' || def.kind === 'fintech';
}

export function isNekoDebitListAccount(accounts: AccountDef[], accountName: string): boolean {
  const def = accountDefByName(accounts, accountName);
  const typeId = def?.nekoAccountTypeId;
  if (typeId != null) {
    return typeId === 1 || typeId === 2 || typeId === 3;
  }
  if (!def) {
    const kind = inferAccountKind(accountName);
    return kind !== 'credit' && kind !== 'loan';
  }
  return def.kind !== 'credit' && def.kind !== 'loan';
}

export function isNekoLoanAccount(accounts: AccountDef[], accountName: string): boolean {
  const def = accountDefByName(accounts, accountName);
  const typeId = def?.nekoAccountTypeId;
  if (typeId != null) {
    return typeId === 5;
  }
  return def?.kind === 'loan';
}

export function isNekoCreditAccount(accounts: AccountDef[], accountName: string): boolean {
  const def = accountDefByName(accounts, accountName);
  const typeId = def?.nekoAccountTypeId;
  if (typeId != null) {
    return typeId === 4;
  }
  return def?.kind === 'credit';
}

/** Saldo “deuda” mostrado para tarjetas (siempre positivo = lo que debes). */
export function nekoCreditDisplayBalance(ledgerBalance: number): number {
  if (ledgerBalance < 0) {
    return Math.abs(ledgerBalance);
  }
  return ledgerBalance;
}
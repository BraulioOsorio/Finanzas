import {
  nekoBalanceBuckets,
  type NekoBalanceBucketOptions,
  type NekoBalanceBuckets,
} from './nekoLedger';

import type { AccountDef, Transaction } from '../types';

export type NekoTodaySummary = NekoBalanceBuckets & {
  asOfDate: string;
};

/** Resumen «como NEKO» al cierre del día (Cuentas + TC + listas). */
export function nekoSummaryAt(
  transactions: Transaction[],
  accounts: AccountDef[],
  asOfDate: string,
  options?: NekoBalanceBucketOptions,
): NekoTodaySummary {
  const buckets = nekoBalanceBuckets(transactions, accounts, asOfDate, undefined, options);
  return { ...buckets, asOfDate };
}

export function nekoSummaryToday(
  transactions: Transaction[],
  accounts: AccountDef[],
  today = new Date().toISOString().slice(0, 10),
  options?: NekoBalanceBucketOptions,
): NekoTodaySummary {
  return nekoSummaryAt(transactions, accounts, today, options);
}
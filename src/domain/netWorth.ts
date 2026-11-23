import { isAccountLiquid } from './accounts/resolveAccounts';
import { totalCreditOwed } from './accounts/creditSummary';
import type { CreditCardSummary } from './accounts/creditSummary';
import { totalDebtOwed } from './debtSummary';
import type { DebtBucketSummary } from './debtSummary';
import type { AccountBalance } from './summaries';
import type { AccountDef } from '../types';

export type NetWorthSnapshot = {
  totalInAccounts: number;
  liquid: number;
  creditOwed: number;
  debtBuckets: number;
  /** Aproximación patrimonio líquido neto (líquido − deudas rotativas negativas en tarjeta) */
  netLiquid: number;
};

export function computeNetWorth(
  accounts: AccountDef[],
  balances: AccountBalance[],
  credit: CreditCardSummary[],
  debts: DebtBucketSummary[],
): NetWorthSnapshot {
  let liquid = 0;
  let total = 0;
  for (const b of balances) {
    total += b.balance;
    if (isAccountLiquid(accounts, b.account)) {
      liquid += b.balance;
    }
  }
  const creditOwed = totalCreditOwed(credit);
  const debtBuckets = totalDebtOwed(debts);
  const netLiquid = liquid - creditOwed;
  return {
    totalInAccounts: total,
    liquid,
    creditOwed,
    debtBuckets,
    netLiquid,
  };
}
import { isAccountLiquid } from './accounts/resolveAccounts';
import { totalCreditOwed } from './accounts/creditSummary';
import { hasNekoLedger } from './nekoLedger';
import { nekoSummaryToday } from './nekoDisplay';
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
  transactions: import('../types').Transaction[] = [],
): NetWorthSnapshot {
  if (hasNekoLedger(accounts) && transactions.length > 0) {
    const s = nekoSummaryToday(transactions, accounts);
    const debtBuckets = s.loanAccounts.reduce((sum, r) => sum + Math.max(0, -r.balance), 0);
    return {
      totalInAccounts: s.liquidTotal,
      liquid: s.liquidTotal,
      creditOwed: s.creditTotal,
      debtBuckets,
      netLiquid: s.liquidTotal - s.creditTotal,
    };
  }
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
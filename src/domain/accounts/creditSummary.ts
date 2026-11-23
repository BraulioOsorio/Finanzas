import type { AccountBalance } from '../summaries';
import type { AccountDef } from '../../types';
import { accountDefByName } from './resolveAccounts';

export type CreditCardSummary = {
  account: string;
  balance: number;
  owed: number;
  creditLimit?: number;
  utilization?: number;
  statementCloseDay?: number;
  paymentDueDay?: number;
};

export function creditCardSummaries(
  accounts: AccountDef[],
  balances: AccountBalance[],
): CreditCardSummary[] {
  const out: CreditCardSummary[] = [];
  for (const bal of balances) {
    const def = accountDefByName(accounts, bal.account);
    if (!def || def.kind !== 'credit') {
      continue;
    }
    const owed = bal.balance < 0 ? Math.abs(bal.balance) : bal.balance;
    const limit = def.creditLimit && def.creditLimit > 0 ? def.creditLimit : undefined;
    out.push({
      account: bal.account,
      balance: bal.balance,
      owed,
      creditLimit: limit,
      utilization: limit ? Math.min(1.5, owed / limit) : undefined,
      statementCloseDay: def.statementCloseDay,
      paymentDueDay: def.paymentDueDay,
    });
  }
  return out.sort((a, b) => b.owed - a.owed);
}

export function totalCreditOwed(summaries: CreditCardSummary[]): number {
  return summaries.reduce((s, c) => s + c.owed, 0);
}
import { paymentDueForStatementClose, nextStatementClose } from '../credit/colombiaBilling';
import { cardStatementOutlook, type CardStatementOutlook } from '../credit/statementProjection';
import type { AccountBalance } from '../summaries';
import type { AccountDef, InstallmentPlan, Transaction } from '../../types';
import { applyCreditPresetToDraft } from '../credit/creditPresets';
import { accountDefByName } from './resolveAccounts';

export type CreditCardSummary = {
  account: string;
  balance: number;
  owed: number;
  creditLimit?: number;
  utilization?: number;
  statementCloseDay?: number;
  paymentDueDay?: number;
  paymentDueOffsetDays?: number;
  interestRateEA?: number;
  installmentInterestEA?: number;
  outlook?: CardStatementOutlook;
};

export function creditCardSummaries(
  accounts: AccountDef[],
  balances: AccountBalance[],
  transactions: Transaction[] = [],
  installmentPlans: InstallmentPlan[] = [],
  today = new Date().toISOString().slice(0, 10),
): CreditCardSummary[] {
  const out: CreditCardSummary[] = [];
  for (const bal of balances) {
    const def = accountDefByName(accounts, bal.account);
    if (!def || def.kind !== 'credit') {
      continue;
    }
    const owed = bal.balance < 0 ? Math.abs(bal.balance) : bal.balance;
    const limit = def.creditLimit && def.creditLimit > 0 ? def.creditLimit : undefined;
    const outlook =
      def.statementCloseDay != null
        ? cardStatementOutlook(def, transactions, installmentPlans, today)
        : undefined;

    out.push({
      account: bal.account,
      balance: bal.balance,
      owed,
      creditLimit: limit,
      utilization: limit ? Math.min(1.5, owed / limit) : undefined,
      statementCloseDay: def.statementCloseDay,
      paymentDueDay: def.paymentDueDay,
      paymentDueOffsetDays: def.paymentDueOffsetDays,
      interestRateEA: def.interestRateEA,
      installmentInterestEA: def.installmentInterestEA,
      outlook: outlook ?? undefined,
    });
  }
  return out.sort((a, b) => b.owed - a.owed);
}

export function totalCreditOwed(summaries: CreditCardSummary[]): number {
  return summaries.reduce((s, c) => s + c.owed, 0);
}

export function summarizeNextDue(summaries: CreditCardSummary[]): {
  date?: string;
  totalMinimum: number;
} {
  let earliest: string | undefined;
  let totalMinimum = 0;
  for (const c of summaries) {
    const due = c.outlook?.nextDue;
    const min = c.outlook?.estimatedMinimum ?? 0;
    if (!due) {
      continue;
    }
    totalMinimum += min;
    if (!earliest || due < earliest) {
      earliest = due;
    }
  }
  return { date: earliest, totalMinimum };
}

export function enrichAccountsWithBillingDefaults(accounts: AccountDef[]): AccountDef[] {
  return accounts.map((acc) => {
    if (acc.kind !== 'credit') {
      return acc;
    }
    const merged = applyCreditPresetToDraft(acc.name, { ...acc });
    return { ...acc, ...merged };
  });
}

export function billingHintForCard(def: AccountDef, today = new Date().toISOString().slice(0, 10)): string | null {
  const closeDay = def.statementCloseDay;
  if (!closeDay) {
    return null;
  }
  const close = nextStatementClose(today, closeDay);
  const due = paymentDueForStatementClose(close, def);
  if (!due) {
    return `Próximo corte ${close}`;
  }
  return `Corte ${close} · pago ${due}`;
}
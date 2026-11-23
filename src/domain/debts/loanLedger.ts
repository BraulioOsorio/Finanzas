import { accountDefByName } from '../accounts/resolveAccounts';
import type { AccountDef, Transaction } from '../../types';

const PAYMENT_TYPES = new Set(['Pago de Préstamo', 'Pago de préstamo']);
const DISBURSEMENT_TYPES = new Set(['Fondos del préstamo']);

export type LoanActivityKind = 'payment' | 'disbursement' | 'other';

export type LoanActivity = {
  id: string;
  date: string;
  title: string;
  account: string;
  amount: number;
  signedAmount: number;
  nekoType: string;
  kind: LoanActivityKind;
};

export function isLoanPayment(t: Transaction): boolean {
  return PAYMENT_TYPES.has(t.nekoType.trim());
}

export function isLoanDisbursement(t: Transaction): boolean {
  return DISBURSEMENT_TYPES.has(t.nekoType.trim());
}

export function isDebtRelatedTransaction(t: Transaction): boolean {
  if (isLoanPayment(t) || isLoanDisbursement(t)) {
    return true;
  }
  if (t.categoryGroup.trim().toLowerCase() === 'deudas') {
    return true;
  }
  if (/prestamo|préstamo|deuda/i.test(t.category)) {
    return true;
  }
  return false;
}

export function loanActivities(
  transactions: Transaction[],
  opts?: { monthKey?: string; account?: string; limit?: number },
): LoanActivity[] {
  const out: LoanActivity[] = [];
  for (const t of transactions) {
    if (!isDebtRelatedTransaction(t)) {
      continue;
    }
    if (opts?.monthKey && !t.postedDate.startsWith(opts.monthKey)) {
      continue;
    }
    if (opts?.account && t.account.trim() !== opts.account.trim()) {
      continue;
    }
    const kind: LoanActivityKind = isLoanPayment(t)
      ? 'payment'
      : isLoanDisbursement(t)
        ? 'disbursement'
        : 'other';
    out.push({
      id: t.id,
      date: t.postedDate,
      title: t.description.trim() || t.category || t.nekoType,
      account: t.account,
      amount: t.amount,
      signedAmount: t.signedAmount,
      nekoType: t.nekoType,
      kind,
    });
  }
  out.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  if (opts?.limit) {
    return out.slice(0, opts.limit);
  }
  return out;
}

export function paymentsThisMonth(transactions: Transaction[], monthKey: string): number {
  let sum = 0;
  for (const t of transactions) {
    if (!t.postedDate.startsWith(monthKey)) {
      continue;
    }
    if (!isLoanPayment(t)) {
      continue;
    }
    sum += t.amount;
  }
  return sum;
}

export type LoanProgress = {
  principal?: number;
  remaining: number;
  paidEstimate: number;
  percentPaid?: number;
};

export function loanProgressForAccount(
  accountName: string,
  accounts: AccountDef[],
  balance: number,
): LoanProgress {
  const def = accountDefByName(accounts, accountName);
  const principal = def?.loanPrincipal;
  const remaining = balance < 0 ? Math.abs(balance) : balance;
  if (!principal || principal <= 0) {
    return { remaining, paidEstimate: 0 };
  }
  const paidEstimate = Math.max(0, principal - remaining);
  const percentPaid = Math.min(1, paidEstimate / principal);
  return { principal, remaining, paidEstimate, percentPaid };
}
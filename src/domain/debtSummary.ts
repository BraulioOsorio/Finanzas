import { accountDefByName } from './accounts/resolveAccounts';
import { isLoanPayment, loanProgressForAccount, type LoanProgress } from './debts/loanLedger';
import type { AccountBalance } from './summaries';
import type { AccountDef, Transaction } from '../types';

export type DebtBucketSummary = {
  account: string;
  balance: number;
  owed: number;
  kind?: AccountDef['kind'];
  /** Pagos de préstamo este mes (magnitud positiva) */
  paidThisMonth: number;
  progress: LoanProgress;
};

function isDebtAccount(name: string, def?: AccountDef): boolean {
  if (def?.kind === 'loan') {
    return true;
  }
  const n = name.trim().toLowerCase();
  return n === 'deudas' || n.includes('deuda') || n === 'adicional';
}

export function debtBucketSummaries(
  accounts: AccountDef[],
  balances: AccountBalance[],
  transactions: Transaction[],
  monthKey: string,
): DebtBucketSummary[] {
  const paidByAccount = new Map<string, number>();
  for (const t of transactions) {
    if (!t.postedDate.startsWith(monthKey)) {
      continue;
    }
    if (!isLoanPayment(t)) {
      continue;
    }
    const acc = t.account.trim();
    paidByAccount.set(acc, (paidByAccount.get(acc) ?? 0) + t.amount);
  }

  const out: DebtBucketSummary[] = [];
  for (const bal of balances) {
    const def = accountDefByName(accounts, bal.account);
    if (!isDebtAccount(bal.account, def)) {
      continue;
    }
    const owed = bal.balance < 0 ? Math.abs(bal.balance) : bal.balance;
    out.push({
      account: bal.account,
      balance: bal.balance,
      owed,
      kind: def?.kind,
      paidThisMonth: paidByAccount.get(bal.account.trim()) ?? 0,
      progress: loanProgressForAccount(bal.account, accounts, bal.balance),
    });
  }
  return out.sort((a, b) => b.owed - a.owed);
}

export function totalDebtOwed(summaries: DebtBucketSummary[]): number {
  return summaries.reduce((s, d) => s + d.owed, 0);
}
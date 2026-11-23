import { accountDefByName } from '../accounts/resolveAccounts';
import { isLoanPayment } from './loanLedger';
import type { AccountDef, Transaction } from '../../types';

export type AmortizationRow = {
  index: number;
  date?: string;
  payment: number;
  principal: number;
  interest: number;
  balanceAfter: number;
  actual: boolean;
  label?: string;
};

export type LoanAmortizationPlan = {
  account: string;
  currentBalance: number;
  principal?: number;
  typicalPayment: number;
  rows: AmortizationRow[];
  projectedPayoffMonth?: string;
  note: string;
};

function typicalPayment(transactions: Transaction[], account: string): number {
  const pays = transactions
    .filter((t) => t.account === account && isLoanPayment(t))
    .sort((a, b) => b.postedDate.localeCompare(a.postedDate))
    .slice(0, 6);
  if (!pays.length) {
    return 0;
  }
  return Math.round(pays.reduce((s, t) => s + t.amount, 0) / pays.length);
}

/** Tabla orientativa: pagos reales + proyección a capital sin tasa configurada. */
export function buildLoanAmortization(
  accountName: string,
  accounts: AccountDef[],
  transactions: Transaction[],
  balance: number,
  maxProjected = 24,
): LoanAmortizationPlan {
  const def = accountDefByName(accounts, accountName);
  const principal = def?.loanPrincipal;
  const payments = transactions
    .filter((t) => t.account === accountName && isLoanPayment(t))
    .sort((a, b) => a.postedDate.localeCompare(b.postedDate));

  const monthlyRate =
    def?.loanInterestRateNA && def.loanInterestRateNA > 0
      ? def.loanInterestRateNA / 12 / 100
      : 0;

  let running = principal ?? Math.max(0, -balance);
  const rows: AmortizationRow[] = [];

  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    const pay = p.amount;
    const interest = monthlyRate > 0 ? Math.round(running * monthlyRate) : 0;
    const principalPart = Math.max(0, pay - interest);
    running = Math.max(0, running - principalPart);
    rows.push({
      index: i + 1,
      date: p.postedDate,
      payment: pay,
      principal: principalPart,
      interest: Math.min(interest, pay),
      balanceAfter: running,
      actual: true,
      label: p.description.trim() || p.nekoType,
    });
  }

  const typical = typicalPayment(transactions, accountName);
  let projectedPayoffMonth: string | undefined;
  let cursor = new Date().toISOString().slice(0, 10);

  if (typical > 0 && balance < 0) {
    let remaining = Math.abs(balance);
    let idx = rows.length;
    while (remaining > 0 && idx - rows.length < maxProjected) {
      idx += 1;
      const interest = monthlyRate > 0 ? Math.round(remaining * monthlyRate) : 0;
      const principalPart = Math.max(0, typical - interest);
      const pay = principalPart + interest;
      remaining = Math.max(0, remaining - principalPart);
      cursor = addMonthSameDay(cursor, 1);
      rows.push({
        index: idx,
        date: cursor,
        payment: pay,
        principal: principalPart,
        interest,
        balanceAfter: remaining,
        actual: false,
        label: 'Proyección',
      });
      if (remaining <= 0) {
        projectedPayoffMonth = cursor.slice(0, 7);
        break;
      }
    }
  }

  const note =
    typical > 0
      ? monthlyRate > 0
        ? `Proyección con tasa nominal ${def?.loanInterestRateNA}% EA anual (mensual ~${(monthlyRate * 100).toFixed(2)}%).`
        : 'Proyección usa tu abono medio; indica tasa nominal en la cuenta para separar interés.'
      : 'Registra abonos tipo «Pago de préstamo» para ver historial y proyección.';

  return {
    account: accountName,
    currentBalance: balance,
    principal,
    typicalPayment: typical,
    rows,
    projectedPayoffMonth,
    note,
  };
}

function addMonthSameDay(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
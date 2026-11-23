import {
  applyInterestIVA,
  estimateRevolvingInterest,
  isInPeriod,
  nextStatementClose,
  paymentDueCalendarFromClose,
  paymentDueForStatementClose,
  roundMinimumPaymentCOP,
  statementPeriodForClose,
} from './colombiaBilling';
import { installmentStatementCloseDates, shouldUseStatementBilling } from './installmentBilling';
import { accountDefByName } from '../accounts/resolveAccounts';
import type { AccountDef, InstallmentPlan, Transaction } from '../../types';

export type CardStatementOutlook = {
  account: string;
  nextClose: string;
  nextDue?: string;
  /** true si el vencimiento se movió respecto al calendario simple (día hábil CO). */
  dueOnBusinessDay?: boolean;
  periodStart: string;
  periodEnd: string;
  purchasesInPeriod: number;
  installmentChargesInPeriod: number;
  cardPaymentsInPeriod: number;
  estimatedStatement: number;
  estimatedMinimum: number;
  /** Pagar el extracto completo antes del vencimiento (evitar interés rotativo nuevo). */
  payInFullToZeroInterest: number;
  estimatedInterestIfUnpaid: number;
  /** Interés rotativo mensual sin IVA (referencia). */
  estimatedInterestBase: number;
  daysToDue?: number;
};

function expenseInPeriodOnAccount(
  transactions: Transaction[],
  accountName: string,
  start: string,
  end: string,
): number {
  let sum = 0;
  const norm = accountName.trim().toLowerCase();
  for (const t of transactions) {
    if (t.account.trim().toLowerCase() !== norm) {
      continue;
    }
    if (!isInPeriod(t.postedDate, start, end)) {
      continue;
    }
    if (t.kind === 'transfer') {
      continue;
    }
    if (t.nekoType?.trim() === 'Pago de Tarjeta') {
      continue;
    }
    if (t.signedAmount < 0) {
      sum += Math.abs(t.signedAmount);
    }
  }
  return sum;
}

function cardPaymentsInPeriod(
  transactions: Transaction[],
  accountName: string,
  start: string,
  end: string,
): number {
  let sum = 0;
  const norm = accountName.trim().toLowerCase();
  for (const t of transactions) {
    if (t.account.trim().toLowerCase() !== norm) {
      continue;
    }
    if (!isInPeriod(t.postedDate, start, end)) {
      continue;
    }
    if (t.kind === 'transfer' && t.nekoType?.trim() === 'Pago de Tarjeta') {
      sum += t.amount;
    }
  }
  return sum;
}

function installmentChargesForClose(
  plans: InstallmentPlan[],
  accounts: AccountDef[],
  closeIso: string,
): number {
  let sum = 0;
  for (const plan of plans) {
    if (!plan.active) {
      continue;
    }
    const def = accountDefByName(accounts, plan.account);
    if (!def || !shouldUseStatementBilling(plan, def)) {
      continue;
    }
    const dates = installmentStatementCloseDates(plan, def);
    if (dates.includes(closeIso)) {
      sum += plan.perInstallment;
    }
  }
  return sum;
}

export function cardStatementOutlook(
  account: AccountDef,
  transactions: Transaction[],
  installmentPlans: InstallmentPlan[],
  today = new Date().toISOString().slice(0, 10),
): CardStatementOutlook | null {
  const closeDay = account.statementCloseDay;
  if (!closeDay || account.kind !== 'credit') {
    return null;
  }

  const nextClose = nextStatementClose(today, closeDay);
  const { start, end } = statementPeriodForClose(nextClose, closeDay);
  const nextDueCalendar = paymentDueCalendarFromClose(nextClose, account);
  const nextDue = paymentDueForStatementClose(nextClose, account);
  const dueOnBusinessDay = Boolean(
    nextDue && nextDueCalendar && nextDue !== nextDueCalendar,
  );

  const purchases = expenseInPeriodOnAccount(transactions, account.name, start, end);
  const installments = installmentChargesForClose(installmentPlans, [account], nextClose);
  const payments = cardPaymentsInPeriod(transactions, account.name, start, end);

  const estimatedStatement = Math.max(0, purchases + installments - payments);
  const pct = account.minimumPaymentPercent ?? 10;
  const rawMinimum = estimatedStatement * (pct / 100) + installments;
  const estimatedMinimum = roundMinimumPaymentCOP(rawMinimum);
  const ea = account.interestRateEA ?? 0;
  const estimatedInterestBase = estimateRevolvingInterest(estimatedStatement, ea);
  const estimatedInterestIfUnpaid = applyInterestIVA(estimatedInterestBase);

  let daysToDue: number | undefined;
  if (nextDue) {
    const a = new Date(`${today}T12:00:00`).getTime();
    const b = new Date(`${nextDue}T12:00:00`).getTime();
    daysToDue = Math.max(0, Math.round((b - a) / 86400000));
  }

  return {
    account: account.name,
    nextClose,
    nextDue,
    dueOnBusinessDay,
    periodStart: start,
    periodEnd: end,
    purchasesInPeriod: purchases,
    installmentChargesInPeriod: installments,
    cardPaymentsInPeriod: payments,
    estimatedStatement,
    estimatedMinimum,
    payInFullToZeroInterest: estimatedStatement,
    estimatedInterestIfUnpaid,
    estimatedInterestBase,
    daysToDue,
  };
}

export function allCardOutlooks(
  accounts: AccountDef[],
  transactions: Transaction[],
  installmentPlans: InstallmentPlan[],
  today?: string,
): CardStatementOutlook[] {
  return accounts
    .filter((a) => !a.archived && a.kind === 'credit' && a.statementCloseDay)
    .map((a) => cardStatementOutlook(a, transactions, installmentPlans, today))
    .filter((x): x is CardStatementOutlook => x != null)
    .sort((a, b) => a.nextDue?.localeCompare(b.nextDue ?? '') ?? 0);
}
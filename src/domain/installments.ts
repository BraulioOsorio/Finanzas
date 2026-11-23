import { accountDefByName } from './accounts/resolveAccounts';
import { estimateInstallmentWithInterest } from './credit/colombiaBilling';
import {
  installmentStatementCloseDates,
  shouldUseStatementBilling,
} from './credit/installmentBilling';
import { addMonths } from './scheduleProjection';
import type { AccountDef, InstallmentPlan } from '../types';

/** Fechas visibles de cada cuota (corte de tarjeta o calendario mensual). */
export function installmentDates(plan: InstallmentPlan, account?: AccountDef): string[] {
  if (!plan.active) {
    return [];
  }
  if (account && shouldUseStatementBilling(plan, account)) {
    const onStatement = installmentStatementCloseDates(plan, account);
    if (onStatement.length) {
      return onStatement;
    }
  }
  const out: string[] = [];
  for (let i = 0; i < plan.installmentCount; i++) {
    out.push(i === 0 ? plan.startDate : addMonths(plan.startDate, i));
  }
  return out;
}

export function installmentsInRange(
  plan: InstallmentPlan,
  rangeStart: string,
  rangeEnd: string,
  account?: AccountDef,
): { date: string; index: number }[] {
  const hits: { date: string; index: number }[] = [];
  installmentDates(plan, account).forEach((date, index) => {
    if (date >= rangeStart && date <= rangeEnd) {
      hits.push({ date, index });
    }
  });
  return hits;
}

export function signedAmountForInstallment(plan: InstallmentPlan, account?: AccountDef): number {
  const ea =
    account?.installmentInterestEA ?? account?.interestRateEA ?? 0;
  if (ea > 0 && plan.billingMode !== 'calendar') {
    const withInt = estimateInstallmentWithInterest(
      plan.totalAmount,
      plan.installmentCount,
      ea,
    );
    return -withInt;
  }
  return -plan.perInstallment;
}

export function installmentTitle(plan: InstallmentPlan, index: number, account?: AccountDef): string {
  const base = `${plan.title} (${index + 1}/${plan.installmentCount})`;
  if (account?.statementCloseDay && shouldUseStatementBilling(plan, account)) {
    return `${base} · corte`;
  }
  return base;
}

export function resolveInstallmentAccount(
  plan: InstallmentPlan,
  accounts: AccountDef[],
): AccountDef | undefined {
  return accountDefByName(accounts, plan.account);
}
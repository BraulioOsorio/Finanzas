import {
  addCalendarMonths,
  statementCloseContainingPurchase,
} from './colombiaBilling';
import type { AccountDef, InstallmentPlan } from '../../types';

/**
 * Fechas de cargo de cada cuota en tarjeta (día de corte del extracto).
 * Por defecto la 1.ª cuota va en el extracto siguiente al de la compra (práctica habitual en CO).
 */
export function installmentStatementCloseDates(
  plan: InstallmentPlan,
  account: AccountDef,
): string[] {
  const closeDay = account.statementCloseDay;
  if (!closeDay || plan.billingMode === 'calendar') {
    return [];
  }

  const purchase = plan.purchaseDate || plan.startDate;
  const purchaseClose = statementCloseContainingPurchase(purchase, closeDay);
  const lag = plan.statementLagMonths ?? 1;

  const out: string[] = [];
  for (let i = 0; i < plan.installmentCount; i++) {
    out.push(addCalendarMonths(purchaseClose, lag + i));
  }
  return out;
}

export function shouldUseStatementBilling(plan: InstallmentPlan, account?: AccountDef): boolean {
  if (plan.billingMode === 'calendar') {
    return false;
  }
  if (plan.billingMode === 'card_statement') {
    return Boolean(account?.statementCloseDay);
  }
  return account?.kind === 'credit' && Boolean(account.statementCloseDay);
}
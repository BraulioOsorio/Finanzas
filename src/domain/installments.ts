import { addMonths } from './scheduleProjection';
import type { InstallmentPlan } from '../types';

/** Fechas de cada cuota (mensual desde startDate). */
export function installmentDates(plan: InstallmentPlan): string[] {
  if (!plan.active) {
    return [];
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
): { date: string; index: number }[] {
  const hits: { date: string; index: number }[] = [];
  planDates(plan).forEach((date, index) => {
    if (date >= rangeStart && date <= rangeEnd) {
      hits.push({ date, index });
    }
  });
  return hits;
}

function planDates(plan: InstallmentPlan): string[] {
  return installmentDates(plan);
}

export function signedAmountForInstallment(plan: InstallmentPlan): number {
  return -plan.perInstallment;
}

export function installmentTitle(plan: InstallmentPlan, index: number): string {
  return `${plan.title} (${index + 1}/${plan.installmentCount})`;
}
import { installmentDates } from './installments';
import type { AccountDef, InstallmentPlan } from '../types';

export type InstallmentProgress = {
  total: number;
  /** Cuotas cuyo corte/fecha ya pasó (proyección). */
  projectedThrough: number;
  remaining: number;
  nextDate?: string;
};

export function installmentProgress(
  plan: InstallmentPlan,
  account: AccountDef | undefined,
  today = new Date().toISOString().slice(0, 10),
): InstallmentProgress {
  const dates = installmentDates(plan, account);
  const total = plan.installmentCount;
  let projectedThrough = 0;
  for (const d of dates) {
    if (d <= today) {
      projectedThrough += 1;
    }
  }
  const remaining = Math.max(0, total - projectedThrough);
  const nextDate = dates.find((d) => d > today);
  return { total, projectedThrough, remaining, nextDate };
}
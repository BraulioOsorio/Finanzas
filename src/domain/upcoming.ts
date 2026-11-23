import { installmentsInRange, installmentTitle, signedAmountForInstallment } from './installments';
import { occurrencesInRange, signedAmountForScheduled } from './scheduleProjection';
import type { AccountDef, InstallmentPlan, ScheduledPayment } from '../types';

export type UpcomingItem = {
  id: string;
  date: string;
  title: string;
  signedAmount: number;
  account: string;
  kind: 'plan' | 'installment' | 'card_due';
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Próximos eventos en ventana (hoy … hoy+daysAhead). */
export function buildUpcoming(
  scheduled: ScheduledPayment[],
  installments: InstallmentPlan[],
  accounts: AccountDef[],
  today = new Date().toISOString().slice(0, 10),
  daysAhead = 14,
): UpcomingItem[] {
  const rangeEnd = addDays(today, daysAhead);
  const out: UpcomingItem[] = [];

  for (const item of scheduled) {
    const dates = occurrencesInRange(item, today, rangeEnd);
    const signed = signedAmountForScheduled(item);
    for (const date of dates) {
      out.push({
        id: `sch-${item.id}-${date}`,
        date,
        title: item.title,
        signedAmount: signed,
        account: item.account,
        kind: 'plan',
      });
    }
  }

  for (const plan of installments) {
    if (!plan.active) {
      continue;
    }
    const hits = installmentsInRange(plan, today, rangeEnd);
    const signed = signedAmountForInstallment(plan);
    for (const { date, index } of hits) {
      out.push({
        id: `ins-${plan.id}-${date}`,
        date,
        title: installmentTitle(plan, index),
        signedAmount: signed,
        account: plan.account,
        kind: 'installment',
      });
    }
  }

  for (const acc of accounts) {
    if (!acc.paymentDueDay || acc.archived || acc.kind !== 'credit') {
      continue;
    }
    const due = nextCreditDueDate(today, acc.paymentDueDay);
    if (due >= today && due <= rangeEnd) {
      out.push({
        id: `card-${acc.id}-${due}`,
        date: due,
        title: `Pago tarjeta · ${acc.name}`,
        signedAmount: 0,
        account: acc.name,
        kind: 'card_due',
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function nextCreditDueDate(fromIso: string, dueDay: number): string {
  const d = new Date(`${fromIso}T12:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  let candidate = new Date(year, month, Math.min(dueDay, 28));
  if (candidate.toISOString().slice(0, 10) < fromIso) {
    candidate = new Date(year, month + 1, Math.min(dueDay, 28));
  }
  return candidate.toISOString().slice(0, 10);
}
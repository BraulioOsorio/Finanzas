import { buildMonthCalendar, monthKeyFromDate, shiftMonth } from './calendar';
import type { AccountDef, InstallmentPlan, ScheduledPayment, Transaction } from '../types';

export type OverdraftAlert = {
  account: string;
  date: string;
  projectedBalance: number;
  message: string;
};

function monthsToScan(fromIso: string, daysAhead: number): string[] {
  const start = monthKeyFromDate(new Date(`${fromIso}T12:00:00`));
  const end = monthKeyFromDate(new Date(`${fromIso}T12:00:00`));
  const endDate = new Date(`${fromIso}T12:00:00`);
  endDate.setDate(endDate.getDate() + daysAhead);
  const endMonth = monthKeyFromDate(endDate);
  const months: string[] = [];
  let cur = start;
  let guard = 0;
  while (guard++ < 6) {
    months.push(cur);
    if (cur >= endMonth) {
      break;
    }
    cur = shiftMonth(cur, 1);
  }
  return months;
}

/** Primera fecha futura en la que el saldo proyectado de la cuenta cae bajo cero. */
export function findOverdraftAlerts(
  transactions: Transaction[],
  accounts: AccountDef[],
  scheduled: ScheduledPayment[],
  installmentPlans: InstallmentPlan[],
  today = new Date().toISOString().slice(0, 10),
  daysAhead = 45,
): OverdraftAlert[] {
  const names = new Set<string>();
  for (const a of accounts) {
    if (!a.archived) {
      names.add(a.name.trim());
    }
  }
  for (const t of transactions) {
    names.add(t.account.trim());
  }

  const alerts: OverdraftAlert[] = [];
  const months = monthsToScan(today, daysAhead);

  for (const account of [...names].sort()) {
    const def = accounts.find((a) => a.name.trim() === account);
    if (def?.kind === 'credit') {
      continue;
    }

    for (const monthKey of months) {
      const { days } = buildMonthCalendar(
        transactions,
        monthKey,
        account,
        scheduled,
        installmentPlans,
        accounts,
        today,
      );
      for (const day of days) {
        if (day.date < today) {
          continue;
        }
        const cutoff = addDays(today, daysAhead);
        if (day.date > cutoff) {
          break;
        }
        if (day.balance < 0) {
          alerts.push({
            account,
            date: day.date,
            projectedBalance: day.balance,
            message: `${account} podría quedar en ${day.balance.toLocaleString('es-CO')} COP el ${day.date}`,
          });
          break;
        }
      }
      if (alerts.some((a) => a.account === account)) {
        break;
      }
    }
  }

  return alerts.sort((a, b) => a.date.localeCompare(b.date) || a.account.localeCompare(b.account));
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
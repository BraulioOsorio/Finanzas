import type { ScheduledPayment } from '../types';

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function advance(item: ScheduledPayment, from: string): string | null {
  if (item.frequency === 'once') {
    return null;
  }
  if (item.frequency === 'weekly') {
    return addDays(from, 7);
  }
  if (item.frequency === 'biweekly') {
    return addDays(from, 14);
  }
  return addMonths(from, 1);
}

/** Ocurrencias activas en el rango [rangeStart, rangeEnd], inclusive */
export function occurrencesInRange(
  item: ScheduledPayment,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  if (!item.active) {
    return [];
  }

  const out: string[] = [];
  let cursor = item.startDate;

  while (cursor < rangeStart) {
    const next = advance(item, cursor);
    if (!next) {
      return out;
    }
    cursor = next;
  }

  for (;;) {
    if (item.endDate && cursor > item.endDate) {
      break;
    }
    if (cursor > rangeEnd) {
      break;
    }
    if (cursor >= rangeStart) {
      out.push(cursor);
    }
    const next = advance(item, cursor);
    if (!next) {
      break;
    }
    cursor = next;
  }

  return out;
}

export function signedAmountForScheduled(item: ScheduledPayment): number {
  return item.kind === 'income' ? item.amount : -item.amount;
}

/** Próximo ingreso programado en Plan (quincena, sueldo, etc.). */
export function nextPlannedIncomeDate(
  scheduled: ScheduledPayment[],
  today: string,
  lookaheadDays = 120,
): string | null {
  const rangeEnd = addDays(today, lookaheadDays);
  let best: string | null = null;
  for (const item of scheduled) {
    if (!item.active || item.kind !== 'income') {
      continue;
    }
    const dates = occurrencesInRange(item, today, rangeEnd);
    for (const d of dates) {
      if (d >= today && (!best || d < best)) {
        best = d;
      }
    }
  }
  return best;
}

export function scheduleFrequencyLabel(freq: ScheduledPayment['frequency']): string {
  switch (freq) {
    case 'once':
      return 'Una vez';
    case 'weekly':
      return 'Semanal';
    case 'biweekly':
      return 'Quincenal';
    case 'monthly':
      return 'Mensual';
  }
}
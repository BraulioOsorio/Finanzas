import type { AccountDef } from '../../types';

/** Día del mes con tope (extractos colombianos suelen usar 1–28). */
export function dayOfMonthClamped(year: number, monthIndex: number, day: number): string {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const d = Math.min(Math.max(day, 1), Math.min(28, last));
  const m = String(monthIndex + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${year}-${m}-${dd}`;
}

export function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function addCalendarMonths(iso: string, months: number): string {
  const d = parseIso(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Próximo corte (inclusive si hoy es día de corte). */
export function nextStatementClose(fromIso: string, closeDay: number): string {
  const d = parseIso(fromIso);
  const y = d.getFullYear();
  const m = d.getMonth();
  const thisClose = dayOfMonthClamped(y, m, closeDay);
  if (fromIso <= thisClose) {
    return thisClose;
  }
  const nextM = m + 1;
  const nextY = nextM > 11 ? y + 1 : y;
  const nextMonthIndex = nextM > 11 ? 0 : nextM;
  return dayOfMonthClamped(nextY, nextMonthIndex, closeDay);
}

/** Cierre de extracto que contiene la compra (regla habitual en Colombia). */
export function statementCloseContainingPurchase(purchaseIso: string, closeDay: number): string {
  const d = parseIso(purchaseIso);
  const y = d.getFullYear();
  const m = d.getMonth();
  const closeThisMonth = dayOfMonthClamped(y, m, closeDay);
  if (purchaseIso <= closeThisMonth) {
    return closeThisMonth;
  }
  const nextM = m + 1;
  const nextY = nextM > 11 ? y + 1 : y;
  const nextMonthIndex = nextM > 11 ? 0 : nextM;
  return dayOfMonthClamped(nextY, nextMonthIndex, closeDay);
}

/** Inicio del periodo que termina en `closeIso` (día siguiente al corte anterior). */
export function statementPeriodStart(closeIso: string, closeDay: number): string {
  const prevClose = addCalendarMonths(closeIso, -1);
  const d = parseIso(prevClose);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function statementPeriodForClose(closeIso: string, closeDay: number): {
  start: string;
  end: string;
} {
  return {
    start: statementPeriodStart(closeIso, closeDay),
    end: closeIso,
  };
}

/**
 * Fecha límite de pago asociada a un corte.
 * Prioridad: `paymentDueOffsetDays` (días hábiles aproximados como gracia CO) o día fijo del mes.
 */
export function paymentDueForStatementClose(closeIso: string, account: AccountDef): string | undefined {
  const closeDay = account.statementCloseDay;
  if (!closeDay) {
    return account.paymentDueDay
      ? nextFixedCalendarDay(closeIso, account.paymentDueDay)
      : undefined;
  }

  if (account.paymentDueOffsetDays && account.paymentDueOffsetDays > 0) {
    const d = parseIso(closeIso);
    d.setDate(d.getDate() + account.paymentDueOffsetDays);
    return d.toISOString().slice(0, 10);
  }

  if (account.paymentDueDay) {
    return dueDayAfterClose(closeIso, closeDay, account.paymentDueDay);
  }

  return undefined;
}

/** Primer día de pago fijo estrictamente después de `fromIso`. */
function nextFixedCalendarDay(fromIso: string, dueDay: number): string {
  const d = parseIso(fromIso);
  let y = d.getFullYear();
  let m = d.getMonth();
  let candidate = dayOfMonthClamped(y, m, dueDay);
  if (candidate <= fromIso) {
    m += 1;
    if (m > 11) {
      y += 1;
      m = 0;
    }
    candidate = dayOfMonthClamped(y, m, dueDay);
  }
  return candidate;
}

/**
 * Modelo habitual: si el día de pago es menor al de corte, el pago cae en el mes siguiente al corte;
 * si es mayor, suele ser el mismo mes del corte (tras la fecha de corte).
 */
function dueDayAfterClose(closeIso: string, closeDay: number, dueDay: number): string {
  const d = parseIso(closeIso);
  const y = d.getFullYear();
  const m = d.getMonth();

  if (dueDay > closeDay) {
    const sameMonth = dayOfMonthClamped(y, m, dueDay);
    if (sameMonth > closeIso) {
      return sameMonth;
    }
  }

  const nextM = m + 1;
  const nextY = nextM > 11 ? y + 1 : y;
  const nextMonthIndex = nextM > 11 ? 0 : nextM;
  return dayOfMonthClamped(nextY, nextMonthIndex, dueDay);
}

/** Tasa mensual a partir de EA (efectiva anual) — convención supervisión financiera CO. */
export function monthlyRateFromEA(annualEA: number): number {
  if (annualEA <= 0) {
    return 0;
  }
  return Math.pow(1 + annualEA / 100, 1 / 12) - 1;
}

/** Interés aproximado de saldo rotativo un mes (no incluye capital de cuotas). */
export function estimateRevolvingInterest(balanceOwed: number, annualEA: number): number {
  if (balanceOwed <= 0 || annualEA <= 0) {
    return 0;
  }
  const i = monthlyRateFromEA(annualEA);
  return Math.round(balanceOwed * i);
}

/** Cuota fija aproximada (capital + interés) para compra diferida con misma EA. */
export function estimateInstallmentWithInterest(
  principal: number,
  count: number,
  annualEA: number,
): number {
  if (count <= 0) {
    return principal;
  }
  if (annualEA <= 0) {
    return Math.round(principal / count);
  }
  const i = monthlyRateFromEA(annualEA);
  const factor = (i * Math.pow(1 + i, count)) / (Math.pow(1 + i, count) - 1);
  return Math.round(principal * factor);
}

export function isInPeriod(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}
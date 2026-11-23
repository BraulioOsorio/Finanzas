import { parseIso } from './colombiaBilling';

/** Feriados colombianos fijos (ISO). Semana Santa y traslados no incluidos en v1. */
const FIXED_HOLIDAYS = new Set([
  '2025-01-01',
  '2025-05-01',
  '2025-07-20',
  '2025-08-07',
  '2025-12-08',
  '2025-12-25',
  '2026-01-01',
  '2026-05-01',
  '2026-07-20',
  '2026-08-07',
  '2026-12-08',
  '2026-12-25',
]);

export function isWeekend(iso: string): boolean {
  const d = parseIso(iso);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isColombiaHoliday(iso: string): boolean {
  return FIXED_HOLIDAYS.has(iso);
}

export function isColombiaBusinessDay(iso: string): boolean {
  return !isWeekend(iso) && !isColombiaHoliday(iso);
}

/** Si el vencimiento cae en fin de semana o festivo, muchos bancos CO pasan al siguiente día hábil. */
export function shiftToColombiaBusinessDay(iso: string): string {
  let cursor = iso;
  let guard = 0;
  while (!isColombiaBusinessDay(cursor) && guard < 12) {
    const d = parseIso(cursor);
    d.setDate(d.getDate() + 1);
    cursor = d.toISOString().slice(0, 10);
    guard += 1;
  }
  return cursor;
}

/** Gracia en días hábiles (hábito en franquicias CO con «X días después del corte»). */
export function addColombiaBusinessDays(iso: string, businessDays: number): string {
  let cursor = iso;
  let left = businessDays;
  let guard = 0;
  while (left > 0 && guard < 64) {
    const d = parseIso(cursor);
    d.setDate(d.getDate() + 1);
    cursor = d.toISOString().slice(0, 10);
    if (isColombiaBusinessDay(cursor)) {
      left -= 1;
    }
    guard += 1;
  }
  return shiftToColombiaBusinessDay(cursor);
}
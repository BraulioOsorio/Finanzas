import { daysInMonth, parseMonthKey } from './calendar';
import type { Transaction } from '../types';
import { formatCurrencyFull } from '../utils/format';

export type MonthReportLine = { label: string; amount: number };

export type MonthReportSection = {
  id: string;
  title: string;
  icon: 'income' | 'transfer_in' | 'expense' | 'card';
  total: number;
  lines: MonthReportLine[];
  signed: 'positive' | 'negative';
};

const CARD_TYPES = new Set(['Pago de Tarjeta', 'Pago de tarjeta']);

function inMonth(t: Transaction, monthKey: string): boolean {
  return t.postedDate.startsWith(monthKey);
}

function nekoBucket(t: Transaction): string {
  const n = t.nekoType.trim();
  if (n) {
    return n;
  }
  if (t.kind === 'income') {
    return 'Ingreso';
  }
  if (t.kind === 'transfer') {
    return t.signedAmount >= 0 ? 'Transferencia' : 'Transferencia';
  }
  return 'Gasto';
}

function groupLines(
  transactions: Transaction[],
  monthKey: string,
  predicate: (t: Transaction) => boolean,
): MonthReportLine[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!inMonth(t, monthKey) || !predicate(t)) {
      continue;
    }
    const key = t.description.trim() || t.category.trim() || t.account || 'Sin nombre';
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** «Resumen de noviembre» al estilo NEKO. */
export function buildMonthNekoReport(
  transactions: Transaction[],
  monthKey: string,
): MonthReportSection[] {
  const incomeLines = groupLines(
    transactions,
    monthKey,
    (t) => t.kind === 'income' || t.nekoType.trim().toLowerCase() === 'ingreso',
  );
  const incomeTotal = incomeLines.reduce((s, l) => s + l.amount, 0);

  const xferInLines = groupLines(
    transactions,
    monthKey,
    (t) =>
      t.kind === 'transfer' &&
      t.signedAmount > 0 &&
      t.nekoType.trim().toLowerCase() === 'transferencia',
  );
  const xferInTotal = xferInLines.reduce((s, l) => s + l.amount, 0);

  const expenseLines = groupLines(
    transactions,
    monthKey,
    (t) => {
      const n = nekoBucket(t);
      return (
        (t.kind === 'expense' || t.kind === 'transfer') &&
        !CARD_TYPES.has(n) &&
        n !== 'Ingreso'
      );
    },
  );
  const expenseTotal = expenseLines.reduce((s, l) => s + l.amount, 0);

  const cardLines = groupLines(transactions, monthKey, (t) => CARD_TYPES.has(t.nekoType.trim()));
  const cardTotal = cardLines.reduce((s, l) => s + l.amount, 0);

  const sections: MonthReportSection[] = [
    {
      id: 'income',
      title: 'Ingreso',
      icon: 'income',
      total: incomeTotal,
      lines: incomeLines,
      signed: 'positive',
    },
    {
      id: 'xfer',
      title: 'Transferencias Entrantes',
      icon: 'transfer_in',
      total: xferInTotal,
      lines: xferInLines,
      signed: 'positive',
    },
    {
      id: 'expense',
      title: 'Gastos',
      icon: 'expense',
      total: expenseTotal,
      lines: expenseLines,
      signed: 'negative',
    },
    {
      id: 'card',
      title: 'Pagos de Tarjeta',
      icon: 'card',
      total: cardTotal,
      lines: cardLines,
      signed: 'negative',
    },
  ];
  return sections.filter((s) => s.total > 0 || s.lines.length > 0);
}

export function monthReportTitle(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const name = new Date(year, month - 1, 1).toLocaleDateString('es', { month: 'long' });
  return `Resumen de ${name}`;
}

export function formatReportTotal(section: MonthReportSection): string {
  const sign = section.signed === 'positive' ? '+' : '−';
  return `${sign}${formatCurrencyFull(section.total)}`;
}

export function monthBounds(monthKey: string): { start: string; end: string } {
  const last = daysInMonth(monthKey);
  return { start: `${monthKey}-01`, end: `${monthKey}-${String(last).padStart(2, '0')}` };
}
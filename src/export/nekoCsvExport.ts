import type { Transaction } from '../types';

const HEADER =
  'Posted Date,Transaction Type,Description,Amount,Account,Category Group,Category,Notes';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function nekoTypeForExport(t: Transaction): string {
  return t.nekoType?.trim() || (t.kind === 'income' ? 'Ingreso' : t.kind === 'transfer' ? 'Transferencia' : 'Gasto');
}

export function transactionsToNekoCsv(transactions: Transaction[]): string {
  const lines = [HEADER];
  const sorted = [...transactions].sort((a, b) => {
    const d = a.postedDate.localeCompare(b.postedDate);
    if (d !== 0) {
      return d;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  for (const t of sorted) {
    const row = [
      t.postedDate,
      nekoTypeForExport(t),
      t.description,
      String(t.signedAmount),
      t.account,
      t.categoryGroup,
      t.category,
      t.notes,
    ].map((c) => escapeCsvCell(c ?? ''));
    lines.push(row.join(','));
  }

  return lines.join('\n');
}
import { FINANZAS_EXTENDED_HEADER_LINE, NEKO_CSV_HEADER_LINE } from '../import/parseNekoCsv';
import type { Transaction } from '../types';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function nekoTypeForExport(t: Transaction): string {
  return t.nekoType?.trim() || (t.kind === 'income' ? 'Ingreso' : t.kind === 'transfer' ? 'Transferencia' : 'Gasto');
}

function hasExtendedFields(t: Transaction): boolean {
  return Boolean(
    t.installmentMeta ||
      t.purchaseTotal ||
      t.installmentCurrent ||
      t.installmentCountHint,
  );
}

export function transactionsToNekoCsv(transactions: Transaction[]): string {
  const useExtended = transactions.some(hasExtendedFields);
  const header = useExtended ? FINANZAS_EXTENDED_HEADER_LINE : NEKO_CSV_HEADER_LINE;
  const lines = [header];

  const sorted = [...transactions].sort((a, b) => {
    const d = a.postedDate.localeCompare(b.postedDate);
    if (d !== 0) {
      return d;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  for (const t of sorted) {
    const base = [
      t.postedDate,
      nekoTypeForExport(t),
      t.description,
      String(t.signedAmount),
      t.account,
      t.categoryGroup,
      t.category,
      t.notes,
    ];
    if (useExtended) {
      const meta =
        t.installmentMeta ??
        (t.installmentCurrent && t.installmentCountHint
          ? `${t.installmentCurrent}/${t.installmentCountHint}`
          : t.installmentCountHint
            ? `${t.installmentCountHint} cuotas`
            : '');
      base.push(
        meta,
        t.purchaseTotal != null ? String(-Math.abs(t.purchaseTotal)) : '',
        t.installmentCurrent != null ? String(t.installmentCurrent) : '',
      );
    }
    lines.push(base.map((c) => escapeCsvCell(c ?? '')).join(','));
  }

  return lines.join('\n');
}
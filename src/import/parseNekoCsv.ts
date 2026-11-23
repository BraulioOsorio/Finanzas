import { parseCsvRecords } from './parseCsv';
import { nekoRowToDraft } from './nekoMapping';
import type { NekoCsvRow, Transaction } from '../types';

const EXPECTED_HEADER = [
  'Posted Date',
  'Transaction Type',
  'Description',
  'Amount',
  'Account',
  'Category Group',
  'Category',
  'Notes',
];

function normalizeHeader(cell: string): string {
  return cell.replace(/^\uFEFF/, '').trim();
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function rowToNeko(row: string[], lineNumber: number): { row?: NekoCsvRow; error?: string } {
  if (row.length < 8) {
    return { error: `Línea ${lineNumber}: faltan columnas (${row.length}/8)` };
  }

  const [
    postedDate,
    transactionType,
    description,
    amountRaw,
    account,
    categoryGroup,
    category,
    notes,
  ] = row;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(postedDate.trim())) {
    return { error: `Línea ${lineNumber}: fecha inválida "${postedDate}"` };
  }

  const amount = parseAmount(amountRaw);
  if (amount === null || amount === 0) {
    return { error: `Línea ${lineNumber}: monto inválido "${amountRaw}"` };
  }

  return {
    row: {
      postedDate: postedDate.trim(),
      transactionType: transactionType.trim(),
      description,
      amount,
      account,
      categoryGroup,
      category,
      notes,
    },
  };
}

export function parseNekoCsv(content: string): {
  transactions: Transaction[];
  errors: string[];
} {
  const records = parseCsvRecords(content);
  if (records.length === 0) {
    return { transactions: [], errors: ['El archivo está vacío.'] };
  }

  const header = records[0].map(normalizeHeader);
  const headerOk =
    header.length >= EXPECTED_HEADER.length &&
    EXPECTED_HEADER.every((col, i) => header[i] === col);

  if (!headerOk) {
    return {
      transactions: [],
      errors: [
        'Encabezado no coincide con export Neko. Se espera: ' + EXPECTED_HEADER.join(', '),
      ],
    };
  }

  const transactions: Transaction[] = [];
  const errors: string[] = [];

  for (let i = 1; i < records.length; i++) {
    const parsed = rowToNeko(records[i], i + 1);
    if (parsed.error) {
      errors.push(parsed.error);
      continue;
    }
    const { id, draft, postedIso } = nekoRowToDraft(parsed.row!, i);
    transactions.push({
      id,
      ...draft,
      createdAt: postedIso,
    });
  }

  return { transactions, errors };
}

export function applyImport(
  existing: Transaction[],
  incoming: Transaction[],
  mode: 'replace' | 'merge',
): {
  next: Transaction[];
  result: { imported: number; skipped: number; errors: string[] };
} {
  const { transactions, errors } = { transactions: incoming, errors: [] as string[] };
  if (mode === 'replace') {
    return {
      next: transactions,
      result: { imported: transactions.length, skipped: 0, errors },
    };
  }

  const existingIds = new Set(existing.map((t) => t.id));
  const toAdd = transactions.filter((t) => !existingIds.has(t.id));
  const skipped = transactions.length - toAdd.length;
  return {
    next: [...existing, ...toAdd],
    result: { imported: toAdd.length, skipped, errors },
  };
}
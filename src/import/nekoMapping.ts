import type { NekoCsvRow, TransactionKind } from '../types';

const TRANSFER_TYPES = new Set(['Transferencia', 'Pago de Tarjeta']);

const INCOME_TYPES = new Set(['Ingreso', 'Reembolso', 'Fondos del préstamo']);

const EXPENSE_TYPES = new Set([
  'Gasto',
  'Pago',
  'Compra a meses',
  'Pago de Préstamo',
  'Pago de préstamo',
]);

export function classifyNekoType(transactionType: string): TransactionKind {
  const trimmed = transactionType.trim();
  if (TRANSFER_TYPES.has(trimmed)) {
    return 'transfer';
  }
  if (INCOME_TYPES.has(trimmed)) {
    return 'income';
  }
  if (EXPENSE_TYPES.has(trimmed)) {
    return 'expense';
  }
  const amountSignHint = trimmed.toLowerCase();
  if (amountSignHint.includes('ingreso') || amountSignHint.includes('reembolso')) {
    return 'income';
  }
  if (amountSignHint.includes('transfer')) {
    return 'transfer';
  }
  return 'expense';
}

export function nekoRowToDraft(row: NekoCsvRow, rowIndex: number) {
  const kind = classifyNekoType(row.transactionType);
  const signedAmount = row.amount;
  const amount = Math.abs(signedAmount);

  let resolvedKind = kind;
  if (kind !== 'transfer') {
    if (signedAmount > 0 && kind === 'expense') {
      resolvedKind = 'income';
    } else if (signedAmount < 0 && kind === 'income') {
      resolvedKind = 'expense';
    }
  }

  const type: 'income' | 'expense' =
    resolvedKind === 'income' ? 'income' : 'expense';

  const category =
    row.category.trim() ||
    row.categoryGroup.trim() ||
    row.transactionType.trim() ||
    'Sin categoría';

  const postedIso = `${row.postedDate}T12:00:00.000Z`;

  return {
    id: buildNekoId(row, rowIndex),
    draft: {
      kind: resolvedKind,
      type,
      amount,
      signedAmount,
      postedDate: row.postedDate,
      nekoType: row.transactionType.trim(),
      description: row.description.trim(),
      account: row.account.trim(),
      categoryGroup: row.categoryGroup.trim(),
      category,
      notes: row.notes.trim(),
      source: 'neko' as const,
      installmentMeta: row.installmentMeta,
      purchaseTotal: row.purchaseTotal,
      installmentCurrent: row.installmentCurrent,
      installmentCountHint: row.installmentCountHint,
    },
    postedIso,
  };
}

function buildNekoId(row: NekoCsvRow, rowIndex: number): string {
  const key = [
    row.postedDate,
    row.transactionType,
    row.description,
    row.amount,
    row.account,
    rowIndex,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return `neko-${row.postedDate}-${rowIndex}-${Math.abs(hash)}`;
}
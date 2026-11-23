import type { Transaction, TransactionKind } from '../types';

function legacyKind(type: string | undefined, amount: number): TransactionKind {
  if (type === 'income') {
    return 'income';
  }
  if (type === 'expense') {
    return 'expense';
  }
  return amount < 0 ? 'expense' : 'income';
}

export function migrateTransaction(raw: unknown): Transaction | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const r = raw as Partial<Transaction> & { note?: string };
  if (!r.id || typeof r.amount !== 'number') {
    return null;
  }

  const kind: TransactionKind =
    r.kind ??
    (r.nekoType?.toLowerCase().includes('transferencia') ? 'transfer' : legacyKind(r.type, r.amount));

  const type: 'income' | 'expense' =
    kind === 'income' ? 'income' : kind === 'expense' ? 'expense' : 'expense';
  const postedDate =
    r.postedDate ?? (r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10));

  return {
    id: r.id,
    kind,
    type,
    amount: Math.abs(r.amount),
    signedAmount: r.signedAmount ?? (kind === 'expense' ? -Math.abs(r.amount) : Math.abs(r.amount)),
    postedDate,
    createdAt: r.createdAt ?? `${postedDate}T12:00:00.000Z`,
    nekoType: r.nekoType ?? (kind === 'transfer' ? 'Transferencia' : type === 'income' ? 'Ingreso' : 'Gasto'),
    description: r.description ?? r.note ?? '',
    account: r.account ?? '',
    categoryGroup: r.categoryGroup ?? '',
    category: r.category ?? 'Otros',
    notes: r.notes ?? r.note ?? '',
    source: r.source ?? 'manual',
  };
}
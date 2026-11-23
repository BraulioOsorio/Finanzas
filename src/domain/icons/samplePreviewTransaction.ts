import type { Transaction } from '../../types';

/** Movimiento ficticio para Ajustes: mismo dato, distinto icono según modo. */
export const SAMPLE_PREVIEW_TRANSACTION: Transaction = {
  id: 'preview-sample',
  kind: 'expense',
  type: 'expense',
  amount: 40_000,
  signedAmount: -40_000,
  postedDate: '2026-01-31',
  createdAt: '2026-01-31T12:00:00.000Z',
  nekoType: 'Pago',
  description: 'Netflix Premium',
  account: 'Bancolombia',
  categoryGroup: 'Hogar y Servicios',
  category: 'Suscripciones',
  notes: '',
  source: 'manual',
};
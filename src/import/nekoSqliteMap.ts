/** Etiquetas del export CSV de NEKO (transaction_type_id en SQLite local). */
export const NEKO_SQLITE_TYPE_LABEL: Record<number, string> = {
  1: 'Gasto',
  2: 'Pago',
  3: 'Ingreso',
  4: 'Transferencia',
  5: 'Pago de Tarjeta',
  6: 'Pago de Préstamo',
  7: 'Ingreso',
  8: 'Compra a meses',
  10: 'Transferencia',
  11: 'Transferencia',
};

/** Tipos que generan dos filas en el CSV (origen + destino). */
export const NEKO_SQLITE_DUAL_LEG = new Set([4, 5, 10, 11]);

/** account_type_id → kind Finanzas */
export const NEKO_ACCOUNT_TYPE_KIND: Record<
  number,
  import('../types').AccountKind
> = {
  1: 'cash',
  2: 'bank',
  3: 'savings',
  4: 'credit',
  5: 'loan',
  7: 'loan',
};

export function nekoPeriodToFrequency(
  periodTypeId: number,
  periodTypeDays: string,
): import('../types').ScheduleFrequency {
  if (periodTypeId === 2) {
    return 'weekly';
  }
  if (periodTypeId === 3) {
    return 'biweekly';
  }
  return 'monthly';
}
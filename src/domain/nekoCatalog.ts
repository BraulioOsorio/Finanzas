/**
 * Catálogo inferido del export Neko del usuario (no es código oficial de NEKO).
 * Sirve como plantilla hasta que personalicen cuentas y categorías en la app.
 */
export const NEKO_TRANSACTION_TYPES = [
  'Gasto',
  'Ingreso',
  'Pago',
  'Transferencia',
  'Pago de Tarjeta',
  'Reembolso',
  'Compra a meses',
  'Pago de Préstamo',
  'Pago de préstamo',
  'Fondos del préstamo',
] as const;

export type NekoTransactionType = (typeof NEKO_TRANSACTION_TYPES)[number];

/** Cuentas que aparecen con más frecuencia en tu historial Neko */
export const DEFAULT_ACCOUNTS = [
  'Bancolombia',
  'Efectivo',
  'Deudas',
  'RappiCard',
  'Nu',
  'Nu Credito',
  'RappiCuenta',
  'Davivienda',
  'Única Virtual',
  'American Express',
  'Ahorro',
  'Banco de Bogotá',
  'G-zero Davivienda',
  'Adicional',
  'Addi',
] as const;

/**
 * Jerarquía Grupo → Categoría (como en Neko). Editable en Ajustes → Categorías.
 */
export const DEFAULT_CATEGORY_TREE: Record<string, readonly string[]> = {
  'Comida y Bebida': ['Salidas'],
  'Estilo de Vida': ['Amor', 'Juegos', 'Educación', 'Yo', 'Regalos'],
  'Hogar y Servicios': ['Suscripciones', 'Casa', 'Servicios'],
  Transporte: ['Moto'],
  'Otros Ingresos': ['Otros'],
  'Ingreso Principal': ['Salario', 'Bonos y comisiones'],
  Extras: ['Otros gastos', 'Prestamos', 'Compras en Línea'],
  Deudas: ['Deudas'],
};

export const UNCATEGORIZED_GROUP = 'Sin grupo';

export type CategoryTreeMap = Record<string, string[]>;

export function categoriesForGroup(group: string, tree: CategoryTreeMap): string[] {
  if (!group || group === UNCATEGORIZED_GROUP) {
    return [];
  }
  const list = tree[group];
  return list ? [...list] : [];
}

export function allCategoryGroups(tree: CategoryTreeMap): string[] {
  return [...Object.keys(tree), UNCATEGORIZED_GROUP];
}
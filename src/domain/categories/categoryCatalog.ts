import type { BrandDef } from '../brands/types';

export type CategoryIconDef = BrandDef;

const C = (def: Omit<CategoryIconDef, 'keywords'> & { keywords?: string[] }): CategoryIconDef => ({
  keywords: [],
  ...def,
});

/** Iconos por categoría Neko (grupo + categoría), no por descripción del comercio. */
export const CATEGORY_ICONS: Record<string, CategoryIconDef> = {
  'comida y bebida::salidas': C({
    id: 'cat-comida-salidas',
    label: 'Comida y Bebida',
    shortLabel: '🍽',
    color: '#f97316',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/McDonald%27s_Golden_Arches.svg/128px-McDonald%27s_Golden_Arches.svg.png',
  }),

  'hogar y servicios::suscripciones': C({
    id: 'cat-suscripciones',
    label: 'Suscripciones',
    shortLabel: '▶',
    color: '#e50914',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/128px-Netflix_2015_logo.svg.png',
  }),
  'hogar y servicios::casa': C({
    id: 'cat-casa',
    label: 'Casa',
    shortLabel: '🏠',
    color: '#0ea5e9',
  }),
  'hogar y servicios::servicios': C({
    id: 'cat-servicios',
    label: 'Servicios',
    shortLabel: 'Wi',
    color: '#019df4',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Claro.svg/128px-Claro.svg.png',
  }),

  'transporte::moto': C({
    id: 'cat-moto',
    label: 'Moto',
    shortLabel: '🏍',
    color: '#78716c',
  }),
  'transporte::transporte': C({
    id: 'cat-transporte',
    label: 'Transporte',
    shortLabel: '🚗',
    color: '#1f2937',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Uber_logo_2018.png/128px-Uber_logo_2018.png',
  }),

  'estilo de vida::amor': C({
    id: 'cat-amor',
    label: 'Amor',
    shortLabel: '♥',
    color: '#ec4899',
  }),
  'estilo de vida::juegos': C({
    id: 'cat-juegos',
    label: 'Juegos',
    shortLabel: 'Gm',
    color: '#003087',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/128px-Nintendo.svg.png',
  }),
  'estilo de vida::educacion': C({
    id: 'cat-educacion',
    label: 'Educación',
    shortLabel: '🎓',
    color: '#2563eb',
  }),
  'estilo de vida::yo': C({
    id: 'cat-yo',
    label: 'Yo',
    shortLabel: 'Yo',
    color: '#8b5cf6',
  }),
  'estilo de vida::regalos': C({
    id: 'cat-regalos',
    label: 'Regalos',
    shortLabel: '🎁',
    color: '#db2777',
  }),

  'ingreso principal::salario': C({
    id: 'cat-salario',
    label: 'Salario',
    shortLabel: '💼',
    color: '#16a34a',
  }),
  'ingreso principal::bonos y comisiones': C({
    id: 'cat-bonos',
    label: 'Bonos',
    shortLabel: '★',
    color: '#22c55e',
  }),

  'otros ingresos::otros': C({
    id: 'cat-ingreso-otros',
    label: 'Otros ingresos',
    shortLabel: '+',
    color: '#10b981',
  }),
  'otros ingresos::prestamos': C({
    id: 'cat-prestamos-ingreso',
    label: 'Préstamos (ingreso)',
    shortLabel: 'Pr',
    color: '#14b8a6',
  }),
  'otros ingresos::extras': C({
    id: 'cat-ingreso-extras',
    label: 'Extras',
    shortLabel: 'Ex',
    color: '#059669',
  }),

  'extras::otros gastos': C({
    id: 'cat-otros-gastos',
    label: 'Otros gastos',
    shortLabel: '…',
    color: '#64748b',
  }),
  'extras::prestamos': C({
    id: 'cat-prestamos',
    label: 'Préstamos',
    shortLabel: 'Pr',
    color: '#f97316',
  }),
  'extras::compras en linea': C({
    id: 'cat-compras-online',
    label: 'Compras en línea',
    shortLabel: 'ML',
    color: '#ffe600',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/MercadoLibre_logo.svg/128px-MercadoLibre_logo.svg.png',
  }),
  'extras::regalos': C({
    id: 'cat-regalos-extra',
    label: 'Regalos',
    shortLabel: '🎁',
    color: '#db2777',
  }),

  'deudas::deudas': C({
    id: 'cat-deudas',
    label: 'Deudas',
    shortLabel: 'De',
    color: '#f97316',
  }),
};

/** Grupo sin categoría fina */
export const GROUP_ICONS: Record<string, CategoryIconDef> = {
  'comida y bebida': CATEGORY_ICONS['comida y bebida::salidas'],
  'hogar y servicios': CATEGORY_ICONS['hogar y servicios::casa'],
  'transporte': CATEGORY_ICONS['transporte::moto'],
  'estilo de vida': CATEGORY_ICONS['estilo de vida::yo'],
  'ingreso principal': CATEGORY_ICONS['ingreso principal::salario'],
  'otros ingresos': CATEGORY_ICONS['otros ingresos::otros'],
  extras: CATEGORY_ICONS['extras::otros gastos'],
  deudas: CATEGORY_ICONS['deudas::deudas'],
};

/** Solo categoría (export Neko sin grupo) */
export const SINGLE_CATEGORY_ICONS: Record<string, CategoryIconDef> = {
  transferencia: C({
    id: 'neko-transferencia',
    label: 'Transferencia',
    shortLabel: '↔',
    color: '#94a3b8',
  }),
  'pago de tarjeta': C({
    id: 'neko-pago-tarjeta',
    label: 'Pago de tarjeta',
    shortLabel: 'Cc',
    color: '#eb001b',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/128px-Mastercard-logo.svg.png',
  }),
  yo: CATEGORY_ICONS['estilo de vida::yo'],
  gasto: C({
    id: 'neko-gasto',
    label: 'Gasto',
    shortLabel: '−',
    color: '#ef4444',
  }),
  pago: C({
    id: 'neko-pago',
    label: 'Pago',
    shortLabel: '$',
    color: '#3b82f6',
  }),
  ingreso: CATEGORY_ICONS['otros ingresos::otros'],
  reembolso: C({
    id: 'neko-reembolso',
    label: 'Reembolso',
    shortLabel: '↩',
    color: '#22c55e',
  }),
  'compra a meses': C({
    id: 'neko-cuotas',
    label: 'Compra a meses',
    shortLabel: '12',
    color: '#6366f1',
  }),
  'pago de prestamo': C({
    id: 'neko-pago-prestamo',
    label: 'Pago de préstamo',
    shortLabel: 'Pr',
    color: '#0d9488',
  }),
  'pago de préstamo': C({
    id: 'neko-pago-prestamo',
    label: 'Pago de préstamo',
    shortLabel: 'Pr',
    color: '#0d9488',
  }),
  'fondos del prestamo': C({
    id: 'neko-fondos-prestamo',
    label: 'Fondos del préstamo',
    shortLabel: 'Fp',
    color: '#06b6d4',
  }),
  'fondos del préstamo': C({
    id: 'neko-fondos-prestamo',
    label: 'Fondos del préstamo',
    shortLabel: 'Fp',
    color: '#06b6d4',
  }),
};

export const DEFAULT_CATEGORY_ICON: CategoryIconDef = C({
  id: 'cat-generic',
  label: 'Sin categoría',
  shortLabel: '•',
  color: '#64748b',
});

export const KIND_CATEGORY_ICON: Record<string, CategoryIconDef> = {
  income: CATEGORY_ICONS['otros ingresos::otros'],
  expense: CATEGORY_ICONS['extras::otros gastos'],
  transfer: SINGLE_CATEGORY_ICONS.transferencia,
};
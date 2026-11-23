import type { AccountKind } from '../../types';

const KIND_RULES: { kind: AccountKind; patterns: RegExp[] }[] = [
  { kind: 'cash', patterns: [/efectivo/i, /cash/i] },
  { kind: 'savings', patterns: [/ahorro/i, /alcancia/i] },
  {
    kind: 'credit',
    patterns: [
      /credito/i,
      /crédito/i,
      /tarjeta/i,
      /rappicard/i,
      /amex/i,
      /american express/i,
      /deudas/i,
      /addi/i,
      /única virtual/i,
      /unica virtual/i,
    ],
  },
  { kind: 'loan', patterns: [/préstamo/i, /prestamo/i, /prestamos/i] },
  {
    kind: 'fintech',
    patterns: [/nequi/i, /rappicuenta/i, /nu\b/i, /lulo/i, /daviplata/i, /bold/i],
  },
  { kind: 'bank', patterns: [/banco/i, /bancolombia/i, /davivienda/i, /bogotá/i, /bogota/i] },
];

export function inferAccountKind(accountName: string): AccountKind {
  const name = accountName.trim();
  for (const rule of KIND_RULES) {
    if (rule.patterns.some((p) => p.test(name))) {
      return rule.kind;
    }
  }
  return 'bank';
}

export function defaultLiquidForKind(kind: AccountKind): boolean {
  switch (kind) {
    case 'cash':
    case 'bank':
    case 'savings':
    case 'fintech':
      return true;
    case 'credit':
    case 'loan':
      return false;
    default:
      return true;
  }
}

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  bank: 'Banco / débito',
  cash: 'Efectivo',
  savings: 'Ahorro',
  credit: 'Tarjeta de crédito',
  loan: 'Préstamo / deuda',
  fintech: 'Fintech / billetera',
};
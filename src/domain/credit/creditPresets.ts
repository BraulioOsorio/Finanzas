import type { AccountDef } from '../../types';

/** Valores orientativos (EA y cortes frecuentes); el usuario debe ajustarlos a su extracto real. */
export type CreditPreset = Pick<
  AccountDef,
  | 'statementCloseDay'
  | 'paymentDueDay'
  | 'paymentDueOffsetDays'
  | 'interestRateEA'
  | 'installmentInterestEA'
  | 'minimumPaymentPercent'
>;

const PRESETS: { match: RegExp; preset: CreditPreset; label: string }[] = [
  {
    match: /rappi\s*card/i,
    label: 'RappiCard',
    preset: {
      statementCloseDay: 25,
      paymentDueDay: 10,
      paymentDueOffsetDays: 16,
      interestRateEA: 29.9,
      installmentInterestEA: 0,
      minimumPaymentPercent: 15,
    },
  },
  {
    match: /^(nu|nubank)$/i,
    label: 'Nu',
    preset: {
      statementCloseDay: 15,
      paymentDueDay: 5,
      paymentDueOffsetDays: 18,
      interestRateEA: 24.9,
      installmentInterestEA: 0,
      minimumPaymentPercent: 10,
    },
  },
  {
    match: /nu\s*credito|nu\s*crédito/i,
    label: 'Nu Crédito',
    preset: {
      statementCloseDay: 15,
      paymentDueDay: 5,
      paymentDueOffsetDays: 18,
      interestRateEA: 24.9,
      installmentInterestEA: 0,
      minimumPaymentPercent: 10,
    },
  },
  {
    match: /bancolombia/i,
    label: 'Bancolombia',
    preset: {
      statementCloseDay: 15,
      paymentDueDay: 5,
      paymentDueOffsetDays: 20,
      interestRateEA: 24.7,
      installmentInterestEA: 22.8,
      minimumPaymentPercent: 10,
    },
  },
  {
    match: /davivienda/i,
    label: 'Davivienda',
    preset: {
      statementCloseDay: 10,
      paymentDueDay: 5,
      paymentDueOffsetDays: 22,
      interestRateEA: 25.4,
      installmentInterestEA: 23.5,
      minimumPaymentPercent: 10,
    },
  },
  {
    match: /bogot[aá]/i,
    label: 'Banco de Bogotá',
    preset: {
      statementCloseDay: 20,
      paymentDueDay: 10,
      paymentDueOffsetDays: 18,
      interestRateEA: 25.9,
      installmentInterestEA: 0,
      minimumPaymentPercent: 10,
    },
  },
  {
    match: /american\s*express|amex/i,
    label: 'American Express',
    preset: {
      statementCloseDay: 18,
      paymentDueDay: 8,
      paymentDueOffsetDays: 18,
      interestRateEA: 26.5,
      installmentInterestEA: 0,
      minimumPaymentPercent: 10,
    },
  },
  {
    match: /addi/i,
    label: 'Addi',
    preset: {
      statementCloseDay: 28,
      paymentDueDay: 10,
      paymentDueOffsetDays: 10,
      interestRateEA: 0,
      installmentInterestEA: 24,
      minimumPaymentPercent: 100,
    },
  },
];

export function matchCreditPreset(accountName: string): { preset: CreditPreset; label: string } | null {
  const n = accountName.trim();
  if (!n) {
    return null;
  }
  for (const row of PRESETS) {
    if (row.match.test(n)) {
      return { preset: row.preset, label: row.label };
    }
  }
  return null;
}

/** Rellena solo campos vacíos (no pisa configuración del usuario). */
export function applyCreditPresetToDraft(
  name: string,
  draft: Partial<AccountDef>,
): Partial<AccountDef> {
  const hit = matchCreditPreset(name);
  if (!hit) {
    return draft;
  }
  const p = hit.preset;
  const out = { ...draft };
  if (out.statementCloseDay == null && p.statementCloseDay != null) {
    out.statementCloseDay = p.statementCloseDay;
  }
  if (out.paymentDueDay == null && p.paymentDueDay != null) {
    out.paymentDueDay = p.paymentDueDay;
  }
  if (out.paymentDueOffsetDays == null && p.paymentDueOffsetDays != null) {
    out.paymentDueOffsetDays = p.paymentDueOffsetDays;
  }
  if (out.interestRateEA == null && p.interestRateEA != null) {
    out.interestRateEA = p.interestRateEA;
  }
  if (out.installmentInterestEA == null && p.installmentInterestEA != null) {
    out.installmentInterestEA = p.installmentInterestEA;
  }
  if (out.minimumPaymentPercent == null && p.minimumPaymentPercent != null) {
    out.minimumPaymentPercent = p.minimumPaymentPercent;
  }
  return out;
}
/** Columnas opcionales Finanzas (después de Notes); el export Neko puro no las trae. */
export const FINANZAS_CSV_OPTIONAL_COLUMNS = [
  'Installment Meta',
  'Purchase Total',
  'Installment Current',
] as const;

export type InstallmentMetaParsed = {
  installmentCurrent?: number;
  installmentCount?: number;
  purchaseTotal?: number;
};

export function parseInstallmentMetaCell(raw: string): Pick<InstallmentMetaParsed, 'installmentCurrent' | 'installmentCount'> {
  const blob = raw.trim();
  if (!blob) {
    return {};
  }
  const frac = blob.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) {
    return {
      installmentCurrent: Number(frac[1]),
      installmentCount: Number(frac[2]),
    };
  }
  const de = blob.match(/(\d+)\s*(?:de|\/)\s*(\d+)/i);
  if (de) {
    return {
      installmentCurrent: Number(de[1]),
      installmentCount: Number(de[2]),
    };
  }
  const solo = blob.match(/^(\d+)\s*cuotas?$/i);
  if (solo) {
    return { installmentCount: Number(solo[1]) };
  }
  const n = Number(blob.replace(/[^\d]/g, ''));
  if (n >= 2 && n <= 72) {
    return { installmentCount: n };
  }
  return {};
}
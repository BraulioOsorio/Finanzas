export type BrandDef = {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  /** Palabras clave en descripción, cuenta, categoría o nota (minúsculas) */
  keywords: string[];
  /** Logo remoto (Wikimedia u oficial); si falla, se usa iniciales */
  logoUrl?: string;
};
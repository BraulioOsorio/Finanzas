import { BRANDS, DEFAULT_BRAND } from './brandCatalog';
import type { BrandDef } from './types';
import type { ScheduledPayment, Transaction } from '../../types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function resolveBrandFromText(...parts: string[]): BrandDef {
  const haystack = normalize(parts.filter(Boolean).join(' '));
  if (!haystack) {
    return DEFAULT_BRAND;
  }

  let best: { brand: BrandDef; score: number } | null = null;

  for (const brand of BRANDS) {
    for (const keyword of brand.keywords) {
      const key = normalize(keyword);
      if (!key) {
        continue;
      }
      if (haystack.includes(key)) {
        const score = key.length;
        if (!best || score > best.score) {
          best = { brand, score };
        }
      }
    }
  }

  return best?.brand ?? DEFAULT_BRAND;
}

/** Cuentas Neko → marca (cuando la descripción no dice el comercio). */
const ACCOUNT_BRAND_HINTS: Record<string, string> = {
  rappicard: 'rappi',
  rappicuenta: 'rappi',
  'nu credito': 'nu',
  'g-zero davivienda': 'davivienda',
  'única virtual': 'unica',
  'unica virtual': 'unica',
  addi: 'addi',
  deudas: 'deudas',
  ahorro: 'ahorro',
  efectivo: 'efectivo',
};

function normalizeAccountKey(account: string): string {
  return normalize(account);
}

export function resolveBrandForTransaction(t: Transaction): BrandDef {
  const merchant = resolveBrandFromText(
    t.description,
    t.category,
    t.categoryGroup,
    t.nekoType,
    t.notes,
  );
  if (merchant.id !== 'generic') {
    return merchant;
  }

  const accountKey = normalizeAccountKey(t.account);
  const hintedId = ACCOUNT_BRAND_HINTS[accountKey];
  if (hintedId) {
    const hinted = BRANDS.find((b) => b.id === hintedId);
    if (hinted) {
      return hinted;
    }
  }

  const fromAccount = resolveBrandFromText(t.account);
  return fromAccount.id !== 'generic' ? fromAccount : DEFAULT_BRAND;
}

export function resolveBrandForScheduled(p: ScheduledPayment): BrandDef {
  const fromTitle = resolveBrandFromText(p.title, p.category, p.categoryGroup, p.nekoType);
  if (fromTitle.id !== 'generic') {
    return fromTitle;
  }
  const accountKey = normalizeAccountKey(p.account);
  const hintedId = ACCOUNT_BRAND_HINTS[accountKey];
  if (hintedId) {
    const hinted = BRANDS.find((b) => b.id === hintedId);
    if (hinted) {
      return hinted;
    }
  }
  const fromAccount = resolveBrandFromText(p.account);
  return fromAccount.id !== 'generic' ? fromAccount : DEFAULT_BRAND;
}
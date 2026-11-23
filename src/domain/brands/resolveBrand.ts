import { BRANDS, DEFAULT_BRAND } from './brandCatalog';
import type { BrandDef } from './types';
import type { Transaction } from '../../types';

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

export function resolveBrandForTransaction(t: Transaction): BrandDef {
  return resolveBrandFromText(
    t.description,
    t.account,
    t.category,
    t.categoryGroup,
    t.nekoType,
    t.notes,
  );
}
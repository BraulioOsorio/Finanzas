import type { ScheduledPayment, Transaction } from '../../types';
import type { CategoryIconDef } from './categoryCatalog';
import {
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
  GROUP_ICONS,
  KIND_CATEGORY_ICON,
  SINGLE_CATEGORY_ICONS,
} from './categoryCatalog';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function pairKey(group: string, category: string): string {
  return `${normalize(group)}::${normalize(category)}`;
}

function lookupByGroupCategory(group: string, category: string): CategoryIconDef | null {
  const g = normalize(group);
  const c = normalize(category);

  if (g && c) {
    const paired = CATEGORY_ICONS[`${g}::${c}`];
    if (paired) {
      return paired;
    }
  }

  if (c) {
    const solo = SINGLE_CATEGORY_ICONS[c];
    if (solo) {
      return solo;
    }
  }

  if (g) {
    const groupIcon = GROUP_ICONS[g];
    if (groupIcon) {
      return groupIcon;
    }
  }

  return null;
}

/** Etiqueta visible estilo NEKO: Grupo › Categoría */
export function categoryDisplayLabel(
  categoryGroup: string,
  category: string,
  nekoType?: string,
): string {
  const parts = [categoryGroup, category].map((p) => p?.trim()).filter(Boolean);
  if (parts.length) {
    return parts.join(' › ');
  }
  return nekoType?.trim() || 'Sin categoría';
}

export function resolveCategoryIconForTransaction(t: Transaction): CategoryIconDef {
  const fromPair = lookupByGroupCategory(t.categoryGroup, t.category);
  if (fromPair) {
    return fromPair;
  }

  const fromType = SINGLE_CATEGORY_ICONS[normalize(t.nekoType)];
  if (fromType) {
    return fromType;
  }

  return KIND_CATEGORY_ICON[t.kind] ?? DEFAULT_CATEGORY_ICON;
}

export function resolveCategoryIconForScheduled(p: ScheduledPayment): CategoryIconDef {
  const fromPair = lookupByGroupCategory(p.categoryGroup, p.category);
  if (fromPair) {
    return fromPair;
  }
  const fromType = SINGLE_CATEGORY_ICONS[normalize(p.nekoType)];
  if (fromType) {
    return fromType;
  }
  return p.kind === 'income'
    ? KIND_CATEGORY_ICON.income
    : KIND_CATEGORY_ICON.expense ?? DEFAULT_CATEGORY_ICON;
}
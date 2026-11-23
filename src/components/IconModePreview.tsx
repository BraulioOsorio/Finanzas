import { StyleSheet, Text, View } from 'react-native';

import { BrandIcon } from './BrandIcon';
import { categoryDisplayLabel } from '../domain/categories/resolveCategoryIcon';
import { SAMPLE_PREVIEW_TRANSACTION } from '../domain/icons/samplePreviewTransaction';
import { resolveDisplayIconForTransaction } from '../domain/icons/resolveDisplayIcon';
import { colors } from '../theme';
import type { IconDisplayMode } from '../types';
import { formatCurrency } from '../utils/format';

const MODE_LABELS: Record<IconDisplayMode, string> = {
  category: 'Categoría',
  description: 'Comercio',
  account: 'Banco',
};

type Props = {
  draftMode: IconDisplayMode;
  savedMode: IconDisplayMode;
};

export function IconModePreview({ draftMode, savedMode }: Props) {
  const item = SAMPLE_PREVIEW_TRANSACTION;
  const title = item.description;
  const categoryLine = categoryDisplayLabel(item.categoryGroup, item.category, item.nekoType);
  const dirty = draftMode !== savedMode;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Vista previa</Text>
      <Text style={styles.hint}>
        Mismo movimiento de ejemplo. El icono grande es el modo que tienes seleccionado
        {dirty ? ' (sin guardar aún)' : ''}.
      </Text>

      <View style={[styles.mainRow, dirty && styles.mainRowDraft]}>
        <BrandIcon brand={resolveDisplayIconForTransaction(item, draftMode)} size={48} />
        <View style={styles.leading}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={2}>
            {categoryLine} · {item.account} · 31 ene
          </Text>
        </View>
        <Text style={styles.amount}>−{formatCurrency(item.amount)}</Text>
      </View>

      <Text style={styles.compareHeading}>Comparar los tres modos</Text>
      <View style={styles.compareCol}>
        {(['category', 'description', 'account'] as const).map((mode) => {
          const selected = draftMode === mode;
          const isSaved = savedMode === mode && !dirty;
          return (
            <View
              key={mode}
              style={[styles.compareRow, selected && styles.compareRowSelected]}
            >
              <BrandIcon brand={resolveDisplayIconForTransaction(item, mode)} size={36} />
              <View style={styles.compareText}>
                <Text style={[styles.compareLabel, selected && styles.compareLabelActive]}>
                  {MODE_LABELS[mode]}
                  {isSaved ? ' · actual' : selected ? ' · seleccionado' : ''}
                </Text>
                <Text style={styles.compareSub}>
                  {mode === 'category' && 'Suscripciones (Neko)'}
                  {mode === 'description' && 'Netflix'}
                  {mode === 'account' && 'Bancolombia'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  heading: { color: colors.text, fontSize: 16, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainRowDraft: { borderColor: colors.accent },
  leading: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  amount: { color: colors.expense, fontSize: 15, fontWeight: '700' },
  compareHeading: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compareCol: { gap: 8 },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compareRowSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  compareText: { flex: 1 },
  compareLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  compareLabelActive: { color: colors.accent },
  compareSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
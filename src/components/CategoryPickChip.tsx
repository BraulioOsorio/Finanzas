import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandIcon } from './BrandIcon';
import { resolveCategoryIconForTransaction } from '../domain/categories/resolveCategoryIcon';
import { colors } from '../theme';
import type { TransactionKind } from '../types';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
  categoryGroup?: string;
  category?: string;
  kind?: TransactionKind;
};

export function CategoryPickChip({
  label,
  active,
  onPress,
  categoryGroup = '',
  category = '',
  kind = 'expense',
}: Props) {
  const icon = resolveCategoryIconForTransaction({
    id: 'chip',
    kind,
    type: kind === 'income' ? 'income' : 'expense',
    amount: 0,
    signedAmount: 0,
    postedDate: '2000-01-01',
    createdAt: '2000-01-01T00:00:00.000Z',
    nekoType: 'Gasto',
    description: '',
    account: '',
    categoryGroup,
    category: category || label,
    notes: '',
    source: 'manual',
  });

  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <BrandIcon brand={icon} size={28} />
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { color: colors.textMuted, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  textActive: { color: colors.white },
});
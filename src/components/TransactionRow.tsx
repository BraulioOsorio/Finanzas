import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { Transaction } from '../types';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  item: Transaction;
  onDelete?: () => void;
};

export function TransactionRow({ item, onDelete }: Props) {
  const isIncome = item.type === 'income';
  const sign = isIncome ? '+' : '−';

  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.note ? item.note : formatShortDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.trailing}>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {sign}
          {formatCurrency(item.amount)}
        </Text>
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
            <Text style={styles.delete}>Eliminar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  leading: { flex: 1 },
  category: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  trailing: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '700' },
  income: { color: colors.income },
  expense: { color: colors.expense },
  delete: { color: colors.textMuted, fontSize: 12 },
});
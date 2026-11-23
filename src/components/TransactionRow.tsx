import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { Transaction } from '../types';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  item: Transaction;
  onDelete?: () => void;
};

export function TransactionRow({ item, onDelete }: Props) {
  const isTransfer = item.kind === 'transfer';
  const isIncome = item.kind === 'income';
  const sign = isTransfer ? (item.signedAmount >= 0 ? '+' : '−') : isIncome ? '+' : '−';
  const displayAmount = isTransfer ? Math.abs(item.signedAmount) : item.amount;

  const title = item.description || item.category || item.nekoType;
  const metaParts = [item.account, item.nekoType, item.categoryGroup]
    .map((p) => p.trim())
    .filter(Boolean);
  const metaExtra = item.notes ? item.notes.split('\n')[0] : formatShortDate(item.postedDate);

  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <Text style={styles.category} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {metaParts.length ? `${metaParts.join(' · ')} · ${metaExtra}` : metaExtra}
        </Text>
      </View>
      <View style={styles.trailing}>
        <Text
          style={[
            styles.amount,
            isTransfer ? styles.transfer : isIncome ? styles.income : styles.expense,
          ]}
        >
          {sign}
          {formatCurrency(displayAmount)}
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
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  trailing: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '700' },
  income: { color: colors.income },
  expense: { color: colors.expense },
  transfer: { color: '#94a3b8' },
  delete: { color: colors.textMuted, fontSize: 12 },
});
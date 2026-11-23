import { StyleSheet, Text, View } from 'react-native';

import type { AccountBalance } from '../domain/summaries';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

type Props = {
  item: AccountBalance;
};

export function AccountBalanceRow({ item }: Props) {
  const positive = item.balance >= 0;
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <Text style={styles.name} numberOfLines={1}>
          {item.account}
        </Text>
        <Text style={styles.meta}>{item.movementCount} movimientos</Text>
      </View>
      <Text style={[styles.amount, positive ? styles.positive : styles.negative]}>
        {formatCurrency(item.balance)}
      </Text>
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
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
  positive: { color: colors.income },
  negative: { color: colors.expense },
});
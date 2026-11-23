import { StyleSheet, Text, View } from 'react-native';

import type { UpcomingItem } from '../domain/upcoming';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  items: UpcomingItem[];
};

export function UpcomingList({ items }: Props) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Próximos 14 días</Text>
      {items.slice(0, 6).map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.lead}>
            <Text style={styles.date}>{formatShortDate(item.date)}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta}>
              {item.account}
              {item.kind === 'card_due' ? ' · recordatorio' : ''}
            </Text>
          </View>
          {item.signedAmount !== 0 ? (
            <Text
              style={[
                styles.amount,
                item.signedAmount > 0 ? styles.income : styles.expense,
              ]}
            >
              {item.signedAmount > 0 ? '+' : '−'}
              {formatCurrency(Math.abs(item.signedAmount))}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lead: { flex: 1, gap: 2 },
  date: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 11 },
  amount: { fontSize: 13, fontWeight: '700' },
  income: { color: colors.income },
  expense: { color: colors.expense },
});
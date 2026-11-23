import { StyleSheet, Text, View } from 'react-native';

import type { OverdraftAlert } from '../domain/overdraftAlerts';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  items: OverdraftAlert[];
  title?: string;
};

export function OverdraftAlertList({ items, title = 'Alertas de saldo' }: Props) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {items.slice(0, 4).map((a) => (
        <View key={`${a.account}-${a.date}`} style={styles.row}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {a.account}
          </Text>
          <Text style={styles.rowMeta}>
            {formatShortDate(a.date)} · podría quedar en {formatCurrency(a.projectedBalance)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.expenseMuted,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.expense,
    gap: 8,
  },
  title: { color: colors.expense, fontSize: 13, fontWeight: '800' },
  row: { gap: 2 },
  rowTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  rowMeta: { color: colors.textMuted, fontSize: 11 },
});
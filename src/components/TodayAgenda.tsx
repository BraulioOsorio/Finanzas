import { StyleSheet, Text, View } from 'react-native';

import type { TodayItem } from '../domain/today';
import type { UpcomingItem } from '../domain/upcoming';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

type Props = {
  items: TodayItem[];
  tomorrow: UpcomingItem[];
};

export function TodayAgenda({ items, tomorrow }: Props) {
  if (!items.length && !tomorrow.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Hoy</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>Sin movimientos registrados hoy.</Text>
      ) : (
        items.map((row, idx) =>
          row.kind === 'transaction' ? (
            <View key={`tx-${idx}`} style={styles.row}>
              <View style={styles.lead}>
                <Text style={styles.name}>{row.title}</Text>
                <Text style={styles.meta}>{row.account}</Text>
              </View>
              <Text
                style={[styles.amount, row.amount >= 0 ? styles.income : styles.expense]}
              >
                {row.amount >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(row.amount))}
              </Text>
            </View>
          ) : (
            <View key={row.item.id} style={[styles.row, styles.reminder]}>
              <Text style={styles.badge}>Recordatorio</Text>
              <Text style={styles.name}>{row.item.title}</Text>
              {row.item.subtitle ? <Text style={styles.meta}>{row.item.subtitle}</Text> : null}
            </View>
          ),
        )
      )}
      {tomorrow.length > 0 ? (
        <View style={styles.tomorrow}>
          <Text style={styles.tomorrowTitle}>Mañana</Text>
          {tomorrow.map((u) => (
            <Text key={u.id} style={styles.tomorrowLine} numberOfLines={2}>
              · {u.title}
              {u.signedAmount !== 0
                ? ` (${formatCurrency(Math.abs(u.signedAmount))})`
                : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  empty: { color: colors.textMuted, fontSize: 13 },
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
  reminder: { flexDirection: 'column', alignItems: 'flex-start' },
  lead: { flex: 1, gap: 2 },
  badge: { color: colors.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 11 },
  amount: { fontSize: 13, fontWeight: '700' },
  income: { color: colors.income },
  expense: { color: colors.expense },
  tomorrow: { marginTop: 8, gap: 4 },
  tomorrowTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  tomorrowLine: { color: colors.text, fontSize: 12, lineHeight: 17 },
});
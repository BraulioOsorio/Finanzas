import { StyleSheet, Text, View } from 'react-native';

import type { DebtBucketSummary } from '../domain/debtSummary';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

type Props = {
  items: DebtBucketSummary[];
  monthKey: string;
};

export function DebtSummaryList({ items, monthKey }: Props) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Deudas y préstamos</Text>
      <Text style={styles.lead}>Como el bucket «Deudas» en Neko: saldo y abonos del mes ({monthKey}).</Text>
      {items.map((d) => (
        <View key={d.account} style={styles.card}>
          <Text style={styles.name}>{d.account}</Text>
          <Text style={styles.owed}>Saldo: {formatCurrency(d.balance)}</Text>
          {d.paidThisMonth > 0 ? (
            <Text style={styles.paid}>Abonado este mes: {formatCurrency(d.paidThisMonth)}</Text>
          ) : (
            <Text style={styles.meta}>Sin pagos de préstamo registrados este mes</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  lead: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  owed: { color: colors.expense, fontSize: 14, fontWeight: '600' },
  paid: { color: colors.income, fontSize: 12 },
  meta: { color: colors.textMuted, fontSize: 12 },
});
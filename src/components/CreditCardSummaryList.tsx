import { StyleSheet, Text, View } from 'react-native';

import type { CreditCardSummary } from '../domain/accounts/creditSummary';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

type Props = {
  cards: CreditCardSummary[];
};

export function CreditCardSummaryList({ cards }: Props) {
  if (!cards.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tarjetas y crédito</Text>
      {cards.map((c) => (
        <View key={c.account} style={styles.card}>
          <Text style={styles.name}>{c.account}</Text>
          <Text style={styles.owed}>Debes: {formatCurrency(c.owed)}</Text>
          {c.creditLimit ? (
            <Text style={styles.meta}>
              Cupo {formatCurrency(c.creditLimit)} · Usado{' '}
              {Math.round((c.utilization ?? 0) * 100)}%
            </Text>
          ) : null}
          {c.statementCloseDay || c.paymentDueDay ? (
            <Text style={styles.meta}>
              {c.statementCloseDay ? `Corte día ${c.statementCloseDay}` : ''}
              {c.statementCloseDay && c.paymentDueDay ? ' · ' : ''}
              {c.paymentDueDay ? `Pago día ${c.paymentDueDay}` : ''}
            </Text>
          ) : null}
        </View>
      ))}
      <Text style={styles.hint}>No suman al «Disponible para gastar».</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
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
  meta: { color: colors.textMuted, fontSize: 12 },
  hint: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
});
import { StyleSheet, Text, View } from 'react-native';

import type { CreditCardSummary } from '../domain/accounts/creditSummary';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  cards: CreditCardSummary[];
};

export function CreditCardSummaryList({ cards }: Props) {
  if (!cards.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tarjetas y crédito (Colombia)</Text>
      <Text style={styles.lead}>
        Cortes, pago mínimo orientativo e interés rotativo (EA). Ajusta corte y tasas en Cuentas.
      </Text>
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
          {c.outlook ? (
            <View style={styles.outlook}>
              <Text style={styles.outlookLine}>
                Extracto al corte {formatShortDate(c.outlook.nextClose)}: ~
                {formatCurrency(c.outlook.estimatedStatement)}
              </Text>
              {c.outlook.nextDue ? (
                <>
                  <Text style={[styles.outlookLine, styles.payFull]}>
                    Sin intereses (paga extracto): ~{formatCurrency(c.outlook.payInFullToZeroInterest)}{' '}
                    antes del {formatShortDate(c.outlook.nextDue)}
                  </Text>
                  <Text style={styles.outlookLine}>
                    Mínimo orientativo: {formatCurrency(c.outlook.estimatedMinimum)} · deuda total{' '}
                    {formatCurrency(c.owed)}
                  </Text>
                </>
              ) : null}
              {c.outlook.estimatedInterestIfUnpaid > 0 ? (
                <Text style={styles.interest}>
                  Si dejas saldo rotativo: ~{formatCurrency(c.outlook.estimatedInterestIfUnpaid)} / mes
                  (EA {c.interestRateEA ?? '—'}%)
                </Text>
              ) : null}
              {c.outlook.installmentChargesInPeriod > 0 ? (
                <Text style={styles.meta}>
                  Cuotas en este corte: {formatCurrency(c.outlook.installmentChargesInPeriod)}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.meta}>
              {c.statementCloseDay ? `Corte día ${c.statementCloseDay}` : 'Sin día de corte'}
              {c.paymentDueDay ? ` · Pago día ${c.paymentDueDay}` : ''}
            </Text>
          )}
        </View>
      ))}
      <Text style={styles.hint}>No suman al «Disponible para gastar».</Text>
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
  meta: { color: colors.textMuted, fontSize: 12 },
  outlook: { marginTop: 6, gap: 4 },
  outlookLine: { color: colors.text, fontSize: 12, lineHeight: 17 },
  payFull: { color: colors.income, fontWeight: '700' },
  interest: { color: colors.expense, fontSize: 11, fontStyle: 'italic' },
  hint: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
});
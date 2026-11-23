import { StyleSheet, Text, View } from 'react-native';

import type { LoanAmortizationPlan } from '../domain/debts/amortization';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  plan: LoanAmortizationPlan;
};

export function LoanAmortizationBlock({ plan }: Props) {
  if (!plan.rows.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tabla de amortización</Text>
      {plan.projectedPayoffMonth ? (
        <Text style={styles.payoff}>
          Libre de deuda (estimado): {plan.projectedPayoffMonth.replace('-', '/')}
        </Text>
      ) : null}
      <Text style={styles.note}>{plan.note}</Text>
      {plan.rows.slice(0, 8).map((row) => (
        <View key={`${row.index}-${row.date ?? 'x'}`} style={styles.row}>
          <Text style={[styles.rowIdx, !row.actual && styles.projected]}>
            {row.index}. {row.actual ? formatShortDate(row.date!) : `~${formatShortDate(row.date!)}`}
          </Text>
          <Text style={styles.rowPay}>{formatCurrency(row.payment)}</Text>
          <Text style={styles.rowBal}>Saldo {formatCurrency(row.balanceAfter)}</Text>
        </View>
      ))}
      {plan.rows.length > 8 ? (
        <Text style={styles.more}>… {plan.rows.length - 8} filas más</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  title: { color: colors.text, fontSize: 13, fontWeight: '800' },
  payoff: { color: colors.income, fontSize: 12, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  rowIdx: { color: colors.text, fontSize: 11, flex: 1, minWidth: 120 },
  projected: { fontStyle: 'italic', color: colors.textMuted },
  rowPay: { color: colors.expense, fontSize: 11, fontWeight: '700' },
  rowBal: { color: colors.textMuted, fontSize: 11 },
  more: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
});
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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

  const showInterest = plan.rows.some((r) => r.interest > 0);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tabla de amortización</Text>
      {plan.projectedPayoffMonth ? (
        <Text style={styles.payoff}>
          Libre de deuda (estimado): {plan.projectedPayoffMonth.replace('-', '/')}
        </Text>
      ) : null}
      <Text style={styles.note}>{plan.note}</Text>
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        {plan.rows.map((row) => (
          <View key={`${row.index}-${row.date ?? 'x'}`} style={styles.row}>
            <Text style={[styles.rowIdx, !row.actual && styles.projected]}>
              {row.index}. {row.actual ? formatShortDate(row.date!) : `~${formatShortDate(row.date!)}`}
            </Text>
            <Text style={styles.rowPay}>{formatCurrency(row.payment)}</Text>
            {showInterest ? (
              <Text style={styles.rowInt}>
                Cap {formatCurrency(row.principal)} · Int {formatCurrency(row.interest)}
              </Text>
            ) : null}
            <Text style={styles.rowBal}>Saldo {formatCurrency(row.balanceAfter)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  title: { color: colors.text, fontSize: 13, fontWeight: '800' },
  payoff: { color: colors.income, fontSize: 12, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  scroll: { maxHeight: 260 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', paddingVertical: 4 },
  rowIdx: { color: colors.text, fontSize: 11, flex: 1, minWidth: 120 },
  projected: { fontStyle: 'italic', color: colors.textMuted },
  rowPay: { color: colors.expense, fontSize: 11, fontWeight: '700' },
  rowInt: { color: colors.textMuted, fontSize: 10, width: '100%' },
  rowBal: { color: colors.textMuted, fontSize: 11 },
});
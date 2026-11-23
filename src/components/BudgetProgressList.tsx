import { StyleSheet, Text, View } from 'react-native';

import type { BudgetProgress } from '../domain/budgets';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

type Props = {
  items: BudgetProgress[];
  monthKey?: string;
};

export function BudgetProgressList({ items, monthKey }: Props) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        Presupuesto{monthKey ? ` (${monthKey})` : ' del mes'}
      </Text>
      {items.map((p) => {
        const over = p.ratio > 1;
        const warn = p.ratio > 0.85;
        const fill = Math.min(1, p.ratio);
        return (
          <View key={p.budget.id} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.label} numberOfLines={1}>
                {p.label}
              </Text>
              <Text style={[styles.amount, over && styles.amountOver]}>
                {formatCurrency(p.spent)} / {formatCurrency(p.limit)}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${fill * 100}%` },
                  warn && !over && styles.fillWarn,
                  over && styles.fillOver,
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 4 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  row: { gap: 6 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', flex: 1 },
  amount: { color: colors.text, fontSize: 12, fontWeight: '700' },
  amountOver: { color: colors.expense },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  fillWarn: { backgroundColor: '#f59e0b' },
  fillOver: { backgroundColor: colors.expense },
});
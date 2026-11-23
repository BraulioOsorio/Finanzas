import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeToSpendHorizon, SafeToSpendSnapshot } from '../domain/safeToSpend';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

const HORIZONS: SafeToSpendHorizon[] = ['today', 'month_end', 'days_14'];
const LABELS: Record<SafeToSpendHorizon, string> = {
  today: 'Hoy',
  month_end: 'Fin de mes',
  days_14: '14 días',
};

type Props = {
  snapshot: SafeToSpendSnapshot;
  horizon: SafeToSpendHorizon;
  onHorizon: (h: SafeToSpendHorizon) => void;
  loading?: boolean;
};

export function SafeToSpendCard({ snapshot, horizon, onHorizon, loading }: Props) {
  const low = snapshot.safeToSpend < 0;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.label}>Disponible para gastar</Text>
        <Text style={styles.meta}>hasta {formatShortDate(snapshot.throughDate)}</Text>
      </View>

      <View style={styles.chipRow}>
        {HORIZONS.map((h) => (
          <Pressable
            key={h}
            style={[styles.chip, horizon === h && styles.chipActive]}
            onPress={() => onHorizon(h)}
          >
            <Text style={[styles.chipText, horizon === h && styles.chipTextActive]}>{LABELS[h]}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Text style={styles.hint}>Calculando…</Text>
      ) : (
        <>
          <Text style={[styles.value, low && styles.valueLow]}>{formatCurrency(snapshot.safeToSpend)}</Text>
          <Text style={styles.hint}>
            Líquido ahora {formatCurrency(snapshot.liquidNow)}
            {snapshot.projectedOutflows > 0
              ? ` · comprometido −${formatCurrency(snapshot.projectedOutflows)}`
              : ''}
            {snapshot.projectedInflows > 0
              ? ` · entra +${formatCurrency(snapshot.projectedInflows)}`
              : ''}
          </Text>
          {snapshot.lines.length > 0 ? (
            <View style={styles.lines}>
              {snapshot.lines.slice(0, 4).map((line) => (
                <Text key={line.id} style={styles.line} numberOfLines={1}>
                  {formatShortDate(line.date)} · {line.title}
                  {line.signedAmount !== 0
                    ? ` · ${line.signedAmount > 0 ? '+' : '−'}${formatCurrency(Math.abs(line.signedAmount))}`
                    : ''}
                </Text>
              ))}
              {snapshot.lines.length > 4 ? (
                <Text style={styles.more}>+{snapshot.lines.length - 4} compromisos más</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.hint}>Sin pagos programados en este horizonte (revisa Plan y Cuentas).</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 11 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: colors.white },
  value: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  valueLow: { color: colors.expense },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  lines: { marginTop: 4, gap: 4 },
  line: { color: colors.text, fontSize: 11 },
  more: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
});
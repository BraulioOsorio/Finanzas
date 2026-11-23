import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { NekoTodaySummary } from '../../domain/nekoDisplay';
import { colors } from '../../theme';
import { formatCurrencyFull } from '../../utils/format';

type Props = {
  summary: NekoTodaySummary;
  /** Etiqueta de fecha corta (ej. «hoy» o «23 nov»). */
  dateLabel?: string;
};

/** Fila superior NEKO: Balance al… · Cuentas · Tarjetas de crédito. */
export function NekoBalanceStrip({ summary, dateLabel = 'hoy' }: Props) {
  const liquidWarn = summary.liquidTotal < 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.col}>
        <Text style={styles.label}>Balance al</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
      <View style={[styles.col, styles.colCenter]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Cuentas</Text>
          {liquidWarn ? <Ionicons name="warning" size={12} color={colors.warn} /> : null}
        </View>
        <Text style={[styles.liquid, liquidWarn && styles.warn]}>{formatCurrencyFull(summary.liquidTotal)}</Text>
      </View>
      <View style={[styles.col, styles.colEnd]}>
        <Text style={styles.label} numberOfLines={2}>
          Tarjetas de crédito
        </Text>
        <Text style={styles.credit}>{formatCurrencyFull(summary.creditTotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  col: { flex: 1, gap: 2 },
  colCenter: { alignItems: 'center' },
  colEnd: { alignItems: 'flex-end' },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', fontFamily: 'HankenGrotesk-Medium' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'HankenGrotesk-SemiBold' },
  liquid: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-SemiBold',
  },
  credit: {
    color: '#f5a05c',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-SemiBold',
    textAlign: 'right',
  },
  warn: { color: colors.warn },
});
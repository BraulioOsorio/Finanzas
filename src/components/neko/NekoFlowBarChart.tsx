import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';
import { formatCurrency } from '../../utils/format';

type Bar = { label: string; income: number; expense: number };

type Props = {
  title: string;
  bars: Bar[];
};

const CHART_HEIGHT = 132;
const BAR_WIDTH = 16;

function AnimatedColumn({
  height,
  color,
  delay,
}: {
  height: number;
  color: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: height,
      delay,
      speed: 12,
      bounciness: 4,
      useNativeDriver: false,
    }).start();
  }, [anim, delay, height]);

  return (
    <Animated.View
      style={{
        width: BAR_WIDTH,
        height: anim,
        backgroundColor: color,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
      }}
    />
  );
}

/** Gráfico de columnas dobles (ingreso arriba / gasto) estilo pestaña Análisis NEKO. */
export function NekoFlowBarChart({ title, bars }: Props) {
  const max = Math.max(1, ...bars.flatMap((b) => [b.income, b.expense]));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.legend}>
        <Text style={[styles.legendDot, { color: colors.income }]}>● Ingresos</Text>
        <Text style={[styles.legendDot, { color: colors.expense }]}>● Gastos</Text>
      </View>
      {bars.length === 0 ? (
        <Text style={styles.empty}>Sin movimientos en este período.</Text>
      ) : (
        <View style={styles.chartRow}>
          {bars.map((bar, index) => {
            const inH = (bar.income / max) * CHART_HEIGHT;
            const outH = (bar.expense / max) * CHART_HEIGHT;
            return (
              <View key={bar.label} style={styles.col}>
                <View style={[styles.colBars, { height: CHART_HEIGHT }]}>
                  <View style={styles.barPair}>
                    <AnimatedColumn height={inH} color={colors.income} delay={index * 55} />
                    <AnimatedColumn height={outH} color={colors.expense} delay={index * 55 + 30} />
                  </View>
                </View>
                <Text style={styles.month} numberOfLines={1}>
                  {bar.label}
                </Text>
                <View style={styles.totals}>
                  <Text style={styles.numIn} numberOfLines={1}>
                    {formatCurrency(bar.income)}
                  </Text>
                  <Text style={styles.numOut} numberOfLines={1}>
                    {formatCurrency(bar.expense)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', fontFamily: 'HankenGrotesk-SemiBold' },
  legend: { flexDirection: 'row', gap: 16 },
  legendDot: { fontSize: 11, fontWeight: '600', fontFamily: 'HankenGrotesk-Medium' },
  empty: { color: colors.textMuted, fontSize: 13, paddingVertical: 8 },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  col: { flex: 1, alignItems: 'center', minWidth: 44, gap: 4 },
  colBars: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  month: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
  },
  totals: { alignItems: 'center', gap: 1 },
  numIn: { color: colors.income, fontSize: 8, fontFamily: 'HankenGrotesk-Medium', maxWidth: 52 },
  numOut: { color: colors.expense, fontSize: 8, fontFamily: 'HankenGrotesk-Medium', maxWidth: 52 },
});
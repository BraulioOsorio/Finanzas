import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../../theme';
import { formatCurrencyFull } from '../../utils/format';

type Props = {
  /** Valor central «Restante». */
  value: number;
  /** 0–1: fracción del arco gastada (1 − safe/projected). */
  spentRatio: number;
  loading?: boolean;
};

const SIZE = 118;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Anillo estilo NEKO Inicio: arco proporcional al gasto (morado → naranja → verde).
 */
export function NekoSpendRing({ value, spentRatio, loading }: Props) {
  const r = Math.min(1, Math.max(0, spentRatio));
  const arcColor = r < 0.35 ? colors.accent : r < 0.7 ? colors.warn : colors.income;
  const spentLength = CIRCUMFERENCE * r;
  const checkColor = r < 0.85 ? colors.income : colors.warn;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        {r > 0.01 ? (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={arcColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${spentLength} ${CIRCUMFERENCE - spentLength}`}
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        ) : null}
      </Svg>
      <View style={styles.inner} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={20} color={checkColor} />
        <Text style={styles.value} adjustsFontSizeToFit numberOfLines={2}>
          {loading ? '…' : formatCurrencyFull(value)}
        </Text>
        <Text style={styles.label}>Restante</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 1,
    maxWidth: SIZE - 22,
  },
  value: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'HankenGrotesk-SemiBold',
    lineHeight: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    fontFamily: 'HankenGrotesk-Medium',
    letterSpacing: 0.2,
  },
});
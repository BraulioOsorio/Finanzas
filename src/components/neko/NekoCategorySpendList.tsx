import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { NekoEntrance } from './NekoEntrance';

export type CategorySpendRow = {
  key: string;
  label: string;
  group: string;
  category: string;
  spent: number;
  count: number;
};

type Props = {
  rows: CategorySpendRow[];
  maxSpent: number;
  onPressRow?: (row: CategorySpendRow) => void;
};

function AnimatedFill({ ratio, index }: { ratio: number; index: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }
    Animated.timing(width, {
      toValue: ratio * trackWidth,
      duration: 520,
      delay: 80 + index * 40,
      useNativeDriver: false,
    }).start();
  }, [index, ratio, trackWidth, width]);

  return (
    <View
      style={styles.barTrack}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.barFill, { width }]} />
    </View>
  );
}

export function NekoCategorySpendList({ rows, maxSpent, onPressRow }: Props) {
  if (!rows.length) {
    return <Text style={styles.empty}>Sin gastos en este período.</Text>;
  }

  const max = Math.max(1, maxSpent);

  return (
    <View style={styles.wrap}>
      {rows.map((row, index) => {
        const ratio = Math.min(1, row.spent / max);
        const content = (
          <>
            <View style={styles.head}>
              <Text style={styles.label} numberOfLines={1}>
                {row.label}
              </Text>
              <Text style={styles.amount}>{formatCurrency(row.spent)}</Text>
            </View>
            <AnimatedFill ratio={ratio} index={index} />
            <Text style={styles.meta}>{row.count} movimientos</Text>
          </>
        );
        return (
          <NekoEntrance key={row.key} index={index}>
            {onPressRow ? (
              <Pressable style={styles.row} onPress={() => onPressRow(row)}>
                {content}
              </Pressable>
            ) : (
              <View style={styles.row}>{content}</View>
            )}
          </NekoEntrance>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  empty: { color: colors.textMuted, fontSize: 13 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
  },
  amount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-SemiBold',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  meta: { color: colors.textMuted, fontSize: 11, fontFamily: 'HankenGrotesk-Regular' },
});
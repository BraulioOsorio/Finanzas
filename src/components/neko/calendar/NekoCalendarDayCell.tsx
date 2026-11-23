import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../theme';
import { formatCalendarCellAmount } from '../../../utils/format';

type Props = {
  dayNum: number;
  displayValue: number;
  viewMode: 'balance' | 'flow';
  isToday: boolean;
  isSelected: boolean;
  isOtherMonth: boolean;
  hasWarning: boolean;
  hasActivity: boolean;
  onPress: () => void;
};

/** Celda del mes — barra superior morada o naranja (alerta) como NEKO. */
export function NekoCalendarDayCell({
  dayNum,
  displayValue,
  viewMode,
  isToday,
  isSelected,
  isOtherMonth,
  hasWarning,
  hasActivity,
  onPress,
}: Props) {
  const flowPositive = displayValue >= 0;
  const showBar = !isSelected && !isOtherMonth && (hasWarning || hasActivity);
  const barColor = hasWarning ? colors.warn : colors.accent;

  return (
    <Pressable
      style={[
        styles.cell,
        isSelected && styles.cellSelected,
        showBar && !hasWarning && styles.cellWithBar,
        showBar && hasWarning && styles.cellWithWarn,
        isOtherMonth && styles.cellDim,
      ]}
      onPress={onPress}
    >
      {showBar ? (
        <View style={[styles.topBar, { backgroundColor: barColor }]}>
          {hasWarning ? (
            <Ionicons name="warning" size={9} color="#0b1118" style={styles.warnIcon} />
          ) : null}
          <Text style={styles.topBarDay}>{dayNum}</Text>
        </View>
      ) : (
        <View style={[styles.dayPlain, isToday && !isSelected && styles.dayToday]}>
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
              isOtherMonth && styles.dayTextDim,
            ]}
          >
            {dayNum}
          </Text>
        </View>
      )}

      {!isOtherMonth ? (
        <Text
          style={[
            styles.amount,
            viewMode === 'flow' && (flowPositive ? styles.flowPos : styles.flowNeg),
            isSelected && styles.amountSelected,
            hasWarning && !isSelected && styles.amountWarn,
          ]}
          numberOfLines={1}
        >
          {formatCalendarCellAmount(displayValue, viewMode)}
        </Text>
      ) : (
        <Text style={styles.amountDim}>{dayNum}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: `${100 / 7}%`,
    minHeight: 60,
    borderRadius: 8,
    marginVertical: 2,
    paddingBottom: 4,
    alignItems: 'stretch',
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  cellSelected: {
    backgroundColor: colors.accent,
  },
  cellWithBar: {
    backgroundColor: colors.surfaceRaised,
  },
  cellWithWarn: {
    backgroundColor: colors.surfaceRaised,
  },
  cellDim: {
    opacity: 0.4,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    paddingHorizontal: 2,
    gap: 1,
  },
  warnIcon: { marginTop: -1 },
  topBarDay: {
    color: '#0b1118',
    fontSize: 12,
    fontFamily: 'HankenGrotesk-Bold',
  },
  dayPlain: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dayToday: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.text,
    justifyContent: 'center',
  },
  dayText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: 'HankenGrotesk-Bold',
  },
  dayTextSelected: { color: '#0b1118' },
  dayTextDim: { color: colors.textMuted },
  amount: {
    fontSize: 9,
    fontFamily: 'HankenGrotesk-Bold',
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 1,
    marginTop: 2,
  },
  amountSelected: { color: '#0b1118' },
  amountWarn: { color: colors.warn },
  amountDim: { fontSize: 11, textAlign: 'center', color: colors.textMuted },
  flowPos: { color: colors.income },
  flowNeg: { color: colors.warn },
});
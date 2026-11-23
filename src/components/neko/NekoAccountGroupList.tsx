import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandIcon } from '../BrandIcon';
import { resolveBrandForAccount } from '../../domain/brands/resolveBrand';
import { colors } from '../../theme';
import { formatCurrencyFull } from '../../utils/format';

export type NekoAccountRow = {
  name: string;
  balance: number;
  movementCount?: number;
  accountId?: string;
};

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  total: number;
  totalColor?: string;
  rows: NekoAccountRow[];
  onPressRow?: (row: NekoAccountRow) => void;
};

/** Bloque expandido estilo NEKO: icono + título + total y filas indentadas. */
export function NekoAccountGroupList({
  title,
  icon,
  total,
  totalColor = colors.accent,
  rows,
  onPressRow,
}: Props) {
  if (!rows.length) {
    return null;
  }
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <Text style={styles.blockTitle}>{title}</Text>
        <Text style={[styles.blockTotal, { color: totalColor }]}>{formatCurrencyFull(total)}</Text>
      </View>
      {rows.map((r, index) => {
        const negative = r.balance < 0;
        const rowKey = r.accountId ?? `${r.name}-${index}`;
        const content = (
          <View style={styles.subRow}>
            <View style={styles.subLeft}>
              <BrandIcon brand={resolveBrandForAccount(r.name)} size={28} />
              <Text style={styles.subName} numberOfLines={1}>
                {r.name}
              </Text>
            </View>
            <View style={styles.subBalWrap}>
              {negative ? <Ionicons name="warning" size={12} color={colors.warn} /> : null}
              <Text style={[styles.subBal, negative && styles.subBalNeg]}>{formatCurrencyFull(r.balance)}</Text>
            </View>
          </View>
        );
        if (onPressRow) {
          return (
            <Pressable key={rowKey} onPress={() => onPressRow(r)}>
              {content}
            </Pressable>
          );
        }
        return <View key={rowKey}>{content}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockTitle: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 15, fontFamily: 'HankenGrotesk-SemiBold' },
  blockTotal: { fontWeight: '700', fontSize: 14, fontFamily: 'HankenGrotesk-SemiBold' },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
    gap: 8,
    minHeight: 40,
  },
  subLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  subName: { flex: 1, color: colors.text, fontSize: 14, fontFamily: 'HankenGrotesk-Regular' },
  subBalWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subBal: { color: colors.textMuted, fontSize: 13, fontFamily: 'HankenGrotesk-Medium' },
  subBalNeg: { color: colors.expense },
});
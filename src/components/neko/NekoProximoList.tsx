import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UpcomingItem } from '../../domain/upcoming';
import type { AccountBalance } from '../../domain/summaries';
import { normalizeAccount } from '../../domain/summaries';
import { colors, tokens } from '../../theme';
import { formatCurrencyFull, formatHistorySectionTitle } from '../../utils/format';
import { NekoEntrance } from './NekoEntrance';

type Props = {
  items: UpcomingItem[];
  accountBalances?: AccountBalance[];
  onPressItem?: (item: UpcomingItem) => void;
};

export function NekoProximoList({ items, accountBalances = [], onPressItem }: Props) {
  const balanceByAccount = new Map(
    accountBalances.map((b) => [normalizeAccount(b.account), b.balance]),
  );

  const grouped = new Map<string, UpcomingItem[]>();
  for (const item of items) {
    const day = item.date.slice(0, 10);
    const list = grouped.get(day) ?? [];
    list.push(item);
    grouped.set(day, list);
  }

  if (!items.length) {
    return (
      <Text style={styles.empty}>No hay eventos en este período con los filtros actuales.</Text>
    );
  }

  return (
    <View style={styles.wrap}>
      {[...grouped.entries()].map(([day, dayItems], blockIndex) => (
        <View key={day} style={styles.dayBlock}>
          <Text style={styles.dayLabel}>{formatHistorySectionTitle(day)}</Text>
          {dayItems.map((item, itemIndex) => {
            const entranceIndex = blockIndex * 4 + itemIndex;
            const acctBal = balanceByAccount.get(normalizeAccount(item.account));
            const iconStyle =
              item.signedAmount > 0
                ? styles.iconIncome
                : item.title.toLowerCase().includes('amor')
                  ? styles.iconLove
                  : styles.iconAccent;

            return (
              <NekoEntrance key={item.id} index={entranceIndex}>
              <Pressable
                style={styles.card}
                onPress={() => onPressItem?.(item)}
              >
                {item.recurring ? (
                  <View style={styles.syncBadge}>
                    <Ionicons name="sync-outline" size={13} color={colors.textMuted} />
                  </View>
                ) : null}
                <View style={[styles.iconBox, iconStyle]}>
                  <Ionicons
                    name={
                      item.signedAmount > 0
                        ? 'briefcase-outline'
                        : item.title.toLowerCase().includes('amor')
                          ? 'heart-outline'
                          : item.title.toLowerCase().includes('neko')
                            ? 'hardware-chip-outline'
                            : 'receipt-outline'
                    }
                    size={18}
                    color={item.signedAmount > 0 ? colors.income : colors.accent}
                  />
                </View>
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.account}
                  </Text>
                </View>
                <View style={styles.amounts}>
                  {item.signedAmount !== 0 ? (
                    <Text
                      style={[
                        styles.amount,
                        item.signedAmount > 0 ? styles.income : styles.expense,
                      ]}
                    >
                      {item.signedAmount > 0
                        ? `+${formatCurrencyFull(item.signedAmount)}`
                        : `−${formatCurrencyFull(Math.abs(item.signedAmount))}`}
                    </Text>
                  ) : (
                    <Text style={styles.amountMuted}>—</Text>
                  )}
                  {acctBal != null ? (
                    <Text
                      style={[
                        styles.balanceAfter,
                        acctBal < 0 ? styles.balanceNegative : undefined,
                      ]}
                    >
                      {formatCurrencyFull(acctBal)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
              </NekoEntrance>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
    fontFamily: 'HankenGrotesk-Regular',
  },
  dayBlock: { gap: 6, marginTop: 2 },
  dayLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.25,
    marginBottom: 2,
    paddingLeft: 2,
    fontFamily: 'HankenGrotesk-Medium',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  syncBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAccent: { backgroundColor: colors.accentMuted },
  iconIncome: { backgroundColor: 'rgba(61, 217, 180, 0.15)' },
  iconLove: { backgroundColor: 'rgba(244, 114, 182, 0.18)' },
  body: { flex: 1, gap: 2, paddingRight: 8 },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
    letterSpacing: -0.2,
  },
  meta: { color: colors.textMuted, fontSize: 11, lineHeight: 14 },
  amounts: { alignItems: 'flex-end', gap: 3, minWidth: 108 },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
    letterSpacing: -0.2,
  },
  amountMuted: { color: colors.textMuted, fontSize: 13 },
  income: { color: colors.income },
  expense: { color: colors.text },
  balanceAfter: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  balanceNegative: { color: colors.expense },
});
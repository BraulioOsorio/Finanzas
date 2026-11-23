import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandIcon } from '../../BrandIcon';
import { resolveDisplayIconForTransaction } from '../../../domain/icons/resolveDisplayIcon';
import { usePreferences } from '../../../context/PreferencesContext';
import type { Transaction } from '../../../types';
import { colors } from '../../../theme';
import { formatCurrencyFull, formatTransactionTimestamp } from '../../../utils/format';
import { NekoSwipeableRow } from '../NekoSwipeableRow';

type Props = {
  item: Transaction;
  runningBalance?: number;
  onDelete?: () => void;
};

export function NekoCalendarTxCard({ item, runningBalance, onDelete }: Props) {
  const { iconDisplayMode } = usePreferences();
  const brand = resolveDisplayIconForTransaction(item, iconDisplayMode);
  const title = item.description?.trim() || item.category || item.nekoType;
  const signed = item.signedAmount;
  const isIncome = signed > 0 || (signed === 0 && item.kind === 'income');
  const isExpense = signed < 0 || (signed === 0 && item.kind === 'expense');
  const amountLabel = (() => {
    const abs = formatCurrencyFull(Math.abs(signed || item.amount));
    if (signed < 0) {
      return `−${abs}`;
    }
    if (signed > 0) {
      return `+${abs}`;
    }
    return abs;
  })();

  const card = (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.ts}>{formatTransactionTimestamp(item.postedDate, item.createdAt)}</Text>
        <Ionicons name="checkmark" size={16} color={colors.textMuted} />
      </View>
      <View style={styles.row}>
        <BrandIcon brand={brand} size={44} />
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.account}
          </Text>
        </View>
        <View style={styles.amounts}>
          <Text style={[styles.amount, isIncome && styles.income, isExpense && styles.expense]}>
            {amountLabel}
          </Text>
          {runningBalance != null ? (
            <Text style={styles.balanceAfter}>{formatCurrencyFull(runningBalance)}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (!onDelete) {
    return card;
  }

  return (
    <NekoSwipeableRow
      actions={[{ key: 'del', label: 'Borrar', color: colors.expense, onPress: onDelete }]}
    >
      {card}
    </NekoSwipeableRow>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ts: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  meta: { color: colors.textMuted, fontSize: 11 },
  amounts: { alignItems: 'flex-end', gap: 3, minWidth: 100 },
  amount: { color: colors.text, fontSize: 15, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  income: { color: colors.income },
  expense: { color: colors.warn },
  balanceAfter: { color: colors.textMuted, fontSize: 11 },
});
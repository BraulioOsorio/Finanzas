import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandIcon } from './BrandIcon';
import { resolveBrandForAccount } from '../domain/brands/resolveBrand';
import { ACCOUNT_KIND_LABELS } from '../domain/accounts/inferAccountKind';
import { accountDefByName } from '../domain/accounts/resolveAccounts';
import type { AccountBalance } from '../domain/summaries';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

type Props = {
  item: AccountBalance;
  onPress?: () => void;
};

export function AccountBalanceRow({ item, onPress }: Props) {
  const { accounts } = useTransactions();
  const positive = item.balance >= 0;
  const brand = resolveBrandForAccount(item.account);
  const def = accountDefByName(accounts, item.account);
  const kindLabel = def ? ACCOUNT_KIND_LABELS[def.kind] : 'Sin tipo';
  const liquidHint = def && !def.liquid ? ' · No cuenta en disponible' : '';

  const body = (
    <>
      <BrandIcon brand={brand} size={42} />
      <View style={styles.leading}>
        <Text style={styles.name} numberOfLines={1}>
          {item.account}
        </Text>
        <Text style={styles.meta}>
          {kindLabel}
          {liquidHint} · {item.movementCount} movimientos
        </Text>
      </View>
      <Text style={[styles.amount, positive ? styles.positive : styles.negative]}>
        {formatCurrency(item.balance)}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.row} onPress={onPress}>
        {body}
      </Pressable>
    );
  }

  return <View style={styles.row}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  leading: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
  positive: { color: colors.income },
  negative: { color: colors.expense },
});
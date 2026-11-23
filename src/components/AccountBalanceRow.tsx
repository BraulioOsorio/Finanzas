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
  /** Disponible tras compromisos del horizonte global (solo líquidas). */
  safeAfterPlanned?: number;
};

export function AccountBalanceRow({ item, onPress, safeAfterPlanned }: Props) {
  const { accounts } = useTransactions();
  const positive = item.balance >= 0;
  const brand = resolveBrandForAccount(item.account);
  const def = accountDefByName(accounts, item.account);
  const kindLabel = def ? ACCOUNT_KIND_LABELS[def.kind] : 'Sin tipo';
  const liquidHint = def && !def.liquid ? ' · No cuenta en disponible' : '';

  let creditUtil: number | undefined;
  if (def?.kind === 'credit' && def.creditLimit && def.creditLimit > 0) {
    creditUtil = Math.min(1.2, Math.abs(Math.min(0, item.balance)) / def.creditLimit);
  }

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
        {safeAfterPlanned != null && def?.liquid ? (
          <Text style={styles.safe}>
            Disponible ~{formatCurrency(safeAfterPlanned)} (compromisos)
          </Text>
        ) : null}
        {creditUtil != null ? (
          <View style={styles.utilRow}>
            <View style={styles.utilTrack}>
              <View style={[styles.utilFill, { width: `${Math.min(100, creditUtil * 100)}%` }]} />
            </View>
            <Text style={styles.utilText}>
              Cupo {Math.round(creditUtil * 100)}% · {formatCurrency(def!.creditLimit! - Math.abs(Math.min(0, item.balance)))}{' '}
              libre
            </Text>
          </View>
        ) : def?.kind === 'credit' && !def.creditLimit ? (
          <Text style={styles.cupoHint}>Indica cupo en editar cuenta para ver utilización</Text>
        ) : null}
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
  leading: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12 },
  safe: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  utilRow: { gap: 4, marginTop: 2 },
  utilTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  utilFill: { height: '100%', backgroundColor: colors.expense },
  utilText: { color: colors.textMuted, fontSize: 10 },
  cupoHint: { color: colors.textMuted, fontSize: 10, fontStyle: 'italic' },
  amount: { fontSize: 16, fontWeight: '700' },
  positive: { color: colors.income },
  negative: { color: colors.expense },
});
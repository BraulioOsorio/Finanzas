import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountEditorModal } from '../components/AccountEditorModal';
import { TransactionRow } from '../components/TransactionRow';
import { accountDefByName } from '../domain/accounts/resolveAccounts';
import { loanActivities, paymentsThisMonth } from '../domain/debts/loanLedger';
import { buildLoanAmortization } from '../domain/debts/amortization';
import { debtBucketSummaries, totalDebtOwed } from '../domain/debtSummary';
import { LoanAmortizationBlock } from '../components/LoanAmortizationBlock';
import { distinctMonthKeys } from '../domain/historyFilters';
import { computeAccountBalances, currentMonthKey } from '../domain/summaries';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { AccountDef } from '../types';
import { formatCurrency } from '../utils/format';

function MonthChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function DeudasScreen() {
  const { debtSummaries, transactions, accounts, monthFlow } = useTransactions();
  const [monthKey, setMonthKey] = useState(monthFlow.monthKey || currentMonthKey());
  const [accountFilter, setAccountFilter] = useState<string | undefined>();
  const [editing, setEditing] = useState<AccountDef | null>(null);

  const months = useMemo(() => distinctMonthKeys(transactions), [transactions]);

  const balances = useMemo(() => computeAccountBalances(transactions), [transactions]);

  const summaries = useMemo(() => {
    if (monthKey === monthFlow.monthKey) {
      return debtSummaries;
    }
    return debtBucketSummaries(accounts, balances, transactions, monthKey);
  }, [debtSummaries, monthKey, monthFlow.monthKey, accounts, transactions, balances]);

  const totalOwed = totalDebtOwed(summaries);
  const monthPayments = paymentsThisMonth(transactions, monthKey);
  const activities = loanActivities(transactions, {
    monthKey,
    account: accountFilter,
    limit: 50,
  });

  const openEdit = (name: string) => {
    const def = accountDefByName(accounts, name);
    setEditing(def ?? null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Deudas</Text>
            <Text style={styles.subtitle}>
              Préstamos, bucket Deudas y abonos al estilo Neko. Configura el capital original en la
              cuenta para ver amortización.
            </Text>

            <View style={styles.totalsCard}>
              <Text style={styles.totalsLabel}>Saldo en cuentas de deuda</Text>
              <Text style={styles.totalsValue}>{formatCurrency(totalOwed)}</Text>
              <Text style={styles.totalsMeta}>
                Abonos tipo «Pago de préstamo» en {monthKey}: {formatCurrency(monthPayments)}
              </Text>
            </View>

            <Text style={styles.filterLabel}>Mes</Text>
            <View style={styles.chipRow}>
              {months.slice(0, 6).map((m) => (
                <MonthChip key={m} label={m} active={monthKey === m} onPress={() => setMonthKey(m)} />
              ))}
            </View>

            <Text style={styles.filterLabel}>Cuentas</Text>
            <View style={styles.chipRow}>
              <MonthChip
                label="Todas"
                active={!accountFilter}
                onPress={() => setAccountFilter(undefined)}
              />
              {summaries.map((s) => (
                <MonthChip
                  key={s.account}
                  label={s.account}
                  active={accountFilter === s.account}
                  onPress={() => setAccountFilter(s.account)}
                />
              ))}
            </View>

            {summaries.map((d) => {
              const amort = buildLoanAmortization(d.account, accounts, transactions, d.balance);
              return (
              <Pressable key={d.account} style={styles.bucketCard} onPress={() => openEdit(d.account)}>
                <View style={styles.bucketHead}>
                  <Text style={styles.bucketName}>{d.account}</Text>
                  <Text style={styles.bucketEdit}>Configurar</Text>
                </View>
                <Text style={styles.bucketBalance}>Saldo: {formatCurrency(d.balance)}</Text>
                <Text style={styles.bucketPaid}>
                  Abonos en {monthKey}: {formatCurrency(d.paidThisMonth)}
                </Text>
                {d.progress.principal != null && d.progress.percentPaid != null ? (
                  <View style={styles.progressBlock}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.round(d.progress.percentPaid * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressMeta}>
                      Amortizado ~{formatCurrency(d.progress.paidEstimate)} de{' '}
                      {formatCurrency(d.progress.principal)} (
                      {Math.round(d.progress.percentPaid * 100)}%)
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.progressHint}>
                    Añade «Capital del préstamo» al editar la cuenta para ver progreso.
                  </Text>
                )}
                <LoanAmortizationBlock plan={amort} />
              </Pressable>
            );
            })}

            <Text style={styles.sectionTitle}>Movimientos ({monthKey})</Text>
          </View>
        }
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Sin pagos o fondos de préstamo este mes.</Text>
        }
        renderItem={({ item }) => {
          const tx = transactions.find((t) => t.id === item.id);
          if (!tx) {
            return (
              <Text style={styles.fallback}>
                {item.date} · {item.title} · {formatCurrency(item.amount)}
              </Text>
            );
          }
          return <TransactionRow item={tx} />;
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <AccountEditorModal
        visible={editing !== null}
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingBottom: 8, gap: 10 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  totalsLabel: { color: colors.textMuted, fontSize: 13 },
  totalsValue: { color: colors.expense, fontSize: 22, fontWeight: '800' },
  totalsMeta: { color: colors.text, fontSize: 13 },
  filterLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  bucketCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginTop: 4,
  },
  bucketHead: { flexDirection: 'row', justifyContent: 'space-between' },
  bucketName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  bucketEdit: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  bucketBalance: { color: colors.expense, fontSize: 15, fontWeight: '600' },
  bucketPaid: { color: colors.income, fontSize: 12 },
  progressBlock: { gap: 4, marginTop: 4 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.income },
  progressMeta: { color: colors.textMuted, fontSize: 11 },
  progressHint: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 16 },
  fallback: { color: colors.textMuted, fontSize: 13 },
});
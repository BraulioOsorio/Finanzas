import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountBalanceRow } from '../components/AccountBalanceRow';
import { BudgetProgressList } from '../components/BudgetProgressList';
import { CreditCardSummaryList } from '../components/CreditCardSummaryList';
import { DebtSummaryList } from '../components/DebtSummaryList';
import { OverdraftAlertList } from '../components/OverdraftAlertList';
import { SafeToSpendCard } from '../components/SafeToSpendCard';
import { SafeToSpendDetailModal } from '../components/SafeToSpendDetailModal';
import { TransactionRow } from '../components/TransactionRow';
import { TodayAgenda } from '../components/TodayAgenda';
import { UpcomingList } from '../components/UpcomingList';
import { usePreferences } from '../context/PreferencesContext';
import { computeSafeToSpend } from '../domain/safeToSpend';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

export function HomeScreen() {
  const navigation = useNavigation();
  const {
    loading,
    liquidAvailable,
    totalInAccounts,
    accountBalances,
    transactions,
    transferCount,
    budgetProgress,
    creditCardSummaries,
    debtSummaries,
    monthFlow,
    upcomingItems,
    overdraftAlerts,
    todayAgenda,
    tomorrowHeadline,
    accounts,
    scheduledPayments,
  } = useTransactions();
  const { safeToSpendHorizon, setSafeToSpendHorizon } = usePreferences();
  const [detailOpen, setDetailOpen] = useState(false);
  const safeSnapshot = useMemo(
    () =>
      computeSafeToSpend(
        safeToSpendHorizon,
        accounts,
        accountBalances,
        upcomingItems,
        undefined,
        scheduledPayments,
      ),
    [safeToSpendHorizon, accounts, accountBalances, upcomingItems, scheduledPayments],
  );
  const recent = transactions.slice(0, 5);
  const topAccounts = accountBalances.slice(0, 4);
  const budgetsOver = budgetProgress.filter((p) => p.ratio > 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Finanzas</Text>
        <Text style={styles.subtitle}>Resumen al estilo NEKO (datos en tu teléfono)</Text>
        <Pressable
          style={styles.searchPill}
          onPress={() =>
            navigation.dispatch(CommonActions.navigate({ name: 'Más', params: { screen: 'Buscar' } }))
          }
        >
          <Text style={styles.searchPillText}>Buscar movimientos…</Text>
        </Pressable>

        <TodayAgenda items={todayAgenda} tomorrow={tomorrowHeadline} />

        <SafeToSpendCard
          snapshot={safeSnapshot}
          horizon={safeToSpendHorizon}
          onHorizon={(h) => void setSafeToSpendHorizon(h)}
          onOpenDetail={() => setDetailOpen(true)}
          loading={loading}
        />
        <SafeToSpendDetailModal
          visible={detailOpen}
          snapshot={safeSnapshot}
          onClose={() => setDetailOpen(false)}
        />

        {budgetsOver.length > 0 ? (
          <View style={styles.overBudget}>
            <Text style={styles.overBudgetTitle}>Presupuesto pasado</Text>
            <Text style={styles.overBudgetBody}>
              {budgetsOver.map((p) => p.label).join(' · ')}
            </Text>
          </View>
        ) : null}

        <OverdraftAlertList items={overdraftAlerts} />

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo líquido (sin compromisos)</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
          ) : (
            <Text style={styles.balanceValue}>{formatCurrency(liquidAvailable)}</Text>
          )}
          <Text style={styles.balanceHint}>
            Solo cuentas marcadas como líquidas. Total en todas las cuentas:{' '}
            {formatCurrency(totalInAccounts)}
          </Text>

          <View style={styles.monthCard}>
            <Text style={styles.monthTitle}>Flujo del mes ({monthFlow.monthKey})</Text>
            <View style={styles.splitRow}>
              <View style={[styles.pill, styles.pillIncome]}>
                <Text style={styles.pillLabel}>Ingresos</Text>
                <Text style={styles.pillValueIncome}>{formatCurrency(monthFlow.income)}</Text>
              </View>
              <View style={[styles.pill, styles.pillExpense]}>
                <Text style={styles.pillLabel}>Gastos</Text>
                <Text style={styles.pillValueExpense}>{formatCurrency(monthFlow.expense)}</Text>
              </View>
            </View>
            <Text style={styles.monthNet}>
              Neto del mes:{' '}
              <Text style={monthFlow.net >= 0 ? styles.netPositive : styles.netNegative}>
                {formatCurrency(monthFlow.net)}
              </Text>
            </Text>
          </View>

          {transferCount > 0 ? (
            <Text style={styles.transferHint}>
              {transferCount} transferencias internas (no entran al flujo ingreso/gasto)
            </Text>
          ) : null}

          <CreditCardSummaryList cards={creditCardSummaries} />
          <DebtSummaryList items={debtSummaries} monthKey={monthFlow.monthKey} />
          <BudgetProgressList items={budgetProgress} />
          <UpcomingList items={upcomingItems} />
        </View>

        {topAccounts.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Tus cuentas</Text>
            <View style={styles.list}>
              {topAccounts.map((item) => (
                <AccountBalanceRow key={item.account} item={item} />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>
        {loading ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aún no hay movimientos</Text>
            <Text style={styles.emptyBody}>
              Importa tu CSV de Neko o registra uno en la pestaña Registrar.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recent.map((item) => (
              <TransactionRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  greeting: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: -8, lineHeight: 20 },
  searchPill: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  searchPillText: { color: colors.textMuted, fontSize: 15 },
  balanceCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    gap: 6,
  },
  balanceLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  balanceValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  balanceHint: { color: colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 4 },
  monthCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  monthTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  splitRow: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, borderRadius: 14, padding: 12 },
  pillIncome: { backgroundColor: colors.incomeMuted },
  pillExpense: { backgroundColor: colors.expenseMuted },
  pillLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pillValueIncome: { color: colors.income, fontSize: 16, fontWeight: '700', marginTop: 4 },
  pillValueExpense: { color: colors.expense, fontSize: 16, fontWeight: '700', marginTop: 4 },
  monthNet: { color: colors.textMuted, fontSize: 13, marginTop: 12 },
  netPositive: { color: colors.income, fontWeight: '700' },
  netNegative: { color: colors.expense, fontWeight: '700' },
  transferHint: { color: colors.textMuted, fontSize: 12, marginTop: 8, lineHeight: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  list: { gap: 10 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.textMuted, fontSize: 14, marginTop: 8, lineHeight: 20 },
  overBudget: {
    backgroundColor: colors.expenseMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.expense,
    gap: 4,
  },
  overBudgetTitle: { color: colors.expense, fontWeight: '800', fontSize: 14 },
  overBudgetBody: { color: colors.text, fontSize: 13, lineHeight: 18 },
});
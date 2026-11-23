import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetProgressList } from '../components/BudgetProgressList';
import { NekoAccountGroupList } from '../components/neko/NekoAccountGroupList';
import { NekoBalanceStrip } from '../components/neko/NekoBalanceStrip';
import { NekoCategorySpendList } from '../components/neko/NekoCategorySpendList';
import { NekoEntrance } from '../components/neko/NekoEntrance';
import { NekoFlowBarChart } from '../components/neko/NekoFlowBarChart';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { NekoSegmentedControl } from '../components/neko/NekoSegmentedControl';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { shiftMonth } from '../domain/calendar';
import { distinctMonthKeys, EMPTY_HISTORY_FILTER } from '../domain/historyFilters';
import { topCategorySpendingBetween } from '../domain/categorySpend';
import { computeNetWorth } from '../domain/netWorth';
import { nekoSummaryToday } from '../domain/nekoDisplay';
import { flowBetween, monthsSpanned, periodBounds, type ReportPeriodKind } from '../domain/reportPeriod';
import { monthRealFlow, currentMonthKey } from '../domain/summaries';
import { budgetProgressForDateRange, budgetProgressForMonth } from '../domain/budgets';
import { useRootNav } from '../navigation/useRootNav';
import type { MainTabParamList } from '../navigation/tabTypes';
import { useTransactions } from '../context/TransactionsContext';
import { colors, tokens } from '../theme';
import { formatCurrency, formatCurrencyFull, formatNekoMonthTitle } from '../utils/format';

const PERIOD_OPTS: { value: ReportPeriodKind; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Año' },
];

type TabNav = BottomTabNavigationProp<MainTabParamList>;

export function InformeScreen() {
  const tabNav = useNavigation<TabNav>();
  const { openMas } = useRootNav();
  const {
    loading,
    monthFlow,
    accountBalances,
    creditCardSummaries,
    debtSummaries,
    budgetProgress,
    transactions,
    accounts,
    budgets,
    scheduledPayments,
    installmentPlans,
    setHistoryFilterSeed,
    nekoSummary,
  } = useTransactions();

  const [monthKey, setMonthKey] = useState(monthFlow.monthKey || currentMonthKey());
  const [periodKind, setPeriodKind] = useState<ReportPeriodKind>('month');

  const months = useMemo(() => {
    const keys = distinctMonthKeys(transactions);
    const cur = currentMonthKey();
    if (!keys.includes(cur)) {
      return [cur, ...keys];
    }
    return keys;
  }, [transactions]);

  const bounds = useMemo(() => periodBounds(periodKind, monthKey), [periodKind, monthKey]);

  const selectedFlow = useMemo(
    () =>
      periodKind === 'month' && monthKey === monthFlow.monthKey
        ? monthFlow
        : flowBetween(transactions, bounds.start, bounds.end, bounds.label),
    [periodKind, monthKey, monthFlow, transactions, bounds],
  );

  const monthKeysInRange = useMemo(() => monthsSpanned(bounds.start, bounds.end), [bounds]);

  const selectedBudgetProgress = useMemo(() => {
    if (periodKind === 'month') {
      return monthKey === monthFlow.monthKey
        ? budgetProgress
        : budgetProgressForMonth(budgets, transactions, monthKey, {
            includePlanned: true,
            scheduled: scheduledPayments,
            installmentPlans,
            accounts,
          });
    }
    return budgetProgressForDateRange(
      budgets,
      transactions,
      bounds.start,
      bounds.end,
      monthKeysInRange,
      {
        includePlanned: true,
        scheduled: scheduledPayments,
        installmentPlans,
        accounts,
      },
    );
  }, [
    periodKind,
    monthKey,
    monthFlow.monthKey,
    budgetProgress,
    budgets,
    transactions,
    scheduledPayments,
    installmentPlans,
    accounts,
    bounds,
    monthKeysInRange,
  ]);

  const net = useMemo(
    () =>
      computeNetWorth(accounts, accountBalances, creditCardSummaries, debtSummaries, transactions),
    [accounts, accountBalances, creditCardSummaries, debtSummaries, transactions],
  );

  const summary = useMemo(
    () => nekoSummary ?? nekoSummaryToday(transactions, accounts),
    [nekoSummary, transactions, accounts],
  );

  const flowBars = useMemo(() => {
    return monthKeysInRange.slice(-6).map((mk) => {
      const f = monthRealFlow(transactions, mk);
      const parts = mk.split('-');
      const label = `${parts[1]}/${parts[0].slice(2)}`;
      return { label, income: f.income, expense: f.expense };
    });
  }, [monthKeysInRange, transactions]);

  const topCats = useMemo(
    () => topCategorySpendingBetween(transactions, bounds.start, bounds.end, 12),
    [transactions, bounds],
  );

  const catRows = topCats.map((row) => ({
    key: row.key,
    label: row.label,
    group: row.group,
    category: row.category,
    spent: row.spent,
    count: row.count,
  }));

  const openCategoryInHistory = (group: string, category: string, label: string) => {
    setHistoryFilterSeed({
      ...EMPTY_HISTORY_FILTER,
      monthKey: periodKind === 'month' ? monthKey : '',
      categoryGroup: group,
      query: category || label,
    });
    tabNav.navigate('Historial');
  };

  const headerTitle =
    periodKind === 'month' ? formatNekoMonthTitle(monthKey) : bounds.label;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_BOTTOM_INSET + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <NekoScreenHeader
          title="Análisis"
          subtitle={headerTitle}
          actions={[
            {
              icon: 'chevron-back',
              accessibilityLabel: 'Mes anterior',
              onPress: () => setMonthKey((m) => shiftMonth(m, -1)),
            },
            {
              icon: 'chevron-forward',
              accessibilityLabel: 'Mes siguiente',
              onPress: () => setMonthKey((m) => shiftMonth(m, 1)),
            },
            {
              icon: 'menu-outline',
              accessibilityLabel: 'Más',
              onPress: () => openMas(),
            },
          ]}
        />

        {summary ? (
          <NekoEntrance>
            <NekoBalanceStrip summary={summary} />
          </NekoEntrance>
        ) : null}

        <NekoEntrance index={1}>
          <NekoSegmentedControl
            options={PERIOD_OPTS}
            value={periodKind}
            onChange={setPeriodKind}
          />
        </NekoEntrance>

        {periodKind === 'month' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
            <View style={styles.monthChips}>
              {months.slice(0, 14).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.chip, monthKey === m && styles.chipActive]}
                  onPress={() => setMonthKey(m)}
                >
                  <Text style={[styles.chipText, monthKey === m && styles.chipTextActive]}>
                    {formatNekoMonthTitle(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

        <NekoEntrance index={2}>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Patrimonio líquido neto</Text>
            <Text style={styles.heroValue}>
              {loading ? '…' : formatCurrencyFull(net.netLiquid)}
            </Text>
            <View style={styles.heroGrid}>
              <HeroStat label="Cuentas" value={net.totalInAccounts} />
              <HeroStat label="Líquido" value={net.liquid} accent />
              <HeroStat label="TC usado" value={-net.creditOwed} warn />
              <HeroStat label="Deudas" value={-net.debtBuckets} warn />
            </View>
          </View>
        </NekoEntrance>

        <NekoEntrance index={3}>
          <NekoFlowBarChart title="Ingresos y gastos" bars={flowBars} />
        </NekoEntrance>

        <NekoEntrance index={4}>
          <View style={styles.flowCard}>
            <Text style={styles.cardTitle}>Flujo del período</Text>
            <Text style={styles.cardSub}>
              {bounds.start} → {bounds.end}
            </Text>
            <View style={styles.flowRow}>
              <FlowTile label="Ingresos" value={selectedFlow.income} positive />
              <FlowTile label="Gastos" value={selectedFlow.expense} negative />
              <FlowTile
                label="Neto"
                value={selectedFlow.net}
                negative={selectedFlow.net < 0}
                emphasize
              />
            </View>
          </View>
        </NekoEntrance>

        <Text style={styles.sectionTitle}>Gastos por categoría</Text>
        <NekoCategorySpendList
          rows={catRows}
          maxSpent={topCats[0]?.spent ?? 1}
          onPressRow={(row) => openCategoryInHistory(row.group, row.category, row.label)}
        />

        {selectedBudgetProgress.length ? (
          <NekoEntrance index={5}>
            <BudgetProgressList
              items={selectedBudgetProgress}
              monthKey={
                periodKind === 'month'
                  ? monthKey
                  : `${bounds.label} (${monthKeysInRange.length} meses)`
              }
            />
          </NekoEntrance>
        ) : null}

        <NekoEntrance index={6}>
          <Text style={styles.sectionTitle}>Cuentas al día</Text>
          <View style={styles.accountGroups}>
            <NekoAccountGroupList
              title="Cuentas de débito"
              icon="business-outline"
              total={summary.liquidTotal}
              rows={summary.debitAccounts}
            />
            <NekoAccountGroupList
              title="Tarjetas de crédito"
              icon="card-outline"
              total={summary.creditTotal}
              totalColor="#f5a05c"
              rows={summary.creditAccounts}
            />
            {summary.loanAccounts.length ? (
              <NekoAccountGroupList
                title="Préstamos"
                icon="document-text-outline"
                total={summary.loanAccounts.reduce((s, r) => s + r.balance, 0)}
                totalColor={colors.textMuted}
                rows={summary.loanAccounts}
              />
            ) : null}
          </View>
        </NekoEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text
        style={[
          styles.heroStatValue,
          accent && { color: colors.accent },
          warn && { color: colors.warn },
        ]}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function FlowTile({
  label,
  value,
  positive,
  negative,
  emphasize,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
  emphasize?: boolean;
}) {
  return (
    <View style={[styles.flowTile, emphasize && styles.flowTileEmph]}>
      <Text style={styles.flowTileLabel}>{label}</Text>
      <Text
        style={[
          styles.flowTileValue,
          positive && { color: colors.income },
          negative && value !== 0 && { color: colors.expense },
        ]}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  monthScroll: { marginHorizontal: -4 },
  monthChips: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#0b1118', fontWeight: '700' },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  heroLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  heroValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-SemiBold',
    letterSpacing: -0.5,
  },
  heroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroStat: {
    width: '47%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroStatLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  heroStatValue: { color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  flowCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', fontFamily: 'HankenGrotesk-SemiBold' },
  cardSub: { color: colors.textMuted, fontSize: 11 },
  flowRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  flowTile: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flowTileEmph: { borderColor: colors.accentBorder },
  flowTileLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  flowTileValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-SemiBold',
    marginTop: 4,
  },
  accountGroups: { gap: 16 },
});
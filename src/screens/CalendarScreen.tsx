import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NekoCalendarBalanceCard } from '../components/neko/calendar/NekoCalendarBalanceCard';
import { NekoCalendarDayCell } from '../components/neko/calendar/NekoCalendarDayCell';
import { NekoCalendarTxCard } from '../components/neko/calendar/NekoCalendarTxCard';
import { NekoCalendarUpcomingBlock } from '../components/neko/calendar/NekoCalendarUpcomingCard';
import { useRootNav } from '../navigation/useRootNav';
import { NekoInicioFiltersSheet } from '../components/neko/NekoInicioFiltersSheet';
import { NekoMonthSummarySheet } from '../components/neko/NekoMonthSummarySheet';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { NekoSegmentedControl } from '../components/neko/NekoSegmentedControl';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { balanceAfterTransaction as nekoBalanceAfterTx, dayCalendarBreakdown } from '../domain/calendarDayBalances';
import {
  buildMonthCalendar,
  daysInMonth,
  monthKeyFromDate,
  scheduledByDate,
  shiftMonth,
  type DaySnapshot,
} from '../domain/calendar';
import { buildUpcoming } from '../domain/upcoming';
import {
  filterUpcomingByDashboard,
  isAccountEnabledInDashboard,
  transactionPassesTxFilters,
} from '../domain/dashboardFilters';
import type { Transaction } from '../types';
import { TransactionEditModal } from '../components/TransactionEditModal';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { formatHistorySectionTitle, formatNekoMonthTitle } from '../utils/format';

type CalendarViewMode = 'balance' | 'flow';
type ScopeFilter = 'all' | 'debit' | 'credit';

const WEEKDAYS = [
  { key: 'mon', label: 'L' },
  { key: 'tue', label: 'M' },
  { key: 'wed', label: 'M' },
  { key: 'thu', label: 'J' },
  { key: 'fri', label: 'V' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'D' },
] as const;

function dayNetFlow(day: DaySnapshot): number {
  const tx = day.transactions.reduce((s, t) => s + t.signedAmount, 0);
  const sch = day.scheduled.reduce((s, x) => s + x.signedAmount, 0);
  return tx + sch;
}

function sortPagadoNewestFirst(items: Transaction[]): Transaction[] {
  return [...items].sort((a, b) => {
    const ca = a.createdAt?.length > 10 ? a.createdAt : `${a.postedDate}T12:00:00`;
    const cb = b.createdAt?.length > 10 ? b.createdAt : `${b.postedDate}T12:00:00`;
    if (ca !== cb) {
      return cb.localeCompare(ca);
    }
    return b.id.localeCompare(a.id);
  });
}

export function CalendarScreen() {
  const {
    transactions,
    scheduledPayments,
    installmentPlans,
    accounts,
    accountBalances,
    removeTransaction,
  } = useTransactions();
  const { inicioFilters, setInicioFilters } = useDashboardFilters();

  const [monthKey, setMonthKey] = useState(monthKeyFromDate(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('balance');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [balanceExpanded, setBalanceExpanded] = useState(false);
  const [pagadoExpanded, setPagadoExpanded] = useState(true);
  const [proximoExpanded, setProximoExpanded] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { openMas } = useRootNav();

  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (todayIso.startsWith(monthKey)) {
      setSelectedDate(todayIso);
    } else {
      setSelectedDate(`${monthKey}-01`);
    }
  }, [monthKey, todayIso]);

  const dashboardTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          isAccountEnabledInDashboard(inicioFilters, t.account) &&
          transactionPassesTxFilters(t, inicioFilters),
      ),
    [transactions, inicioFilters],
  );

  const scopedTransactions = useMemo(() => {
    return dashboardTransactions.filter((t) => {
      const def =
        (t.nekoAccountId && accounts.find((a) => a.id === t.nekoAccountId || a.nekoSqliteId === t.nekoAccountId)) ||
        accounts.find((a) => a.name.toLowerCase() === t.account.trim().toLowerCase());
      if (scopeFilter === 'debit') {
        return def?.kind !== 'credit';
      }
      if (scopeFilter === 'credit') {
        return def?.kind === 'credit';
      }
      return true;
    });
  }, [dashboardTransactions, accounts, scopeFilter]);

  const { days, startPadding } = useMemo(
    () =>
      buildMonthCalendar(
        scopedTransactions,
        monthKey,
        undefined,
        scheduledPayments,
        installmentPlans,
        accounts,
        todayIso,
      ),
    [scopedTransactions, monthKey, scheduledPayments, installmentPlans, accounts, todayIso],
  );

  const selected = selectedDate ? days.find((d) => d.date === selectedDate) : undefined;

  const scopeKinds = useMemo(
    () => ({
      debitOnly: scopeFilter === 'debit',
      creditOnly: scopeFilter === 'credit',
    }),
    [scopeFilter],
  );

  const breakdown = useMemo(() => {
    const asOf = selectedDate ?? todayIso;
    return dayCalendarBreakdown(
      transactions,
      accounts,
      asOf,
      todayIso,
      scheduledPayments,
      installmentPlans,
      scopeKinds,
    );
  }, [
    transactions,
    accounts,
    selectedDate,
    todayIso,
    scheduledPayments,
    installmentPlans,
    scopeKinds,
  ]);

  const monthScheduledMap = useMemo(() => {
    const monthEnd = `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, '0')}`;
    return scheduledByDate(
      scheduledPayments,
      installmentPlans,
      accounts,
      todayIso,
      monthEnd,
    );
  }, [monthKey, scheduledPayments, installmentPlans, accounts, todayIso]);

  const dayCellMetrics = useMemo(() => {
    const map = new Map<
      string,
      { displayValue: number; hasWarning: boolean }
    >();
    for (const day of days) {
      const snap = dayCalendarBreakdown(
        transactions,
        accounts,
        day.date,
        todayIso,
        scheduledPayments,
        installmentPlans,
        scopeKinds,
        monthScheduledMap,
      );
      const displayValue =
        viewMode === 'flow'
          ? dayNetFlow(day)
          : scopeFilter === 'credit'
            ? snap.creditTotal
            : snap.liquidTotal;
      map.set(day.date, { displayValue, hasWarning: snap.hasWarning });
    }
    return map;
  }, [
    days,
    transactions,
    accounts,
    todayIso,
    scheduledPayments,
    installmentPlans,
    scopeKinds,
    scopeFilter,
    viewMode,
    monthScheduledMap,
  ]);

  useEffect(() => {
    if (breakdown.hasWarning) {
      setBalanceExpanded(true);
    }
  }, [selectedDate, breakdown.hasWarning]);

  const proximoDay = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    const raw = buildUpcoming(
      scheduledPayments,
      installmentPlans,
      accounts,
      transactions,
      selectedDate,
      45,
    ).filter((i) => i.date.slice(0, 10) === selectedDate);
    return filterUpcomingByDashboard(raw, inicioFilters);
  }, [selectedDate, scheduledPayments, installmentPlans, accounts, transactions, inicioFilters]);

  const pagadoTransactions = useMemo(
    () => (selected ? sortPagadoNewestFirst(selected.transactions) : []),
    [selected],
  );

  const headerTitle = selectedDate
    ? formatHistorySectionTitle(selectedDate)
    : formatNekoMonthTitle(monthKey);

  const cells: (DaySnapshot | null)[] = [
    ...Array.from({ length: startPadding }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const pagadoCount = selected?.transactions.length ?? 0;

  const selectedDayAccountBalances = useMemo(() => {
    const rows = [
      ...breakdown.debitAccounts,
      ...breakdown.creditAccounts,
      ...breakdown.loanAccounts,
    ];
    return rows.map((r) => ({
      account: r.name,
      balance: r.balance,
      movementCount: 0,
    }));
  }, [breakdown]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_BOTTOM_INSET + 72 }]}
        showsVerticalScrollIndicator={false}
      >
        <NekoScreenHeader
          title={headerTitle}
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
              icon: 'scale-outline',
              accessibilityLabel: 'Resumen del mes',
              onPress: () => setSummaryOpen(true),
            },
            {
              icon: 'menu-outline',
              accessibilityLabel: 'Más',
              onPress: () => openMas(),
            },
          ]}
        />

        <View style={styles.calCard}>
          <View style={styles.toolRow}>
            <View style={styles.segmentWrap}>
              <NekoSegmentedControl
                options={[
                  { value: 'balance', label: 'Balance' },
                  { value: 'flow', label: 'Flujo' },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
            </View>
            <View style={styles.iconGroup}>
              <Pressable
                style={[styles.scopeBtn, scopeFilter === 'debit' && styles.scopeBtnOn]}
                onPress={() => setScopeFilter((s) => (s === 'debit' ? 'all' : 'debit'))}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={scopeFilter === 'debit' ? '#0b1118' : colors.accent}
                />
              </Pressable>
              <Pressable
                style={[styles.scopeBtn, scopeFilter === 'credit' && styles.scopeBtnOn]}
                onPress={() => setScopeFilter((s) => (s === 'credit' ? 'all' : 'credit'))}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={scopeFilter === 'credit' ? '#0b1118' : colors.accent}
                />
              </Pressable>
              <Pressable style={styles.filterBtn} onPress={() => setFiltersOpen(true)}>
                <Ionicons name="funnel-outline" size={18} color={colors.accent} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w.key} style={styles.weekday}>
                {w.label}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (!day) {
                return <View key={`pad-${index}`} style={styles.cellEmpty} />;
              }
              const dayNum = Number(day.date.slice(-2));
              const isToday = day.date === todayIso;
              const isSelected = day.date === selectedDate;
              const isOtherMonth = !day.date.startsWith(monthKey);
              const hasActivity =
                day.transactions.length > 0 ||
                day.scheduled.length > 0 ||
                day.includesProjection;
              const metrics = dayCellMetrics.get(day.date);
              const displayValue = metrics?.displayValue ?? 0;
              const hasWarning = metrics?.hasWarning ?? false;

              return (
                <NekoCalendarDayCell
                  key={day.date}
                  dayNum={dayNum}
                  displayValue={displayValue}
                  viewMode={viewMode}
                  isToday={isToday}
                  isSelected={isSelected}
                  isOtherMonth={isOtherMonth}
                  hasWarning={hasWarning}
                  hasActivity={hasActivity}
                  onPress={() => {
                    setSelectedDate(day.date);
                    if (!day.date.startsWith(monthKey)) {
                      setMonthKey(day.date.slice(0, 7));
                    }
                  }}
                />
              );
            })}
          </View>
        </View>

        {selectedDate ? (
          <NekoCalendarBalanceCard
            scopeFilter={scopeFilter}
            date={selectedDate}
            breakdown={breakdown}
            expanded={balanceExpanded}
            onToggle={() => setBalanceExpanded((e) => !e)}
          />
        ) : null}

        {selectedDate && proximoDay.length ? (
          <NekoCalendarUpcomingBlock
            items={proximoDay}
            accountBalances={selectedDayAccountBalances}
            expanded={proximoExpanded}
            onToggle={() => setProximoExpanded((e) => !e)}
          />
        ) : null}

        {selectedDate && proximoDay.length === 0 && pagadoCount === 0 ? (
          <View style={styles.emptyDay}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyDayText}>Sin entradas aún</Text>
          </View>
        ) : null}

        {selected && pagadoCount > 0 ? (
          <View style={styles.pagadoBlock}>
            <Pressable style={styles.pagadoHead} onPress={() => setPagadoExpanded((e) => !e)}>
              <Text style={styles.pagadoTitle}>Pagado · {pagadoCount}</Text>
              <Ionicons
                name={pagadoExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
            {pagadoExpanded
              ? pagadoTransactions.map((t) => (
                  <Pressable key={t.id} onPress={() => setEditing(t)}>
                    <NekoCalendarTxCard
                      item={t}
                      runningBalance={nekoBalanceAfterTx(transactions, accounts, t.id)}
                      onDelete={() => void removeTransaction(t.id)}
                    />
                  </Pressable>
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>


      <NekoMonthSummarySheet
        visible={summaryOpen}
        monthKey={monthKey}
        transactions={transactions}
        onClose={() => setSummaryOpen(false)}
      />

      <NekoInicioFiltersSheet
        visible={filtersOpen}
        accounts={accounts}
        value={inicioFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => void setInicioFilters(next)}
      />

      <TransactionEditModal
        visible={editing !== null}
        transaction={editing}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  segmentWrap: { flex: 1 },
  iconGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  scopeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeBtnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellEmpty: { width: `${100 / 7}%`, minHeight: 56 },
  emptyDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyDayText: { color: colors.textMuted, fontSize: 14, fontFamily: 'HankenGrotesk-Medium' },
  pagadoBlock: { gap: 8, marginTop: 4 },
  pagadoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagadoTitle: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
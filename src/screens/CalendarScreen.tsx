import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '../components/TransactionRow';
import {
  buildMonthCalendar,
  formatCompactMoney,
  formatMonthTitle,
  monthKeyFromDate,
  shiftMonth,
  type DaySnapshot,
} from '../domain/calendar';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

export function CalendarScreen() {
  const { transactions, accountNames, scheduledPayments } = useTransactions();
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(new Date()));
  const [accountFilter, setAccountFilter] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { days, startPadding } = useMemo(
    () => buildMonthCalendar(transactions, monthKey, accountFilter, scheduledPayments),
    [transactions, monthKey, accountFilter, scheduledPayments],
  );

  const selected = selectedDate ? days.find((d) => d.date === selectedDate) : undefined;
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells: (DaySnapshot | null)[] = [
    ...Array.from({ length: startPadding }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Calendario</Text>
        <Text style={styles.subtitle}>
          Saldo al cierre de cada día. Los días futuros incluyen tu Plan (quincena, pagos fijos).
        </Text>

        <View style={styles.monthRow}>
          <Pressable style={styles.monthBtn} onPress={() => setMonthKey((m) => shiftMonth(m, -1))}>
            <Text style={styles.monthBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{formatMonthTitle(monthKey)}</Text>
          <Pressable style={styles.monthBtn} onPress={() => setMonthKey((m) => shiftMonth(m, 1))}>
            <Text style={styles.monthBtnText}>›</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
          <Pressable
            style={[styles.accountChip, !accountFilter && styles.accountChipActive]}
            onPress={() => setAccountFilter(undefined)}
          >
            <Text style={[styles.accountChipText, !accountFilter && styles.accountChipTextActive]}>
              Todas las cuentas
            </Text>
          </Pressable>
          {accountNames.map((name) => (
            <Pressable
              key={name}
              style={[styles.accountChip, accountFilter === name && styles.accountChipActive]}
              onPress={() => setAccountFilter(name)}
            >
              <Text
                style={[
                  styles.accountChipText,
                  accountFilter === name && styles.accountChipTextActive,
                ]}
              >
                {name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.legend}>
          <LegendDot color={colors.income} label="Ingreso" />
          <LegendDot color={colors.expense} label="Gasto" />
          <LegendDot color="#94a3b8" label="Transf." />
          <LegendDot color={colors.accent} label="Plan" />
          <Text style={styles.legendItalic}>Cursiva = proyección</Text>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, index) => {
            if (!day) {
              return <View key={`pad-${index}`} style={styles.cell} />;
            }
            const dayNum = Number(day.date.slice(-2));
            const isToday = day.date === todayIso;
            const isSelected = day.date === selectedDate;
            const isFuture = day.date > todayIso;
            const isProjected = day.date >= todayIso;
            const positive = day.balance >= 0;

            return (
              <Pressable
                key={day.date}
                style={[
                  styles.cell,
                  isToday && styles.cellToday,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text style={[styles.cellDay, isToday && styles.cellDayToday]}>{dayNum}</Text>
                <Text
                  style={[
                    styles.cellBalance,
                    positive ? styles.balancePositive : styles.balanceNegative,
                    isProjected && styles.cellBalanceProjected,
                  ]}
                  numberOfLines={1}
                >
                  {formatCompactMoney(day.balance)}
                  {isFuture ? '›' : ''}
                </Text>
                {(day.transactions.length > 0 || day.scheduled.length > 0) ? (
                  <View style={styles.dotRow}>
                    {day.transactions.length + day.scheduled.length > 3 ? (
                      <Text style={styles.dotCount}>
                        {day.transactions.length + day.scheduled.length}
                      </Text>
                    ) : (
                      day.transactions.map((t) => (
                        <View
                          key={t.id}
                          style={[
                            styles.dot,
                            t.kind === 'income'
                              ? styles.dotIncome
                              : t.kind === 'transfer'
                                ? styles.dotTransfer
                                : styles.dotExpense,
                          ]}
                        />
                      ))
                    )}
                    {day.scheduled.length > 0 && day.transactions.length < 3
                      ? day.scheduled.slice(0, 3 - day.transactions.length).map((s) => (
                          <View key={s.id} style={[styles.dot, styles.dotScheduled]} />
                        ))
                      : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.detailCard}>
          {selected ? (
            <>
              <Text style={styles.detailTitle}>{formatShortDate(selected.date)}</Text>
              <Text style={styles.detailBalance}>
                Saldo: {formatCurrency(selected.balance)}
                {selected.date >= todayIso ? ' (con proyección)' : ''}
              </Text>
              {selected.scheduled.length > 0 ? (
                <View style={styles.scheduledBlock}>
                  <Text style={styles.scheduledTitle}>Programado</Text>
                  {selected.scheduled.map((s) => (
                    <Text key={s.id} style={styles.scheduledLine}>
                      {s.title}: {formatCurrency(Math.abs(s.signedAmount))}
                    </Text>
                  ))}
                </View>
              ) : null}
              {selected.transactions.length === 0 && selected.scheduled.length === 0 ? (
                <Text style={styles.detailEmpty}>Sin movimientos este día</Text>
              ) : selected.transactions.length > 0 ? (
                <View style={styles.detailList}>
                  {selected.transactions.map((t) => (
                    <TransactionRow key={t.id} item={t} />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.detailHint}>Toca un día para ver entradas, salidas y saldo.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  monthBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnText: { color: colors.text, fontSize: 24, fontWeight: '600' },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  accountScroll: { flexGrow: 0, marginTop: 4 },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  accountChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  accountChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  accountChipTextActive: { color: colors.white },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  legendItalic: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  weekdayRow: { flexDirection: 'row', marginTop: 8 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 72,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cellToday: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  cellSelected: { borderColor: colors.white },
  cellDay: { color: colors.text, fontSize: 13, fontWeight: '700' },
  cellDayToday: { color: colors.accent },
  cellBalance: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  balancePositive: { color: colors.income },
  balanceNegative: { color: colors.expense },
  cellBalanceProjected: { opacity: 0.85, fontStyle: 'italic' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 4, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotIncome: { backgroundColor: colors.income },
  dotExpense: { backgroundColor: colors.expense },
  dotTransfer: { backgroundColor: '#94a3b8' },
  dotScheduled: { backgroundColor: colors.accent },
  scheduledBlock: { gap: 4, marginTop: 4 },
  scheduledTitle: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  scheduledLine: { color: colors.textMuted, fontSize: 13 },
  dotCount: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  detailCard: {
    marginTop: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  detailTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  detailBalance: { color: colors.textMuted, fontSize: 14 },
  detailEmpty: { color: colors.textMuted, fontSize: 14 },
  detailHint: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  detailList: { gap: 8 },
});
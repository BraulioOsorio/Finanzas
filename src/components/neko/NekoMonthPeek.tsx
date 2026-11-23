import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { accountDefByName } from '../../domain/accounts/resolveAccounts';
import { topCategorySpending } from '../../domain/categorySpend';
import type { UpcomingItem } from '../../domain/upcoming';
import type { AccountDef, ScheduledPayment, Transaction } from '../../types';
import type { MonthFlow } from '../../domain/summaries';
import { colors, tokens } from '../../theme';
import { formatCurrency, formatHistorySectionTitle } from '../../utils/format';

const DOT_COLORS = [colors.income, '#f472b6', colors.accent, '#fbbf24', '#94a3b8'];

type Props = {
  monthKey: string;
  monthFlow: MonthFlow;
  transactions: Transaction[];
  accounts: AccountDef[];
  scheduledPayments: ScheduledPayment[];
  upcomingItems: UpcomingItem[];
};

function dotColor(index: number): string {
  return DOT_COLORS[index % DOT_COLORS.length];
}

function creditCardExpenseMonth(
  transactions: Transaction[],
  accounts: AccountDef[],
  monthKey: string,
): number {
  let total = 0;
  for (const t of transactions) {
    if (t.kind !== 'expense' || !t.postedDate.startsWith(monthKey)) {
      continue;
    }
    const def = accountDefByName(accounts, t.account);
    if (def?.kind === 'credit') {
      total += t.amount;
    }
  }
  return total;
}

function nextIncomePlan(
  upcoming: UpcomingItem[],
  scheduled: ScheduledPayment[],
): { title: string; amount: number; date: string; account: string } | null {
  const fromUpcoming = upcoming.find((u) => u.signedAmount > 0);
  if (fromUpcoming) {
    return {
      title: fromUpcoming.title,
      amount: fromUpcoming.signedAmount,
      date: fromUpcoming.date.slice(0, 10),
      account: fromUpcoming.account,
    };
  }
  const inc = scheduled.find((s) => s.active && s.kind === 'income');
  if (inc) {
    return {
      title: inc.title,
      amount: inc.amount,
      date: inc.startDate,
      account: inc.account,
    };
  }
  return null;
}

/** Carrusel horizontal «Este mes» (como NEKO). */
export function NekoMonthPeek({
  monthKey,
  monthFlow,
  transactions,
  accounts,
  scheduledPayments,
  upcomingItems,
}: Props) {
  const topCats = topCategorySpending(transactions, monthKey, 3);
  const cardSpend = creditCardExpenseMonth(transactions, accounts, monthKey);
  const cardTopCats = topCategorySpending(
    transactions.filter((t) => {
      const def = accountDefByName(accounts, t.account);
      return def?.kind === 'credit';
    }),
    monthKey,
    2,
  );
  const nextIncome = nextIncomePlan(upcomingItems, scheduledPayments);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Este mes</Text>
        <Ionicons name="analytics-outline" size={20} color={colors.textMuted} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Ionicons name="cash-outline" size={20} color={colors.income} />
            </View>
            <View style={styles.cardTopText}>
              <Text style={styles.cardHint}>Flujo de efectivo</Text>
              <Text style={[styles.cardAmount, monthFlow.net < 0 && styles.expenseAmount]}>
                {formatCurrency(monthFlow.net)}
              </Text>
            </View>
            {monthFlow.net < 0 ? (
              <Ionicons name="arrow-down" size={18} color={colors.expense} />
            ) : (
              <Ionicons name="arrow-up" size={18} color={colors.income} />
            )}
          </View>
          <View style={styles.divider} />
          <Text style={styles.cardSub}>Resumen</Text>
          <View style={styles.splitMini}>
            <View style={styles.splitCol}>
              <Ionicons name="add-circle-outline" size={14} color={colors.income} />
              <Text style={styles.lineMuted}>Ingreso</Text>
              <Text style={[styles.line, { color: colors.income }]}>
                {formatCurrency(monthFlow.income)}
              </Text>
            </View>
            <View style={styles.splitCol}>
              <Ionicons name="remove-circle-outline" size={14} color={colors.expense} />
              <Text style={styles.lineMuted}>Egreso</Text>
              <Text style={[styles.line, { color: colors.expense }]}>
                {formatCurrency(monthFlow.expense)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Ionicons name="card-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.cardTopText}>
              <Text style={styles.cardHint}>Gasto con tarjetas</Text>
              <Text style={styles.cardAmount}>{formatCurrency(cardSpend)}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>Gastos principales</Text>
          {cardTopCats.length ? (
            cardTopCats.map((c, i) => (
              <View key={c.key} style={styles.dotRow}>
                <View style={[styles.dot, { backgroundColor: dotColor(i + 1) }]} />
                <Text style={styles.line} numberOfLines={1}>
                  {c.category || c.group} {formatCurrency(c.spent)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.lineMuted}>Sin compras en crédito</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Ionicons name="bag-handle-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.cardTopText}>
              <Text style={styles.cardHint}>Gasto general</Text>
              <Text style={styles.cardAmount}>{formatCurrency(monthFlow.expense)}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>Gastos principales</Text>
          {topCats.length ? (
            topCats.map((c, i) => (
              <View key={c.key} style={styles.dotRow}>
                <View style={[styles.dot, { backgroundColor: dotColor(i) }]} />
                <Text style={styles.line} numberOfLines={1}>
                  {c.category || c.group} {formatCurrency(c.spent)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.lineMuted}>Sin gastos en {monthKey}</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Ionicons name="wallet-outline" size={20} color={colors.income} />
            </View>
            <View style={styles.cardTopText}>
              <Text style={styles.cardHint}>Ingreso recibido</Text>
              <Text style={[styles.cardAmount, { color: colors.income }]}>
                {formatCurrency(monthFlow.income)}
              </Text>
            </View>
          </View>
          {nextIncome ? (
            <>
              <View style={styles.divider} />
              <View style={styles.proximoRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={styles.cardSub}>Próximo</Text>
              </View>
              <View style={styles.incomeNext}>
                <Text style={styles.line} numberOfLines={1}>
                  {nextIncome.title}
                </Text>
                <Text style={[styles.line, { color: colors.income, fontWeight: '700' }]}>
                  {formatCurrency(nextIncome.amount)}
                </Text>
              </View>
              <Text style={styles.lineMuted}>
                {formatHistorySectionTitle(nextIncome.date)} · {nextIncome.account}
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...tokens.font.title, fontSize: 18, color: colors.text },
  row: { gap: 12, paddingRight: 8 },
  card: {
    width: 248,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTopText: { flex: 1, gap: 2 },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHint: { color: colors.textMuted, fontSize: 12 },
  cardAmount: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
  },
  expenseAmount: { color: colors.expense },
  cardSub: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { color: colors.text, fontSize: 12, flex: 1 },
  lineMuted: { color: colors.textMuted, fontSize: 11 },
  splitMini: { flexDirection: 'row', gap: 16 },
  splitCol: { flex: 1, gap: 2 },
  proximoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  incomeNext: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountBalanceRow } from '../components/AccountBalanceRow';
import { BudgetProgressList } from '../components/BudgetProgressList';
import { useTransactions } from '../context/TransactionsContext';
import { topCategorySpending } from '../domain/categorySpend';
import { computeNetWorth } from '../domain/netWorth';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

export function InformeScreen() {
  const {
    loading,
    monthFlow,
    accountBalances,
    creditCardSummaries,
    debtSummaries,
    budgetProgress,
    transactions,
    accounts,
  } = useTransactions();

  const net = useMemo(
    () => computeNetWorth(accounts, accountBalances, creditCardSummaries, debtSummaries),
    [accounts, accountBalances, creditCardSummaries, debtSummaries],
  );

  const topCats = useMemo(
    () => topCategorySpending(transactions, monthFlow.monthKey, 10),
    [transactions, monthFlow.monthKey],
  );

  const maxCat = topCats[0]?.spent ?? 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Informe</Text>
        <Text style={styles.subtitle}>
          Vista tipo Neko: patrimonio, mes actual ({monthFlow.monthKey}) y dónde se va el dinero.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patrimonio (orientativo)</Text>
          {loading ? (
            <Text style={styles.meta}>Cargando…</Text>
          ) : (
            <>
              <Row label="Total en cuentas" value={formatCurrency(net.totalInAccounts)} />
              <Row label="Disponible líquido" value={formatCurrency(net.liquid)} accent />
              <Row label="Usado en tarjetas" value={formatCurrency(net.creditOwed)} negative />
              <Row label="Buckets deuda" value={formatCurrency(net.debtBuckets)} negative />
              <Row
                label="Líquido neto (sin deuda tarjeta)"
                value={formatCurrency(net.netLiquid)}
                bold
              />
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flujo del mes</Text>
          <Row label="Ingresos" value={formatCurrency(monthFlow.income)} accent />
          <Row label="Gastos" value={formatCurrency(monthFlow.expense)} negative />
          <Row
            label="Neto"
            value={formatCurrency(monthFlow.net)}
            bold
            negative={monthFlow.net < 0}
          />
        </View>

        <Text style={styles.section}>Gastos por categoría</Text>
        {topCats.length === 0 ? (
          <Text style={styles.meta}>Sin gastos este mes.</Text>
        ) : (
          topCats.map((row) => (
            <View key={row.key} style={styles.catRow}>
              <View style={styles.catLead}>
                <Text style={styles.catLabel} numberOfLines={1}>
                  {row.label}
                </Text>
                <Text style={styles.catMeta}>{row.count} movimientos</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${Math.min(100, (row.spent / maxCat) * 100)}%` }]}
                />
              </View>
              <Text style={styles.catAmount}>{formatCurrency(row.spent)}</Text>
            </View>
          ))
        )}

        <BudgetProgressList items={budgetProgress} />

        <Text style={styles.section}>Todas las cuentas</Text>
        <View style={styles.list}>
          {accountBalances.map((item) => (
            <AccountBalanceRow key={item.account} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  accent,
  negative,
  bold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          accent && styles.income,
          negative && styles.expense,
          bold && styles.rowBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textMuted, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: colors.textMuted, fontSize: 13, flex: 1 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowBold: { fontWeight: '800', color: colors.text },
  income: { color: colors.income },
  expense: { color: colors.expense },
  catRow: { gap: 6, marginBottom: 10 },
  catLead: { flexDirection: 'row', justifyContent: 'space-between' },
  catLabel: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  catMeta: { color: colors.textMuted, fontSize: 11 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.accent },
  catAmount: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  list: { gap: 8 },
});
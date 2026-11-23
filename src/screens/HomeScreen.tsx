import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

export function HomeScreen() {
  const { loading, balance, totalIncome, totalExpense, transactions, transferCount } =
    useTransactions();
  const recent = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Tu dinero, al día</Text>
        <Text style={styles.subtitle}>Resumen personal en tu móvil</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
          ) : (
            <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          )}
          {transferCount > 0 ? (
            <Text style={styles.transferHint}>
              {transferCount} transferencias internas (no suman al saldo)
            </Text>
          ) : null}
          <View style={styles.splitRow}>
            <View style={[styles.pill, styles.pillIncome]}>
              <Text style={styles.pillLabel}>Ingresos</Text>
              <Text style={styles.pillValueIncome}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={[styles.pill, styles.pillExpense]}>
              <Text style={styles.pillLabel}>Gastos</Text>
              <Text style={styles.pillValueExpense}>{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>
        {loading ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aún no hay movimientos</Text>
            <Text style={styles.emptyBody}>
              Ve a la pestaña Registrar para anotar tu primer ingreso o gasto.
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
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: -8 },
  balanceCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  balanceLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  balanceValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  transferHint: { color: colors.textMuted, fontSize: 12, marginTop: 14, lineHeight: 16 },
  splitRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  pill: { flex: 1, borderRadius: 14, padding: 12 },
  pillIncome: { backgroundColor: colors.incomeMuted },
  pillExpense: { backgroundColor: colors.expenseMuted },
  pillLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pillValueIncome: { color: colors.income, fontSize: 16, fontWeight: '700', marginTop: 4 },
  pillValueExpense: { color: colors.expense, fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
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
});
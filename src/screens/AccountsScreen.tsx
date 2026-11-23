import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountBalanceRow } from '../components/AccountBalanceRow';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { formatCurrency } from '../utils/format';

export function AccountsScreen() {
  const { loading, accountBalances, totalInAccounts, liquidAvailable } = useTransactions();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Cuentas</Text>
        <Text style={styles.subtitle}>Saldo por cuenta (como en Neko, según movimientos importados)</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total en cuentas</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalInAccounts)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Disponible para gastar</Text>
          <Text style={styles.summaryValueSmall}>{formatCurrency(liquidAvailable)}</Text>
          <Text style={styles.hint}>Bancos y efectivo, sin deudas</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textMuted} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={accountBalances}
          keyExtractor={(item) => item.account}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin cuentas todavía</Text>
              <Text style={styles.emptyBody}>
                Importa tu CSV de Neko o registra un movimiento con cuenta.
              </Text>
            </View>
          }
          renderItem={({ item }) => <AccountBalanceRow item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 6 },
  summaryValueSmall: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 6 },
  hint: { color: colors.textMuted, fontSize: 10, marginTop: 4, lineHeight: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.textMuted, fontSize: 14, marginTop: 8, lineHeight: 20 },
});
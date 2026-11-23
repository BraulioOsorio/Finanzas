import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountBalanceRow } from '../components/AccountBalanceRow';
import { AccountEditorModal } from '../components/AccountEditorModal';
import { accountDefByName } from '../domain/accounts/resolveAccounts';
import { computeAccountBalances } from '../domain/summaries';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { AccountDef } from '../types';
import { formatCurrency } from '../utils/format';

export function AccountsScreen() {
  const {
    loading,
    accountBalances,
    totalInAccounts,
    liquidAvailable,
    accounts,
    transactions,
  } = useTransactions();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AccountDef | null>(null);
  const [draftName, setDraftName] = useState<string | undefined>();

  const rows = useMemo(() => {
    const balances = computeAccountBalances(transactions);
    const balanceByName = new Map(balances.map((b) => [b.account, b]));
    const names = new Set<string>();
    for (const a of accounts) {
      if (!a.archived) {
        names.add(a.name.trim());
      }
    }
    for (const b of balances) {
      names.add(b.account);
    }

    return [...names]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((name) => {
        const bal = balanceByName.get(name) ?? { account: name, balance: 0, movementCount: 0 };
        const def = accountDefByName(accounts, name);
        return { balance: bal, def };
      });
  }, [accounts, transactions]);

  const openNew = () => {
    setEditing(null);
    setDraftName(undefined);
    setEditorOpen(true);
  };

  const openEdit = (name: string) => {
    const def = accountDefByName(accounts, name);
    setEditing(def ?? null);
    setDraftName(def ? undefined : name);
    setEditorOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Cuentas</Text>
        <Text style={styles.subtitle}>
          Registra bancos, efectivo, tarjetas de crédito y préstamos. El saldo sale de tus movimientos.
        </Text>
        <Pressable style={styles.addBtn} onPress={openNew}>
          <Text style={styles.addBtnText}>+ Nueva cuenta</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total en cuentas</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalInAccounts)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Disponible para gastar</Text>
          <Text style={styles.summaryValueSmall}>{formatCurrency(liquidAvailable)}</Text>
          <Text style={styles.hint}>Solo cuentas marcadas como líquidas</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textMuted} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.balance.account}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin cuentas todavía</Text>
              <Text style={styles.emptyBody}>
                Crea tu primera cuenta o importa el CSV de Neko.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AccountBalanceRow
              item={item.balance}
              onPress={() => openEdit(item.balance.account)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      <AccountEditorModal
        visible={editorOpen}
        editing={editing}
        initialName={draftName}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
          setDraftName(undefined);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  addBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  addBtnText: { color: colors.white, fontWeight: '700' },
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
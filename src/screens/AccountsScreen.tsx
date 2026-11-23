import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountEditorModal } from '../components/AccountEditorModal';
import { NekoAccountGroupList } from '../components/neko/NekoAccountGroupList';
import { NekoBalanceStrip } from '../components/neko/NekoBalanceStrip';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { NekoSegmentedControl } from '../components/neko/NekoSegmentedControl';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { computeNekoAccountBalances, hasNekoLedger } from '../domain/nekoLedger';
import { useRootNav } from '../navigation/useRootNav';
import { nekoSummaryToday } from '../domain/nekoDisplay';
import { accountDefById } from '../domain/accounts/resolveAccounts';
import type { NekoAccountRow } from '../components/neko/NekoAccountGroupList';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { AccountDef } from '../types';

type Scope = 'all' | 'debit' | 'credit';

export function AccountsScreen() {
  const { loading, accounts, transactions, nekoSummary } = useTransactions();
  const { openMas } = useRootNav();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AccountDef | null>(null);
  const [draftName, setDraftName] = useState<string | undefined>();
  const [scope, setScope] = useState<Scope>('all');

  const todayIso = new Date().toISOString().slice(0, 10);

  const summary = useMemo(
    () =>
      nekoSummary ??
      nekoSummaryToday(transactions, accounts, todayIso, { preserveDuplicateRows: true }),
    [nekoSummary, transactions, accounts, todayIso],
  );

  const balanceRows = useMemo(() => {
    const list = hasNekoLedger(accounts)
      ? computeNekoAccountBalances(transactions, accounts)
      : [];
    return list;
  }, [accounts, transactions]);

  const mapRow = (r: { name: string; balance: number; accountId?: string }): NekoAccountRow => ({
    name: r.name,
    balance: r.balance,
    accountId: r.accountId,
  });

  const debitRows = useMemo(() => summary.debitAccounts.map(mapRow), [summary.debitAccounts]);
  const creditRows = useMemo(() => summary.creditAccounts.map(mapRow), [summary.creditAccounts]);
  const loanRows = useMemo(() => summary.loanAccounts.map(mapRow), [summary.loanAccounts]);

  const loanTotal = loanRows.reduce((s, r) => s + r.balance, 0);

  const openNew = () => {
    setEditing(null);
    setDraftName(undefined);
    setEditorOpen(true);
  };

  const openEdit = (row: NekoAccountRow) => {
    const def = row.accountId ? accountDefById(accounts, row.accountId) : undefined;
    setEditing(def ?? null);
    setDraftName(def ? undefined : row.name);
    setEditorOpen(true);
  };

  const showDebit = scope === 'all' || scope === 'debit';
  const showCredit = scope === 'all' || scope === 'credit';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_BOTTOM_INSET + 72 }]}
        showsVerticalScrollIndicator={false}
      >
        <NekoScreenHeader
          title="Cuentas"
          actions={[
            {
              icon: 'add-outline',
              accessibilityLabel: 'Nueva cuenta',
              onPress: openNew,
            },
            {
              icon: 'menu-outline',
              accessibilityLabel: 'Más opciones',
              onPress: () => openMas(),
            },
          ]}
        />

        <NekoBalanceStrip summary={summary} />

        <NekoSegmentedControl
          value={scope}
          onChange={(v) => setScope(v as Scope)}
          options={[
            { value: 'all', label: 'Todo' },
            { value: 'debit', label: 'Débito' },
            { value: 'credit', label: 'Crédito' },
          ]}
        />

        {loading ? (
          <ActivityIndicator color={colors.textMuted} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.groups}>
            {showDebit ? (
              <NekoAccountGroupList
                title="Cuentas de débito"
                icon="business-outline"
                total={summary.liquidTotal}
                rows={debitRows}
                onPressRow={openEdit}
              />
            ) : null}
            {showCredit ? (
              <NekoAccountGroupList
                title="Tarjetas de crédito"
                icon="card-outline"
                total={summary.creditTotal}
                totalColor="#f5a05c"
                rows={creditRows}
                onPressRow={openEdit}
              />
            ) : null}
            {showDebit && loanRows.length ? (
              <NekoAccountGroupList
                title="Préstamos y deudas"
                icon="document-text-outline"
                total={loanTotal}
                totalColor={colors.textMuted}
                rows={loanRows}
                onPressRow={openEdit}
              />
            ) : null}
            {!hasNekoLedger(accounts) && balanceRows.length > 0 ? (
              <Text style={styles.hintImport}>
                Importa «NEKO My Data» (SQLite) con Reemplazar para ver saldos idénticos a NEKO.
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

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
  content: { paddingHorizontal: 16, gap: 14, paddingTop: 4 },
  groups: { gap: 20, marginTop: 8 },
  hintImport: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontFamily: 'HankenGrotesk-Regular',
  },
});
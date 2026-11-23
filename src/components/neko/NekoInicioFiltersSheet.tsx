import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  groupAccountsForFilters,
  INICIO_TX_FILTER_ROWS,
  setAllAccountsEnabled,
  toggleAccountInFilters,
  toggleTxFilter,
  type InicioDashboardFilters,
} from '../../domain/dashboardFilters';
import type { AccountDef } from '../../types';
import { colors, tokens } from '../../theme';
import { NekoBottomSheet } from './NekoBottomSheet';
import { NekoSheetTabs } from './NekoSheetTabs';
import { NekoSwitch } from './NekoSwitch';

type Props = {
  visible: boolean;
  accounts: AccountDef[];
  value: InicioDashboardFilters;
  onClose: () => void;
  onApply: (next: InicioDashboardFilters) => void;
};

function accountIcon(kind: AccountDef['kind']): keyof typeof Ionicons.glyphMap {
  switch (kind) {
    case 'cash':
      return 'cash-outline';
    case 'credit':
      return 'card-outline';
    case 'savings':
      return 'wallet-outline';
    case 'loan':
      return 'document-text-outline';
    default:
      return 'business-outline';
  }
}

function AccountSection({
  title,
  rows,
  draft,
  setDraft,
}: {
  title: string;
  rows: AccountDef[];
  draft: InicioDashboardFilters;
  setDraft: (d: InicioDashboardFilters) => void;
}) {
  if (!rows.length) {
    return null;
  }
  const names = rows.map((a) => a.name);
  const allOn = names.every((n) =>
    draft.disabledAccounts.every((d) => d.toLowerCase() !== n.toLowerCase()),
  );
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <NekoSwitch
          value={allOn}
          onValueChange={(v) => setDraft(setAllAccountsEnabled(names, v, draft))}
        />
      </View>
      {rows.map((a, index) => {
        const enabled = !draft.disabledAccounts.some(
          (d) => d.toLowerCase() === a.name.toLowerCase(),
        );
        return (
          <View key={`${a.id}-${index}`} style={styles.row}>
            <Ionicons name={accountIcon(a.kind)} size={20} color={colors.textMuted} />
            <Text style={styles.rowLabel}>{a.name}</Text>
            <NekoSwitch
              value={enabled}
              onValueChange={(v) => setDraft(toggleAccountInFilters(a.name, v, draft))}
            />
          </View>
        );
      })}
    </View>
  );
}

export function NekoInicioFiltersSheet({ visible, accounts, value, onClose, onApply }: Props) {
  const [tab, setTab] = useState<'cuentas' | 'transacciones'>('cuentas');
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const { debit, credit } = groupAccountsForFilters(accounts);

  return (
    <NekoBottomSheet visible={visible} title="Filtros" onClose={onClose}>
      <NekoSheetTabs
        tabs={[
          { id: 'cuentas', label: 'Cuentas' },
          { id: 'transacciones', label: 'Transacciones' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as 'cuentas' | 'transacciones')}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'cuentas' ? (
          <>
            <AccountSection title="Cuentas de débito" rows={debit} draft={draft} setDraft={setDraft} />
            <AccountSection title="Tarjetas de crédito" rows={credit} draft={draft} setDraft={setDraft} />
          </>
        ) : (
          <View style={styles.section}>
            {INICIO_TX_FILTER_ROWS.map((row) => {
              const on =
                row.key === 'todos'
                  ? draft.txFilters.includes('todos')
                  : draft.txFilters.includes(row.key);
              return (
                <View key={row.key} style={styles.row}>
                  {row.key === 'todos' ? (
                    <View style={styles.rowIconSpacer} />
                  ) : (
                    <Ionicons name={row.icon} size={20} color={colors.textMuted} />
                  )}
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <NekoSwitch
                    value={on}
                    onValueChange={() => setDraft(toggleTxFilter(row.key, draft))}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Pressable
        style={styles.apply}
        onPress={() => {
          onApply(draft);
          onClose();
        }}
      >
        <Text style={styles.applyText}>Aplicar</Text>
      </Pressable>
    </NekoBottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 420, marginBottom: 12 },
  section: { gap: 4, marginBottom: 12 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    ...tokens.font.section,
    color: colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500', fontFamily: 'HankenGrotesk-Regular' },
  rowIconSpacer: { width: 20 },
  apply: {
    backgroundColor: colors.accent,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  applyText: { color: '#0b1118', fontSize: 17, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
});
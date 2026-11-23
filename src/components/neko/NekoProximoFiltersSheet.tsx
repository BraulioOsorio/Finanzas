import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activeAccountNames } from '../../domain/accounts/resolveAccounts';
import {
  clearProximoFilters,
  periodLabel,
  PROXIMO_TYPE_CHIPS,
  toggleProximoAccount,
  toggleProximoNekoType,
  type ProximoFilters,
  type ProximoPeriod,
  type TriState,
} from '../../domain/dashboardFilters';
import type { AccountDef, Transaction } from '../../types';
import { colors, tokens } from '../../theme';
import { NekoBottomSheet } from './NekoBottomSheet';
import { NekoProximoCategorySheet } from './NekoProximoCategorySheet';
import { NekoSegmentedControl } from './NekoSegmentedControl';
import { NekoSheetTabs } from './NekoSheetTabs';
import type { CategoryTreeMap } from '../../domain/nekoCatalog';

const PERIODS: ProximoPeriod[] = ['month', 'year', 'days_30', 'days_90'];

const TRI_OPTS: { value: TriState; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
];

type Props = {
  visible: boolean;
  accounts: AccountDef[];
  transactions: Transaction[];
  categoryTree: CategoryTreeMap;
  value: ProximoFilters;
  onClose: () => void;
  onApply: (next: ProximoFilters) => void;
};

export function NekoProximoFiltersSheet({
  visible,
  accounts,
  transactions,
  categoryTree,
  value,
  onClose,
  onApply,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [tab, setTab] = useState<'general' | 'categorias'>('general');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setTab('general');
    }
  }, [visible, value]);

  const activeNames = activeAccountNames(accounts, transactions);
  const inactiveNames = useMemo(
    () =>
      accounts
        .filter((a) => a.archived)
        .map((a) => a.name)
        .sort((a, b) => a.localeCompare(b, 'es')),
    [accounts],
  );

  const displayAccounts = [
    ...activeNames,
    ...(draft.includeInactiveAccounts ? inactiveNames : []),
  ];

  const accountsAll =
    !draft.accounts.length && !draft.account;

  return (
    <>
      <NekoBottomSheet visible={visible} title="Próximo" onClose={onClose}>
        <View style={styles.head}>
          <Text style={styles.sheetSection}>Próximo</Text>
          <Pressable
            onPress={() => setDraft(clearProximoFilters())}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>Limpiar</Text>
          </Pressable>
        </View>

        <NekoSheetTabs
          tabs={[
            { id: 'general', label: 'General' },
            { id: 'categorias', label: 'Categorías' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as 'general' | 'categorias')}
        />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'general' ? (
            <>
              <Text style={styles.label}>Periodo</Text>
              <Pressable style={styles.dropdown} onPress={() => setPeriodOpen((o) => !o)}>
                <Text style={styles.dropdownText}>{periodLabel(draft.period)}</Text>
                <Ionicons
                  name={periodOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              {periodOpen ? (
                <View style={styles.periodList}>
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p}
                      style={styles.periodRow}
                      onPress={() => {
                        setDraft({ ...draft, period: p });
                        setPeriodOpen(false);
                      }}
                    >
                      <Text style={[styles.periodText, draft.period === p && styles.periodOn]}>
                        {periodLabel(p)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Text style={[styles.label, styles.labelGap]}>Cuentas</Text>
              <View style={styles.chipWrap}>
                <Chip
                  label="Todos"
                  active={accountsAll}
                  onPress={() => setDraft({ ...draft, accounts: [], account: '' })}
                />
                {displayAccounts.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    active={draft.accounts.some((a) => a.toLowerCase() === name.toLowerCase())}
                    onPress={() => {
                      if (accountsAll) {
                        setDraft({ ...draft, accounts: [name], account: name });
                      } else {
                        setDraft(toggleProximoAccount(name, draft));
                      }
                    }}
                  />
                ))}
              </View>

              <Pressable style={styles.inactiveRow} onPress={() => setInactiveOpen((o) => !o)}>
                <Text style={styles.inactiveLabel}>Inactivas</Text>
                <Ionicons
                  name={inactiveOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              {inactiveOpen ? (
                <View style={styles.inactiveBody}>
                  <Pressable
                    onPress={() =>
                      setDraft({ ...draft, includeInactiveAccounts: !draft.includeInactiveAccounts })
                    }
                    style={styles.inactiveToggle}
                  >
                    <Text style={styles.inactiveHint}>
                      {draft.includeInactiveAccounts
                        ? 'Ocultar cuentas archivadas en chips'
                        : 'Mostrar cuentas archivadas en chips'}
                    </Text>
                  </Pressable>
                  {!inactiveNames.length ? (
                    <Text style={styles.inactiveHint}>No hay cuentas inactivas.</Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={[styles.label, styles.labelGap]}>Tipos de transacción</Text>
              <View style={styles.chipWrap}>
                {PROXIMO_TYPE_CHIPS.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    active={
                      type === 'Todos'
                        ? draft.nekoTypes.includes('Todos')
                        : draft.nekoTypes.includes(type)
                    }
                    onPress={() => setDraft(toggleProximoNekoType(type, draft))}
                  />
                ))}
              </View>

              <Text style={[styles.label, styles.labelGap]}>Recurrente</Text>
              <NekoSegmentedControl
                options={TRI_OPTS}
                value={draft.recurrent}
                onChange={(v) => setDraft({ ...draft, recurrent: v })}
              />

              <Text style={[styles.label, styles.labelGap]}>Pago automático</Text>
              <NekoSegmentedControl
                options={TRI_OPTS}
                value={draft.autoPay}
                onChange={(v) => setDraft({ ...draft, autoPay: v })}
              />
            </>
          ) : (
            <View style={styles.catTab}>
              <Text style={styles.catHint}>
                Abre el selector con grupos y subcategorías, como en NEKO.
              </Text>
              <Pressable style={styles.catOpenBtn} onPress={() => setCategoryOpen(true)}>
                <Text style={styles.catOpenText}>Elegir categorías</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.accent} />
              </Pressable>
              {(draft.categoryGroups.length > 0 || draft.categoryPairs.length > 0) && (
                <Text style={styles.catSummary}>
                  {draft.categoryGroups.length} grupos · {draft.categoryPairs.length} subcategorías
                </Text>
              )}
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

      <NekoProximoCategorySheet
        visible={categoryOpen}
        tree={categoryTree}
        value={draft}
        onClose={() => setCategoryOpen(false)}
        onApply={(next) => setDraft(next)}
      />
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetSection: { color: colors.text, fontSize: 18, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  scroll: { maxHeight: 400, marginBottom: 8 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8, fontFamily: 'HankenGrotesk-Medium' },
  labelGap: { marginTop: 16 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: { color: colors.text, fontSize: 16, fontWeight: '500' },
  periodList: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  periodRow: { paddingHorizontal: 14, paddingVertical: 12 },
  periodText: { color: colors.textMuted, fontSize: 15 },
  periodOn: { color: colors.accent, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '48%',
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  chipTextOn: { color: '#0b1118', fontWeight: '700' },
  inactiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  inactiveLabel: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  inactiveBody: { paddingVertical: 8, gap: 6 },
  inactiveHint: { color: colors.textMuted, fontSize: 13 },
  inactiveToggle: { paddingVertical: 4 },
  catTab: { gap: 12, paddingVertical: 8 },
  catHint: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  catOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catOpenText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
  catSummary: { color: colors.textMuted, fontSize: 13 },
  apply: {
    backgroundColor: colors.accent,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  applyText: { color: '#0b1118', fontSize: 17, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
});
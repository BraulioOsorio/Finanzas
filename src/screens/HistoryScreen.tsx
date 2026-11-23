import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SectionList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NekoBalanceStrip } from '../components/neko/NekoBalanceStrip';
import { NekoCalendarTxCard } from '../components/neko/calendar/NekoCalendarTxCard';
import { NekoMonthSummarySheet } from '../components/neko/NekoMonthSummarySheet';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { shiftMonth } from '../domain/calendar';
import {
  activeAccountOptions,
  formatAccountPickerLabel,
} from '../domain/accounts/resolveAccounts';
import { balanceAfterTransaction as nekoBalanceAfterTx } from '../domain/calendarDayBalances';
import type { MoreStackParamList } from '../navigation/moreTypes';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { useRootNav } from '../navigation/useRootNav';
import { TransactionEditModal } from '../components/TransactionEditModal';
import { groupTransactionsByDay } from '../domain/historySections';
import {
  EMPTY_HISTORY_FILTER,
  distinctCategoryGroups,
  distinctMonthKeys,
  distinctNekoTypes,
  filterTransactions,
} from '../domain/historyFilters';
import {
  buildInstallmentSuggestionFromTransaction,
  hasInstallmentPlanForTransaction,
} from '../domain/suggestInstallmentsFromTransactions';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { Transaction } from '../types';
import { formatCurrency, formatNekoMonthTitle } from '../utils/format';

type HistNav = NativeStackNavigationProp<MoreStackParamList, 'Historial'>;

export function HistoryScreen() {
  const navigation = useNavigation<HistNav>();
  const {
    loading,
    transactions,
    removeTransaction,
    accounts,
    installmentPlans,
    addInstallmentPlan,
    historyFilterSeed,
    setHistoryFilterSeed,
    nekoSummary,
  } = useTransactions();
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_HISTORY_FILTER,
    monthKey: new Date().toISOString().slice(0, 7),
  }));
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (historyFilterSeed) {
      setFilters(historyFilterSeed);
      setHistoryFilterSeed(null);
    }
  }, [historyFilterSeed, setHistoryFilterSeed]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { openMas } = useRootNav();

  const months = useMemo(() => distinctMonthKeys(transactions), [transactions]);
  const groups = useMemo(() => distinctCategoryGroups(transactions), [transactions]);
  const nekoTypes = useMemo(() => distinctNekoTypes(transactions), [transactions]);
  const TYPE_QUICK = ['Compra a meses', 'Gasto', 'Ingreso', 'Pago', 'Transferencia', 'Pago de Tarjeta'];
  const typeChips = useMemo(
    () => TYPE_QUICK.filter((t) => nekoTypes.includes(t)),
    [nekoTypes],
  );
  const accountOptions = useMemo(() => activeAccountOptions(accounts), [accounts]);

  const filtered = useMemo(
    () => filterTransactions(transactions, filters, accounts),
    [transactions, filters, accounts],
  );
  const sections = useMemo(() => groupTransactionsByDay(filtered), [filtered]);

  const confirmCreatePlan = (item: Transaction) => {
    const suggestion = buildInstallmentSuggestionFromTransaction(item, accounts);
    if (!suggestion) {
      return;
    }
    if (hasInstallmentPlanForTransaction(installmentPlans, item)) {
      Alert.alert('Ya en Plan', 'Esta compra ya tiene un plan de cuotas en la pestaña Plan.');
      return;
    }
    const { reason, fingerprint: _fp, ...draft } = suggestion;
    Alert.alert(
      'Crear plan de cuotas',
      `${suggestion.title}\nTotal ~${formatCurrency(suggestion.totalAmount)} · ${suggestion.installmentCount} cuotas (~${formatCurrency(suggestion.perInstallment)} c/u)\n\n${reason}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear plan',
          onPress: async () => {
            await addInstallmentPlan(draft);
            const hint = suggestion.needsCuotaReview
              ? ' Confirma el número de cuotas en Plan → Editar cuotas.'
              : ' Revisa Calendario y Plan.';
            Alert.alert('Listo', `Plan creado.${hint}`);
          },
        },
      ],
    );
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Eliminar movimiento', '¿Quieres borrar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeTransaction(id),
      },
    ]);
  };

  const headerMonth = filters.monthKey || new Date().toISOString().slice(0, 7);

  const clearFilters = Boolean(
    filters.query ||
      filters.accountId ||
      filters.account ||
      filters.categoryGroup ||
      filters.nekoType ||
      (filters.monthKey && filters.monthKey !== new Date().toISOString().slice(0, 7)),
  );

  const shiftHistMonth = (delta: number) => {
    const base = filters.monthKey || headerMonth;
    setFilters((f) => ({ ...f, monthKey: shiftMonth(base, delta) }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NekoScreenHeader
        title={filters.monthKey ? formatNekoMonthTitle(headerMonth) : 'Historial'}
        subtitle={`Pagado · ${filtered.length}`}
        actions={[
          {
            icon: 'chevron-back',
            accessibilityLabel: 'Mes anterior',
            onPress: () => shiftHistMonth(-1),
          },
          {
            icon: 'chevron-forward',
            accessibilityLabel: 'Mes siguiente',
            onPress: () => shiftHistMonth(1),
          },
          {
            icon: 'scale-outline',
            accessibilityLabel: 'Resumen del mes',
            onPress: () => setSummaryOpen(true),
          },
          {
            icon: 'search-outline',
            accessibilityLabel: 'Buscar',
            onPress: () => openMas('Buscar'),
          },
          {
            icon: 'menu-outline',
            accessibilityLabel: 'Más',
            onPress: () => openMas(),
          },
        ]}
      />

      {nekoSummary ? (
        <View style={styles.stripPad}>
          <NekoBalanceStrip summary={nekoSummary} />
        </View>
      ) : null}

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Buscar descripción, cuenta, categoría…"
          placeholderTextColor={colors.textMuted}
          value={filters.query}
          onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
        />

        <Text style={styles.filterLabel}>Mes</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Todos"
            active={!filters.monthKey}
            onPress={() => setFilters((f) => ({ ...f, monthKey: '' }))}
          />
          {months.slice(0, 8).map((m) => (
            <Chip
              key={m}
              label={m}
              active={filters.monthKey === m}
              onPress={() => setFilters((f) => ({ ...f, monthKey: m }))}
            />
          ))}
        </View>

        <Text style={styles.filterLabel}>Cuenta</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Todas"
            active={!filters.accountId}
            onPress={() => setFilters((f) => ({ ...f, accountId: '', account: '' }))}
          />
          {accountOptions.slice(0, 12).map((a) => (
            <Chip
              key={a.id}
              label={formatAccountPickerLabel(accounts, a.id)}
              active={filters.accountId === a.id}
              onPress={() => setFilters((f) => ({ ...f, accountId: a.id, account: '' }))}
            />
          ))}
        </View>

        <Text style={styles.filterLabel}>Tipo Neko</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Todos"
            active={!filters.nekoType}
            onPress={() => setFilters((f) => ({ ...f, nekoType: '' }))}
          />
          {typeChips.map((t) => (
            <Chip
              key={t}
              label={t}
              active={filters.nekoType === t}
              onPress={() => setFilters((f) => ({ ...f, nekoType: t }))}
            />
          ))}
        </View>

        <Text style={styles.filterLabel}>Grupo</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Todos"
            active={!filters.categoryGroup}
            onPress={() => setFilters((f) => ({ ...f, categoryGroup: '' }))}
          />
          {groups.slice(0, 8).map((g) => (
            <Chip
              key={g}
              label={g}
              active={filters.categoryGroup === g}
              onPress={() => setFilters((f) => ({ ...f, categoryGroup: g }))}
            />
          ))}
        </View>

        {clearFilters ? (
          <Pressable onPress={() => setFilters(EMPTY_HISTORY_FILTER)}>
            <Text style={styles.clear}>Quitar filtros</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textMuted} style={{ marginTop: 24 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: TAB_BAR_BOTTOM_INSET }]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyBody}>Prueba otros filtros o registra un movimiento.</Text>
            </View>
          }
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={styles.sectionHead}>
              <Text style={styles.sectionDay}>{title}</Text>
              <Text style={styles.sectionPagado}>Pagado · {data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isCompra = item.nekoType.trim() === 'Compra a meses' && item.kind === 'expense';
            const inPlan = isCompra && hasInstallmentPlanForTransaction(installmentPlans, item);
            return (
              <Pressable onPress={() => setEditing(item)} onLongPress={isCompra && !inPlan ? () => confirmCreatePlan(item) : undefined}>
                <NekoCalendarTxCard
                  item={item}
                  runningBalance={nekoBalanceAfterTx(transactions, accounts, item.id)}
                  onDelete={() => confirmDelete(item.id)}
                />
                {inPlan ? (
                  <Text style={styles.planBadge}>En Plan de cuotas</Text>
                ) : null}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      )}

      <TransactionEditModal
        visible={editing !== null}
        transaction={editing}
        onClose={() => setEditing(null)}
      />

      <NekoMonthSummarySheet
        visible={summaryOpen}
        monthKey={headerMonth}
        transactions={transactions}
        onClose={() => setSummaryOpen(false)}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  stripPad: { paddingHorizontal: 16, marginBottom: 4 },
  planBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 8,
    fontFamily: 'HankenGrotesk-Medium',
  },
  sectionHead: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    gap: 2,
  },
  sectionDay: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionPagado: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  filters: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  filterLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 140,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  clear: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
});
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionEditModal } from '../components/TransactionEditModal';
import { TransactionRow } from '../components/TransactionRow';
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
import { formatCurrency } from '../utils/format';

export function HistoryScreen() {
  const {
    loading,
    transactions,
    removeTransaction,
    accountNames,
    accounts,
    installmentPlans,
    addInstallmentPlan,
  } = useTransactions();
  const [filters, setFilters] = useState(EMPTY_HISTORY_FILTER);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const months = useMemo(() => distinctMonthKeys(transactions), [transactions]);
  const groups = useMemo(() => distinctCategoryGroups(transactions), [transactions]);
  const nekoTypes = useMemo(() => distinctNekoTypes(transactions), [transactions]);
  const TYPE_QUICK = ['Compra a meses', 'Gasto', 'Ingreso', 'Pago', 'Transferencia', 'Pago de Tarjeta'];
  const typeChips = useMemo(
    () => TYPE_QUICK.filter((t) => nekoTypes.includes(t)),
    [nekoTypes],
  );
  const filtered = useMemo(() => filterTransactions(transactions, filters), [transactions, filters]);

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

  const clearFilters = Boolean(
    filters.query || filters.account || filters.categoryGroup || filters.monthKey || filters.nekoType,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>
          {filtered.length} de {transactions.length} movimientos
        </Text>
      </View>

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
            active={!filters.account}
            onPress={() => setFilters((f) => ({ ...f, account: '' }))}
          />
          {accountNames.slice(0, 10).map((a) => (
            <Chip
              key={a}
              label={a}
              active={filters.account === a}
              onPress={() => setFilters((f) => ({ ...f, account: a }))}
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyBody}>Prueba otros filtros o registra un movimiento.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCompra = item.nekoType.trim() === 'Compra a meses' && item.kind === 'expense';
            const inPlan = isCompra && hasInstallmentPlanForTransaction(installmentPlans, item);
            return (
              <TransactionRow
                item={item}
                onEdit={() => setEditing(item)}
                onDelete={() => confirmDelete(item.id)}
                inInstallmentPlan={inPlan}
                onCreatePlan={
                  isCompra && !inPlan ? () => confirmCreatePlan(item) : undefined
                }
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      <TransactionEditModal
        visible={editing !== null}
        transaction={editing}
        onClose={() => setEditing(null)}
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
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
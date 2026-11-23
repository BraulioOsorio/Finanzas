import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandIcon } from '../components/BrandIcon';
import { resolveCategoryIconForScheduled } from '../domain/categories/resolveCategoryIcon';
import { scheduleFrequencyLabel } from '../domain/scheduleProjection';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { ScheduleFrequency, ScheduledPayment } from '../types';
import { formatCurrency } from '../utils/format';

const FREQUENCIES: ScheduleFrequency[] = ['monthly', 'biweekly', 'weekly', 'once'];

export function PlanScreen() {
  const {
    scheduledPayments,
    addScheduledPayment,
    removeScheduledPayment,
    toggleScheduledPayment,
    accountNames,
  } = useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(accountNames[0] ?? 'Bancolombia');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = Number(amount.replace(/[^\d]/g, ''));
    if (!parsed || parsed <= 0) {
      Alert.alert('Monto inválido', 'Escribe un monto mayor que cero.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Título', 'Pon un nombre (ej. Quincena, Netflix, arriendo).');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Fecha', 'Usa formato AAAA-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      await addScheduledPayment({
        title: title.trim(),
        kind,
        amount: parsed,
        account,
        nekoType: kind === 'income' ? 'Ingreso' : 'Pago',
        categoryGroup: kind === 'income' ? 'Ingreso Principal' : 'Hogar y Servicios',
        category: kind === 'income' ? 'Salario' : 'Suscripciones',
        frequency,
        startDate,
        active: true,
      });
      setTitle('');
      setAmount('');
      setShowForm(false);
      Alert.alert('Listo', 'Programación guardada. Mira el calendario en fechas futuras.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: ScheduledPayment) => {
    Alert.alert('Eliminar', `¿Quitar "${item.title}" del plan?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeScheduledPayment(item.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.subtitle}>
          Pagos e ingresos repetidos. Alimentan la proyección del calendario (como la quincena en
          NEKO).
        </Text>
        <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addBtnText}>{showForm ? 'Cerrar formulario' : '+ Nuevo'}</Text>
        </Pressable>
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Pago quincenal, Arriendo, Spotify"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.kindRow}>
            <Pressable
              style={[styles.kindChip, kind === 'income' && styles.kindIncome]}
              onPress={() => setKind('income')}
            >
              <Text style={styles.kindText}>Ingreso</Text>
            </Pressable>
            <Pressable
              style={[styles.kindChip, kind === 'expense' && styles.kindExpense]}
              onPress={() => setKind('expense')}
            >
              <Text style={styles.kindText}>Pago / gasto</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Monto (COP)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Cuenta</Text>
          <View style={styles.chipWrap}>
            {accountNames.map((name) => (
              <Pressable
                key={name}
                style={[styles.chip, account === name && styles.chipActive]}
                onPress={() => setAccount(name)}
              >
                <Text style={[styles.chipText, account === name && styles.chipTextActive]}>
                  {name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.chipWrap}>
            {FREQUENCIES.map((freq) => (
              <Pressable
                key={freq}
                style={[styles.chip, frequency === freq && styles.chipActive]}
                onPress={() => setFrequency(freq)}
              >
                <Text style={[styles.chipText, frequency === freq && styles.chipTextActive]}>
                  {scheduleFrequencyLabel(freq)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Próxima fecha (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-02-15"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.saveBtn, saving && styles.saveDisabled]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar programación'}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      <FlatList
        data={scheduledPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin pagos programados</Text>
            <Text style={styles.emptyBody}>
              Agrega tu quincena, arriendo o suscripciones para ver el saldo futuro en el calendario.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const brand = resolveCategoryIconForScheduled(item);
          return (
          <View style={styles.row}>
            <BrandIcon brand={brand} size={42} />
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {scheduleFrequencyLabel(item.frequency)} · {item.account} · desde {item.startDate}
              </Text>
              <Text
                style={[
                  styles.rowAmount,
                  item.kind === 'income' ? styles.amountIncome : styles.amountExpense,
                ]}
              >
                {item.kind === 'income' ? '+' : '−'}
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Switch
                value={item.active}
                onValueChange={(v) => toggleScheduledPayment(item.id, v)}
              />
              <Pressable onPress={() => confirmDelete(item)}>
                <Text style={styles.delete}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingBottom: 8, gap: 8 },
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
  form: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  kindRow: { flexDirection: 'row', gap: 10 },
  kindChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kindIncome: { backgroundColor: colors.incomeMuted, borderColor: colors.income },
  kindExpense: { backgroundColor: colors.expenseMuted, borderColor: colors.expense },
  kindText: { color: colors.text, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  saveBtn: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontWeight: '800' },
  list: { padding: 20, paddingTop: 8 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.textMuted, fontSize: 14, marginTop: 8, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMain: { flex: 1, gap: 4 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rowMeta: { color: colors.textMuted, fontSize: 12 },
  rowAmount: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  amountIncome: { color: colors.income },
  amountExpense: { color: colors.expense },
  rowActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  delete: { color: colors.expense, fontSize: 12, marginTop: 8 },
});
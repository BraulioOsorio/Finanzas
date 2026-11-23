import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  activeAccountOptions,
  formatAccountPickerLabel,
} from '../domain/accounts/resolveAccounts';
import { scheduleFrequencyLabel } from '../domain/scheduleProjection';
import { useNekoCatalog } from '../hooks/useNekoCatalog';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { ScheduleFrequency, ScheduledPayment } from '../types';

const FREQUENCIES: ScheduleFrequency[] = ['monthly', 'biweekly', 'weekly', 'once'];

type Props = {
  visible: boolean;
  payment: ScheduledPayment | null;
  onClose: () => void;
};

export function ScheduledPaymentEditorModal({ visible, payment, onClose }: Props) {
  const { updateScheduledPayment, accounts } = useTransactions();
  const { categoriesForGroup, allCategoryGroups, UNCATEGORIZED_GROUP } = useNekoCatalog();
  const accountOptions = useMemo(() => activeAccountOptions(accounts), [accounts]);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly');
  const [startDate, setStartDate] = useState('');
  const [categoryGroup, setCategoryGroup] = useState('Hogar y Servicios');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const planCategories = useMemo(
    () => categoriesForGroup(categoryGroup),
    [categoryGroup, categoriesForGroup],
  );

  useEffect(() => {
    if (!payment || !visible) {
      return;
    }
    setTitle(payment.title);
    setKind(payment.kind);
    setAmount(String(payment.amount));
    const def = accountOptions.find((o) => o.name === payment.account);
    setAccountId(def?.id ?? accountOptions[0]?.id ?? '');
    setFrequency(payment.frequency);
    setStartDate(payment.startDate);
    setCategoryGroup(payment.categoryGroup?.trim() || 'Hogar y Servicios');
    setCategory(payment.category);
    setActive(payment.active);
  }, [payment, visible, accountOptions]);

  const onSave = async () => {
    if (!payment) {
      return;
    }
    const parsed = Number(amount.replace(/[^\d]/g, ''));
    if (!parsed || parsed <= 0) {
      Alert.alert('Monto inválido', 'Escribe un monto mayor que cero.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Título', 'Pon un nombre para el pago programado.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Fecha', 'Usa formato AAAA-MM-DD.');
      return;
    }
    const picked = accountOptions.find((o) => o.id === accountId);
    const accountName = picked?.name ?? payment.account;

    setSaving(true);
    try {
      await updateScheduledPayment(payment.id, {
        title: title.trim(),
        kind,
        amount: parsed,
        account: accountName,
        nekoType: kind === 'income' ? 'Ingreso' : payment.nekoType || 'Pago',
        categoryGroup: categoryGroup === UNCATEGORIZED_GROUP ? '' : categoryGroup,
        category: category || payment.category,
        frequency,
        startDate,
        active,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Editar en Plan</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Cerrar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>TÍTULO</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>MONTO</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="number-pad" />

          <Text style={styles.label}>CUENTA</Text>
          <View style={styles.chipWrap}>
            {accountOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.chip, accountId === opt.id && styles.chipOn]}
                onPress={() => setAccountId(opt.id)}
              >
                <Text style={[styles.chipText, accountId === opt.id && styles.chipTextOn]}>
                  {formatAccountPickerLabel(accounts, opt.id)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>FRECUENCIA</Text>
          <View style={styles.chipWrap}>
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, frequency === f && styles.chipOn]}
                onPress={() => setFrequency(f)}
              >
                <Text style={[styles.chipText, frequency === f && styles.chipTextOn]}>
                  {scheduleFrequencyLabel(f)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>PRÓXIMA FECHA</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} />

          <Text style={styles.label}>GRUPO</Text>
          <View style={styles.chipWrap}>
            {allCategoryGroups()
              .filter((g) => g !== UNCATEGORIZED_GROUP)
              .slice(0, 12)
              .map((g) => (
                <Pressable
                  key={g}
                  style={[styles.chip, categoryGroup === g && styles.chipOn]}
                  onPress={() => {
                    setCategoryGroup(g);
                    setCategory(categoriesForGroup(g)[0] ?? '');
                  }}
                >
                  <Text style={[styles.chipText, categoryGroup === g && styles.chipTextOn]}>{g}</Text>
                </Pressable>
              ))}
          </View>

          <Text style={styles.label}>CATEGORÍA</Text>
          <View style={styles.chipWrap}>
            {planCategories.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, category === c && styles.chipOn]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Activo en calendario</Text>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.accent }} />
          </View>

          <Pressable style={[styles.save, saving && styles.saveDisabled]} onPress={() => void onSave()} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  close: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: '48%',
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: '#0b1118' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  save: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: '#0b1118', fontWeight: '700', fontSize: 16 },
});
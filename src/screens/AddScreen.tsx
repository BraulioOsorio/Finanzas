import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTransactions } from '../context/TransactionsContext';
import { colors, expenseCategories, incomeCategories } from '../theme';
import type { TransactionType } from '../types';

export function AddScreen() {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(expenseCategories[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategory(next === 'income' ? incomeCategories[0] : expenseCategories[0]);
  };

  const onSubmit = async () => {
    const parsed = Number(amount.replace(/[^\d]/g, ''));
    if (!parsed || parsed <= 0) {
      Alert.alert('Monto inválido', 'Escribe un valor mayor que cero.');
      return;
    }
    setSaving(true);
    try {
      await addTransaction({
        type,
        amount: parsed,
        category,
        note: note.trim(),
      });
      setAmount('');
      setNote('');
      Alert.alert('Guardado', 'Movimiento registrado correctamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Registrar movimiento</Text>
          <Text style={styles.subtitle}>Ingreso o gasto con categoría</Text>

          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeChip, type === 'expense' && styles.typeChipActiveExpense]}
              onPress={() => switchType('expense')}
            >
              <Text style={styles.typeChipText}>Gasto</Text>
            </Pressable>
            <Pressable
              style={[styles.typeChip, type === 'income' && styles.typeChipActiveIncome]}
              onPress={() => switchType('income')}
            >
              <Text style={styles.typeChipText}>Ingreso</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Monto (COP)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Ej. 85000"
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chipWrap}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Nota (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Ej. mercado del fin de semana"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Pressable
            style={[styles.submit, saving && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={saving}
          >
            <Text style={styles.submitText}>{saving ? 'Guardando…' : 'Guardar movimiento'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActiveExpense: { backgroundColor: colors.expenseMuted, borderColor: colors.expense },
  typeChipActiveIncome: { backgroundColor: colors.incomeMuted, borderColor: colors.income },
  typeChipText: { color: colors.text, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 4 },
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
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  categoryChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: colors.white },
  submit: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
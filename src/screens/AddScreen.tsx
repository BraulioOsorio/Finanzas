import { useMemo, useState } from 'react';
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

import {
  NEKO_TRANSACTION_TYPES,
  UNCATEGORIZED_GROUP,
  allCategoryGroups,
  categoriesForGroup,
} from '../domain/nekoCatalog';
import { classifyNekoType } from '../import/nekoMapping';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { TransactionKind } from '../types';

export function AddScreen() {
  const { addTransaction, accountNames } = useTransactions();
  const [nekoType, setNekoType] = useState<string>('Gasto');
  const [account, setAccount] = useState(accountNames[0] ?? 'Efectivo');
  const [categoryGroup, setCategoryGroup] = useState('Comida y Bebida');
  const [category, setCategory] = useState('Salidas');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const kind: TransactionKind = classifyNekoType(nekoType);
  const categories = useMemo(() => categoriesForGroup(categoryGroup), [categoryGroup]);

  const onChangeGroup = (group: string) => {
    setCategoryGroup(group);
    const cats = categoriesForGroup(group);
    setCategory(cats[0] ?? '');
  };

  const onChangeType = (type: string) => {
    setNekoType(type);
    if (type === 'Ingreso' || type === 'Reembolso' || type === 'Fondos del préstamo') {
      setCategoryGroup('Ingreso Principal');
      setCategory('Salario');
    } else if (type === 'Transferencia' || type === 'Pago de Tarjeta') {
      setCategoryGroup(UNCATEGORIZED_GROUP);
      setCategory('');
    }
  };

  const onSubmit = async () => {
    const parsed = Number(amount.replace(/[^\d]/g, ''));
    if (!parsed || parsed <= 0) {
      Alert.alert('Monto inválido', 'Escribe un valor mayor que cero.');
      return;
    }
    if (!description.trim() && !notes.trim()) {
      Alert.alert('Descripción', 'Escribe al menos una descripción o nota.');
      return;
    }

    const signed =
      kind === 'income' ? parsed : kind === 'transfer' ? -parsed : -parsed;
    const type = kind === 'income' ? 'income' : 'expense';
    const today = new Date().toISOString().slice(0, 10);

    setSaving(true);
    try {
      await addTransaction({
        kind,
        type,
        amount: parsed,
        signedAmount: signed,
        postedDate: today,
        nekoType,
        description: description.trim(),
        account,
        categoryGroup: categoryGroup === UNCATEGORIZED_GROUP ? '' : categoryGroup,
        category: category || nekoType,
        notes: notes.trim(),
        source: 'manual',
      });
      setAmount('');
      setDescription('');
      setNotes('');
      Alert.alert('Guardado', 'Movimiento registrado al estilo Neko.');
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
          <Text style={styles.title}>Registrar</Text>
          <Text style={styles.subtitle}>Mismos campos que en NEKO: tipo, cuenta, categorías</Text>

          <Text style={styles.label}>Tipo de transacción</Text>
          <View style={styles.chipWrap}>
            {NEKO_TRANSACTION_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[styles.categoryChip, nekoType === type && styles.categoryChipActive]}
                onPress={() => onChangeType(type)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    nekoType === type && styles.categoryChipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Cuenta</Text>
          <View style={styles.chipWrap}>
            {accountNames.map((name) => (
              <Pressable
                key={name}
                style={[styles.categoryChip, account === name && styles.categoryChipActive]}
                onPress={() => setAccount(name)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    account === name && styles.categoryChipTextActive,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            ))}
          </View>

          {kind !== 'transfer' ? (
            <>
              <Text style={styles.label}>Grupo de categoría</Text>
              <View style={styles.chipWrap}>
                {allCategoryGroups()
                  .filter((g) => g !== UNCATEGORIZED_GROUP)
                  .map((group) => (
                    <Pressable
                      key={group}
                      style={[styles.categoryChip, categoryGroup === group && styles.categoryChipActive]}
                      onPress={() => onChangeGroup(group)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          categoryGroup === group && styles.categoryChipTextActive,
                        ]}
                      >
                        {group}
                      </Text>
                    </Pressable>
                  ))}
              </View>

              {categories.length > 0 ? (
                <>
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
                </>
              ) : null}
            </>
          ) : (
            <Text style={styles.transferNote}>
              Las transferencias en NEKO suelen ser dos movimientos (salida y entrada). Aquí puedes
              registrar un lado; importa el CSV para el historial completo.
            </Text>
          )}

          <Text style={styles.label}>Monto (COP)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Ej. 85000"
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Almuerzo, Netflix, quincena…"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Notas largas como en el export"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
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
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 8, lineHeight: 20 },
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
  transferNote: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
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
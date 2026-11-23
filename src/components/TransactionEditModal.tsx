import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NEKO_TRANSACTION_TYPES } from '../domain/nekoCatalog';
import { useNekoCatalog } from '../hooks/useNekoCatalog';
import { classifyNekoType } from '../import/nekoMapping';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { Transaction, TransactionUpdate } from '../types';

type Props = {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
};

export function TransactionEditModal({ visible, transaction, onClose }: Props) {
  const { updateTransaction, accountNames } = useTransactions();
  const { UNCATEGORIZED_GROUP, categoriesForGroup, allCategoryGroups } = useNekoCatalog();
  const [nekoType, setNekoType] = useState('Gasto');
  const [account, setAccount] = useState('');
  const [categoryGroup, setCategoryGroup] = useState('Comida y Bebida');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [saving, setSaving] = useState(false);

  const kind = classifyNekoType(nekoType);
  const categories = useMemo(
    () => categoriesForGroup(categoryGroup),
    [categoryGroup, categoriesForGroup],
  );

  useEffect(() => {
    if (!transaction || !visible) {
      return;
    }
    setNekoType(transaction.nekoType || 'Gasto');
    setAccount(transaction.account);
    setCategoryGroup(
      transaction.categoryGroup?.trim() ? transaction.categoryGroup : UNCATEGORIZED_GROUP,
    );
    setCategory(transaction.category);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setNotes(transaction.notes);
    setPostedDate(transaction.postedDate);
  }, [transaction, visible]);

  const onChangeGroup = (group: string) => {
    setCategoryGroup(group);
    const cats = categoriesForGroup(group);
    setCategory(cats[0] ?? '');
  };

  const onSave = async () => {
    if (!transaction) {
      return;
    }
    const parsed = Number(amount.replace(/[^\d]/g, ''));
    if (!parsed || parsed <= 0) {
      Alert.alert('Monto inválido', 'Escribe un valor mayor que cero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(postedDate)) {
      Alert.alert('Fecha', 'Usa formato AAAA-MM-DD.');
      return;
    }

    const group =
      categoryGroup === UNCATEGORIZED_GROUP || categoryGroup === 'Sin grupo' ? '' : categoryGroup;

    const update: TransactionUpdate = {
      kind: transaction.kind,
      type: transaction.type,
      amount: parsed,
      signedAmount: transaction.signedAmount,
      postedDate,
      nekoType,
      description: description.trim(),
      account,
      categoryGroup: group,
      category: category || nekoType,
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      await updateTransaction(transaction.id, update);
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
          <Text style={styles.title}>Editar movimiento</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Cerrar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={postedDate}
            onChangeText={setPostedDate}
            autoCapitalize="none"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.chipWrap}>
            {NEKO_TRANSACTION_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[styles.chip, nekoType === type && styles.chipActive]}
                onPress={() => setNekoType(type)}
              >
                <Text style={[styles.chipText, nekoType === type && styles.chipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Cuenta</Text>
          <View style={styles.chipWrap}>
            {accountNames.map((name) => (
              <Pressable
                key={name}
                style={[styles.chip, account === name && styles.chipActive]}
                onPress={() => setAccount(name)}
              >
                <Text style={[styles.chipText, account === name && styles.chipTextActive]}>{name}</Text>
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
                      style={[styles.chip, categoryGroup === group && styles.chipActive]}
                      onPress={() => onChangeGroup(group)}
                    >
                      <Text style={[styles.chipText, categoryGroup === group && styles.chipTextActive]}>
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
                        style={[styles.chip, category === cat && styles.chipActive]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : null}

          <Text style={styles.label}>Monto (COP)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholderTextColor={colors.textMuted}
          />

          <Pressable style={[styles.save, saving && styles.saveDisabled]} onPress={onSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  close: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
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
  multiline: { minHeight: 72, textAlignVertical: 'top' },
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
  save: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
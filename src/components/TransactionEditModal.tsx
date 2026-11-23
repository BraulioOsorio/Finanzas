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
import { parseInstallmentMetaCell } from '../import/installmentMeta';
import {
  accountDefById,
  accountDefForTransaction,
  activeAccountOptions,
  formatAccountPickerLabel,
} from '../domain/accounts/resolveAccounts';
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
  const { updateTransaction, accounts } = useTransactions();
  const accountOptions = useMemo(() => activeAccountOptions(accounts), [accounts]);
  const { UNCATEGORIZED_GROUP, categoriesForGroup, allCategoryGroups } = useNekoCatalog();
  const [nekoType, setNekoType] = useState('Gasto');
  const [accountId, setAccountId] = useState('');
  const [postedTime, setPostedTime] = useState('12:00');
  const [categoryGroup, setCategoryGroup] = useState('Comida y Bebida');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [installmentMeta, setInstallmentMeta] = useState('');
  const [purchaseTotal, setPurchaseTotal] = useState('');
  const [installmentCurrent, setInstallmentCurrent] = useState('');

  const kind = classifyNekoType(nekoType);
  const isInstallment = nekoType === 'Compra a meses';
  const categories = useMemo(
    () => categoriesForGroup(categoryGroup),
    [categoryGroup, categoriesForGroup],
  );

  useEffect(() => {
    if (!transaction || !visible) {
      return;
    }
    setNekoType(transaction.nekoType || 'Gasto');
    const def = accountDefForTransaction(accounts, transaction);
    setAccountId(def?.id ?? '');
    const iso = transaction.createdAt?.length > 10 ? transaction.createdAt : `${transaction.postedDate}T12:00:00`;
    const time = new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
    setPostedTime(time);
    setCategoryGroup(
      transaction.categoryGroup?.trim() ? transaction.categoryGroup : UNCATEGORIZED_GROUP,
    );
    setCategory(transaction.category);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setNotes(transaction.notes);
    setPostedDate(transaction.postedDate);
    setInstallmentMeta(transaction.installmentMeta ?? '');
    setPurchaseTotal(transaction.purchaseTotal ? String(transaction.purchaseTotal) : '');
    setInstallmentCurrent(
      transaction.installmentCurrent ? String(transaction.installmentCurrent) : '',
    );
  }, [transaction, visible, UNCATEGORIZED_GROUP, accounts]);

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

    const resolvedKind = classifyNekoType(nekoType);
    const type = resolvedKind === 'income' ? 'income' : 'expense';
    let signedAmount =
      resolvedKind === 'income' ? parsed : resolvedKind === 'transfer' ? transaction.signedAmount : -parsed;
    if (resolvedKind === 'transfer') {
      signedAmount = Math.sign(transaction.signedAmount || -1) * parsed;
    }

    const metaParsed = installmentMeta.trim() ? parseInstallmentMetaCell(installmentMeta) : {};
    const purchase = Number(purchaseTotal.replace(/[^\d]/g, ''));
    const current = Number(installmentCurrent.replace(/\D/g, ''));

    const picked = accountId ? accountDefById(accounts, accountId) : undefined;
    const accountName = picked?.name ?? transaction.account;
    const createdAt = `${postedDate}T${postedTime.length === 5 ? postedTime : '12:00'}:00`;

    const update: TransactionUpdate = {
      kind: resolvedKind,
      type,
      amount: parsed,
      signedAmount,
      postedDate,
      nekoType,
      description: description.trim(),
      account: accountName,
      nekoAccountId: picked?.nekoSqliteId ?? picked?.id ?? transaction.nekoAccountId,
      categoryGroup: group,
      category: category || nekoType,
      notes: notes.trim(),
      installmentMeta: installmentMeta.trim() || undefined,
      purchaseTotal: purchase > 0 ? purchase : undefined,
      installmentCurrent: current > 0 ? current : metaParsed.installmentCurrent,
      installmentCountHint: metaParsed.installmentCount,
      createdAt,
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

          <Text style={styles.label}>Hora (HH:MM, 24h)</Text>
          <TextInput
            style={styles.input}
            value={postedTime}
            onChangeText={setPostedTime}
            placeholder="12:00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Cuenta</Text>
          <View style={styles.chipWrap}>
            {accountOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.chip, accountId === opt.id && styles.chipActive]}
                onPress={() => setAccountId(opt.id)}
              >
                <Text style={[styles.chipText, accountId === opt.id && styles.chipTextActive]}>
                  {formatAccountPickerLabel(accounts, opt.id)}
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

          {isInstallment ? (
            <View style={styles.installmentBlock}>
              <Text style={styles.installmentTitle}>Cuotas (export / importación)</Text>
              <Text style={styles.installmentHint}>
                Ej. meta 2/6, total compra y cuota actual — igual que columnas extendidas del CSV.
              </Text>
              <Text style={styles.label}>Meta (2/6 o 12 cuotas)</Text>
              <TextInput
                style={styles.input}
                value={installmentMeta}
                onChangeText={setInstallmentMeta}
                placeholder="2/6"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Total compra (COP)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={purchaseTotal}
                onChangeText={setPurchaseTotal}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Cuota actual (número)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={installmentCurrent}
                onChangeText={setInstallmentCurrent}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : null}

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
  title: { color: colors.text, fontSize: 20, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
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
  saveText: { color: colors.white, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular', fontSize: 16 },
  installmentBlock: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  installmentTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  installmentHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
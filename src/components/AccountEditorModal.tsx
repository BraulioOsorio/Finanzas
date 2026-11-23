import { useEffect, useState } from 'react';
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
  ACCOUNT_KIND_LABELS,
  defaultLiquidForKind,
  inferAccountKind,
} from '../domain/accounts/inferAccountKind';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { AccountDef, AccountDefDraft, AccountKind } from '../types';

const KINDS: AccountKind[] = ['bank', 'cash', 'savings', 'credit', 'loan', 'fintech'];

type Props = {
  visible: boolean;
  editing: AccountDef | null;
  /** Nombre sugerido al configurar una cuenta que solo existía en movimientos */
  initialName?: string;
  onClose: () => void;
};

export function AccountEditorModal({ visible, editing, initialName, onClose }: Props) {
  const { addAccount, updateAccount } = useTransactions();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('bank');
  const [liquid, setLiquid] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (editing) {
      setName(editing.name);
      setKind(editing.kind);
      setLiquid(editing.liquid);
      setNotes(editing.notes);
    } else {
      const seed = initialName?.trim() ?? '';
      setName(seed);
      const inferred = seed ? inferAccountKind(seed) : 'bank';
      setKind(inferred);
      setLiquid(seed ? defaultLiquidForKind(inferred) : true);
      setNotes('');
    }
  }, [visible, editing, initialName]);

  const onChangeKind = (k: AccountKind) => {
    setKind(k);
    if (!editing) {
      setLiquid(defaultLiquidForKind(k));
    }
  };

  const onSuggestKind = () => {
    if (!name.trim()) {
      return;
    }
    const inferred = inferAccountKind(name);
    setKind(inferred);
    if (!editing) {
      setLiquid(defaultLiquidForKind(inferred));
    }
  };

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nombre', 'Escribe el nombre de la cuenta (ej. Bancolombia, RappiCard).');
      return;
    }

    const draft: AccountDefDraft = {
      name: trimmed,
      kind,
      liquid,
      notes: notes.trim(),
      archived: editing?.archived ?? false,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateAccount(editing.id, draft);
      } else {
        await addAccount(draft);
      }
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
          <Text style={styles.title}>{editing ? 'Editar cuenta' : 'Nueva cuenta'}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Cerrar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            En Neko cada movimiento sale de una cuenta: banco, efectivo, tarjeta de crédito o bucket de deudas.
          </Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onBlur={onSuggestKind}
            placeholder="Ej. Bancolombia, Nu, RappiCard, Deudas"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.chipWrap}>
            {KINDS.map((k) => (
              <Pressable
                key={k}
                style={[styles.chip, kind === k && styles.chipActive]}
                onPress={() => onChangeKind(k)}
              >
                <Text style={[styles.chipText, kind === k && styles.chipTextActive]}>
                  {ACCOUNT_KIND_LABELS[k]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Disponible para gastar</Text>
              <Text style={styles.switchHint}>
                Desactiva en tarjetas de crédito y cuentas de deuda (como «Deudas» en Neko).
              </Text>
            </View>
            <Switch value={liquid} onValueChange={setLiquid} />
          </View>

          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej. tarjeta Mamor, corte día 15"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Pressable style={[styles.save, saving && styles.saveDisabled]} onPress={onSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar cuenta'}</Text>
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
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 4 },
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
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  switchText: { flex: 1, gap: 4 },
  switchTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  switchHint: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
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
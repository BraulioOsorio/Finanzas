import { useEffect, useState } from 'react';
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

import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import type { InstallmentPlan } from '../types';

type Props = {
  visible: boolean;
  plan: InstallmentPlan | null;
  onClose: () => void;
};

export function InstallmentPlanEditorModal({ visible, plan, onClose }: Props) {
  const { updateInstallmentPlan } = useTransactions();
  const [total, setTotal] = useState('');
  const [count, setCount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !plan) {
      return;
    }
    setTotal(String(plan.totalAmount));
    setCount(String(plan.installmentCount));
  }, [visible, plan]);

  const onSave = async () => {
    if (!plan) {
      return;
    }
    const totalAmount = Number(total.replace(/[^\d]/g, ''));
    const installmentCount = Number(count.replace(/\D/g, ''));
    if (!totalAmount || !installmentCount || installmentCount < 1) {
      Alert.alert('Datos', 'Indica total y número de cuotas (como en la app del banco).');
      return;
    }
    const perInstallment = Math.round(totalAmount / installmentCount);
    setSaving(true);
    try {
      await updateInstallmentPlan(plan.id, {
        totalAmount,
        installmentCount,
        perInstallment,
        needsCuotaReview: false,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Cuotas de la compra</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.name}>{plan.title}</Text>
          <Text style={styles.hint}>
            El CSV de Neko no trae cuotas ni cuántas faltan. Pon el total y las cuotas que ves en Nu,
            RappiCard o tu banco.
          </Text>

          <Text style={styles.label}>Total compra (COP)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={total}
            onChangeText={setTotal}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Número de cuotas</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={count}
            onChangeText={setCount}
            placeholder="Ej. 12"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable style={[styles.save, saving && styles.saveOff]} onPress={onSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar cuotas'}</Text>
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
    padding: 20,
    paddingBottom: 8,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  close: { color: colors.accent, fontWeight: '700' },
  content: { padding: 20, gap: 10 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  save: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveOff: { opacity: 0.6 },
  saveText: { color: colors.white, fontWeight: '800' },
});
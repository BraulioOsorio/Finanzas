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
import { matchCreditPreset } from '../domain/credit/creditPresets';
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
  const [creditLimit, setCreditLimit] = useState('');
  const [statementCloseDay, setStatementCloseDay] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [paymentDueOffsetDays, setPaymentDueOffsetDays] = useState('');
  const [interestRateEA, setInterestRateEA] = useState('');
  const [installmentInterestEA, setInstallmentInterestEA] = useState('');
  const [minimumPaymentPercent, setMinimumPaymentPercent] = useState('');
  const [installmentLag, setInstallmentLag] = useState('');
  const [archived, setArchived] = useState(false);
  const [saving, setSaving] = useState(false);

  const parseDay = (raw: string): number | undefined => {
    const n = Number(raw.replace(/\D/g, ''));
    if (!n || n < 1 || n > 28) {
      return undefined;
    }
    return n;
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (editing) {
      setName(editing.name);
      setKind(editing.kind);
      setLiquid(editing.liquid);
      setNotes(editing.notes);
      setCreditLimit(editing.creditLimit ? String(editing.creditLimit) : '');
      setStatementCloseDay(editing.statementCloseDay ? String(editing.statementCloseDay) : '');
      setPaymentDueDay(editing.paymentDueDay ? String(editing.paymentDueDay) : '');
      setPaymentDueOffsetDays(
        editing.paymentDueOffsetDays ? String(editing.paymentDueOffsetDays) : '',
      );
      setInterestRateEA(editing.interestRateEA != null ? String(editing.interestRateEA) : '');
      setInstallmentInterestEA(
        editing.installmentInterestEA != null ? String(editing.installmentInterestEA) : '',
      );
      setMinimumPaymentPercent(
        editing.minimumPaymentPercent != null ? String(editing.minimumPaymentPercent) : '',
      );
      setInstallmentLag(
        editing.installmentStatementLagMonths != null
          ? String(editing.installmentStatementLagMonths)
          : '',
      );
      setArchived(editing.archived);
    } else {
      const seed = initialName?.trim() ?? '';
      setName(seed);
      const inferred = seed ? inferAccountKind(seed) : 'bank';
      setKind(inferred);
      setLiquid(seed ? defaultLiquidForKind(inferred) : true);
      setNotes('');
      setCreditLimit('');
      setStatementCloseDay('');
      setPaymentDueDay('');
      setPaymentDueOffsetDays('');
      setInterestRateEA('');
      setInstallmentInterestEA('');
      setMinimumPaymentPercent('');
      setInstallmentLag('');
      setArchived(false);
    }
  }, [visible, editing, initialName]);

  const applyPresetFields = () => {
    const hit = matchCreditPreset(name);
    if (!hit) {
      Alert.alert('Sin plantilla', 'No hay valores típicos para este nombre. Prueba RappiCard, Nu, Bancolombia…');
      return;
    }
    const p = hit.preset;
    if (p.statementCloseDay) {
      setStatementCloseDay(String(p.statementCloseDay));
    }
    if (p.paymentDueDay) {
      setPaymentDueDay(String(p.paymentDueDay));
    }
    if (p.paymentDueOffsetDays) {
      setPaymentDueOffsetDays(String(p.paymentDueOffsetDays));
    }
    if (p.interestRateEA != null) {
      setInterestRateEA(String(p.interestRateEA));
    }
    if (p.installmentInterestEA != null) {
      setInstallmentInterestEA(String(p.installmentInterestEA));
    }
    if (p.minimumPaymentPercent != null) {
      setMinimumPaymentPercent(String(p.minimumPaymentPercent));
    }
    if (p.installmentStatementLagMonths != null) {
      setInstallmentLag(String(p.installmentStatementLagMonths));
    }
    Alert.alert('Plantilla aplicada', `Valores orientativos ${hit.label}. Revisa con tu extracto real.`);
  };

  const parseEa = (raw: string): number | undefined => {
    const n = Number(raw.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
      return undefined;
    }
    return n;
  };

  const parsePct = (raw: string): number | undefined => {
    const n = Number(raw.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0 || n > 100) {
      return undefined;
    }
    return n;
  };

  const onChangeKind = (k: AccountKind) => {
    setKind(k);
    if (!editing) {
      setLiquid(defaultLiquidForKind(k));
    }
    if (k === 'credit' && !editing) {
      setLiquid(false);
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

    const limit = Number(creditLimit.replace(/[^\d]/g, ''));
    const draft: AccountDefDraft = {
      name: trimmed,
      kind,
      liquid,
      notes: notes.trim(),
      archived,
      creditLimit: kind === 'credit' && limit > 0 ? limit : undefined,
      statementCloseDay: kind === 'credit' ? parseDay(statementCloseDay) : undefined,
      paymentDueDay: kind === 'credit' ? parseDay(paymentDueDay) : undefined,
      paymentDueOffsetDays:
        kind === 'credit' ? parseDay(paymentDueOffsetDays) : undefined,
      interestRateEA: kind === 'credit' ? parseEa(interestRateEA) : undefined,
      installmentInterestEA: kind === 'credit' ? parseEa(installmentInterestEA) : undefined,
      minimumPaymentPercent: kind === 'credit' ? parsePct(minimumPaymentPercent) : undefined,
      installmentStatementLagMonths:
        kind === 'credit' ? parseDay(installmentLag) : undefined,
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
              <Text style={styles.switchTitle}>Archivada</Text>
              <Text style={styles.switchHint}>Oculta la cuenta de listas sin borrar movimientos.</Text>
            </View>
            <Switch value={archived} onValueChange={setArchived} />
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

          {kind === 'credit' ? (
            <>
              <Text style={styles.label}>Cupo (COP, opcional)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={creditLimit}
                onChangeText={setCreditLimit}
                placeholder="Ej. 5000000"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.presetBtn} onPress={applyPresetFields}>
                <Text style={styles.presetText}>Valores típicos Colombia (RappiCard, Nu…)</Text>
              </Pressable>
              <Text style={styles.creditNote}>
                En Colombia el extracto cierra en el día de corte; el pago suele vencer ~15–22 días
                después (o un día fijo del mes). La tasa EA aplica al saldo rotativo; las cuotas pueden
                tener otra tasa.
              </Text>
              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.label}>Día corte (1-28)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={statementCloseDay}
                    onChangeText={setStatementCloseDay}
                    placeholder="15"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Día pago (1-28)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={paymentDueDay}
                    onChangeText={setPaymentDueDay}
                    placeholder="5"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.label}>Días corte → pago</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={paymentDueOffsetDays}
                    onChangeText={setPaymentDueOffsetDays}
                    placeholder="16"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>% pago mínimo</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={minimumPaymentPercent}
                    onChangeText={setMinimumPaymentPercent}
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.label}>EA rotativo %</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={interestRateEA}
                    onChangeText={setInterestRateEA}
                    placeholder="24.9"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>EA cuotas %</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={installmentInterestEA}
                    onChangeText={setInstallmentInterestEA}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <Text style={styles.label}>1.ª cuota: extractos después del corte</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={installmentLag}
                onChangeText={setInstallmentLag}
                placeholder="1 (RappiCard) · 0 (Addi)"
                placeholderTextColor={colors.textMuted}
              />
            </>
          ) : null}

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
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  presetBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  creditNote: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
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
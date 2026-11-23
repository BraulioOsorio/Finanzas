import { useEffect, useMemo, useState } from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NEKO_TRANSACTION_TYPES } from '../domain/nekoCatalog';
import { NekoBalanceStrip } from '../components/neko/NekoBalanceStrip';
import { NekoFormField } from '../components/neko/NekoFormField';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { CategoryPickChip } from '../components/CategoryPickChip';
import type { RootStackParamList } from '../navigation/rootTypes';
import { useRootNav } from '../navigation/useRootNav';
import { useNekoCatalog } from '../hooks/useNekoCatalog';
import { scheduleFrequencyLabel } from '../domain/scheduleProjection';
import { classifyNekoType } from '../import/nekoMapping';
import {
  accountDefById,
  accountDefByName,
  activeAccountOptions,
  formatAccountPickerLabel,
} from '../domain/accounts/resolveAccounts';
import { estimateInstallmentWithInterest } from '../domain/credit/colombiaBilling';
import { useTransactions } from '../context/TransactionsContext';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { colors } from '../theme';
import type { ScheduleFrequency, TransactionKind } from '../types';

const RECURRENCE_FREQUENCIES: ScheduleFrequency[] = ['monthly', 'biweekly', 'weekly', 'once'];

const INSTALLMENT_COUNTS = [3, 6, 12, 18, 24] as const;

export function AddScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Registrar'>>();
  const { goBackRoot } = useRootNav();
  const {
    addTransaction,
    addScheduledPayment,
    addInstallmentPlan,
    addTransferPair,
    accountNames,
    accounts,
    nekoSummary,
  } = useTransactions();
  const { UNCATEGORIZED_GROUP, categoriesForGroup, allCategoryGroups } = useNekoCatalog();
  const [nekoType, setNekoType] = useState<string>('Gasto');
  const accountOptions = useMemo(() => activeAccountOptions(accounts), [accounts]);
  const [accountId, setAccountId] = useState(accountOptions[0]?.id ?? '');
  const account =
    accountOptions.find((o) => o.id === accountId)?.name ?? accountNames[0] ?? 'Efectivo';
  const [categoryGroup, setCategoryGroup] = useState('Comida y Bebida');
  const [category, setCategory] = useState('Salidas');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<ScheduleFrequency>('monthly');
  const [repeatStartDate, setRepeatStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferToAccountId, setTransferToAccountId] = useState(accountOptions[1]?.id ?? accountOptions[0]?.id ?? '');
  const transferToAccount =
    accountOptions.find((o) => o.id === transferToAccountId)?.name ??
    accountNames[1] ??
    accountNames[0] ??
    'Ahorro';
  const [transferPair, setTransferPair] = useState(true);
  const [installmentCount, setInstallmentCount] = useState(6);
  const [installmentStartDate, setInstallmentStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [postedDate, setPostedDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentReminder, setPaymentReminder] = useState(nekoType === 'Pago');

  const kind: TransactionKind = classifyNekoType(nekoType);
  const nekoSimpleForm =
    nekoType === 'Gasto' || nekoType === 'Pago' || nekoType === 'Ingreso';
  const formTitle =
    nekoType === 'Gasto'
      ? 'Agregar Gasto'
      : nekoType === 'Pago'
        ? 'Agregar Pago'
        : nekoType === 'Ingreso'
          ? 'Agregar Ingreso'
          : 'Registrar';

  useEffect(() => {
    const p = route.params;
    if (!p) {
      return;
    }
    if (p.nekoType) {
      onChangeType(p.nekoType);
      if (p.nekoType === 'Pago' || p.nekoType === 'Pago de Tarjeta' || p.nekoType === 'Pago de Préstamo') {
        setPaymentReminder(true);
      }
    }
    if (p.postedDate) {
      setPostedDate(p.postedDate);
    }
    if (p.amount && p.amount > 0) {
      setAmount(String(Math.round(p.amount)));
    }
    if (p.account) {
      const def = accountDefByName(accounts, p.account);
      if (def) {
        setAccountId(def.id);
      } else {
        const opt = accountOptions.find((o) => o.name === p.account);
        if (opt) {
          setAccountId(opt.id);
        }
      }
    }
  }, [route.params, accounts, accountOptions]);
  const isInstallmentPurchase = nekoType === 'Compra a meses';
  const categories = useMemo(
    () => categoriesForGroup(categoryGroup),
    [categoryGroup, categoriesForGroup],
  );

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
      setTransferPair(type === 'Transferencia');
    } else if (type === 'Compra a meses') {
      setCategoryGroup('Extras');
      setCategory('Compra a meses');
      setRepeatEnabled(false);
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

    if (isInstallmentPurchase && !/^\d{4}-\d{2}-\d{2}$/.test(installmentStartDate)) {
      Alert.alert('Compra a meses', 'Fecha de la primera cuota inválida (AAAA-MM-DD).');
      return;
    }

    if (repeatEnabled && kind !== 'transfer' && !/^\d{4}-\d{2}-\d{2}$/.test(repeatStartDate)) {
      Alert.alert('Recurrencia', 'Fecha de inicio inválida (AAAA-MM-DD).');
      return;
    }

    const type = kind === 'income' ? 'income' : 'expense';
    const today = postedDate;

    if (nekoType === 'Transferencia' && transferPair) {
      if (account === transferToAccount) {
        Alert.alert('Transferencia', 'Elige dos cuentas distintas.');
        return;
      }
    }

    setSaving(true);
    try {
      const group = categoryGroup === UNCATEGORIZED_GROUP ? '' : categoryGroup;
      const cat = category || nekoType;

      if (isInstallmentPurchase) {
        const cardDef = accountDefByName(accounts, account);
        const onCredit = cardDef?.kind === 'credit' && Boolean(cardDef.statementCloseDay);
        const eaForCuotas =
          cardDef?.installmentInterestEA ?? cardDef?.interestRateEA ?? 0;
        const per = onCredit
          ? estimateInstallmentWithInterest(parsed, installmentCount, eaForCuotas)
          : Math.round(parsed / installmentCount);
        const title = description.trim() || 'Compra a meses';
        const cardAcc = accountId ? accountDefById(accounts, accountId) : cardDef;
        await addTransaction({
          kind: 'expense',
          type: 'expense',
          amount: per,
          signedAmount: -per,
          postedDate: installmentStartDate,
          nekoType,
          description: `${title} (1/${installmentCount})`,
          account,
          nekoAccountId: cardAcc?.nekoSqliteId ?? cardAcc?.id,
          categoryGroup: group,
          category: cat,
          notes: notes.trim(),
          source: 'manual',
        });
        await addInstallmentPlan({
          title,
          totalAmount: parsed,
          installmentCount,
          perInstallment: per,
          account,
          categoryGroup: group,
          category: cat,
          startDate: installmentStartDate,
          purchaseDate: installmentStartDate,
          billingMode: onCredit ? 'card_statement' : 'calendar',
          statementLagMonths: onCredit
            ? (cardDef?.installmentStatementLagMonths ?? 1)
            : 0,
          active: true,
          needsCuotaReview: false,
          cuotaSource: 'manual',
        });
        setAmount('');
        setDescription('');
        setNotes('');
        Alert.alert(
          'Listo',
          onCredit
            ? `${installmentCount} cuotas (~${per.toLocaleString('es-CO')} COP c/u) en cada corte de ${account}. 1.ª en el extracto siguiente a la compra.`
            : `Compra a ${installmentCount} cuotas de ~${per.toLocaleString('es-CO')} COP. Proyección en Calendario y Plan.`,
        );
        return;
      }

      if (nekoType === 'Transferencia' && transferPair) {
        await addTransferPair({
          amount: parsed,
          postedDate: today,
          description: description.trim() || 'Transferencia',
          notes: notes.trim(),
          fromAccount: account,
          toAccount: transferToAccount,
        });
        setAmount('');
        setDescription('');
        setNotes('');
        Alert.alert('Listo', 'Transferencia registrada en las dos cuentas.');
        return;
      }

      const signed =
        kind === 'income' ? parsed : kind === 'transfer' ? -parsed : -parsed;

      const accDef = accountId ? accountDefById(accounts, accountId) : accountDefByName(accounts, account);
      await addTransaction({
        kind,
        type,
        amount: parsed,
        signedAmount: signed,
        postedDate: today,
        nekoType,
        description: description.trim(),
        account,
        nekoAccountId: accDef?.nekoSqliteId ?? accDef?.id,
        categoryGroup: group,
        category: cat,
        notes: notes.trim(),
        source: 'manual',
      });

      if (repeatEnabled && kind !== 'transfer') {
        const scheduleKind = kind === 'income' ? 'income' : 'expense';
        await addScheduledPayment({
          title: description.trim() || cat,
          kind: scheduleKind,
          amount: parsed,
          account,
          nekoType,
          categoryGroup: group,
          category: cat,
          frequency: repeatFrequency,
          startDate: repeatStartDate,
          active: true,
        });
      }

      setAmount('');
      setDescription('');
      setNotes('');
      setRepeatEnabled(false);
      Alert.alert(
        'Guardado',
        repeatEnabled && kind !== 'transfer'
          ? 'Movimiento guardado y añadido al Plan recurrente (calendario futuro).'
          : 'Movimiento registrado al estilo Neko.',
        [{ text: 'OK', onPress: () => goBackRoot() }],
      );
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
          {nekoSimpleForm ? (
            <>
              <Text style={styles.nekoTitle}>{formTitle}</Text>
              <Text style={styles.nekoMontoLabel}>MONTO</Text>
              <TextInput
                style={styles.nekoMontoInput}
                keyboardType="number-pad"
                placeholder="0,00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
              />
              <NekoFormField label="DESCRIPCIÓN" icon="document-text-outline">
                <TextInput
                  style={styles.nekoInlineInput}
                  placeholder="Descripción"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </NekoFormField>
              <NekoFormField
                label={nekoType === 'Pago' ? 'PAGAR ANTES DE' : 'FECHA DE TRANSACCIÓN'}
                icon="calendar-outline"
              >
                <TextInput
                  style={styles.nekoInlineInput}
                  value={postedDate}
                  onChangeText={setPostedDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </NekoFormField>
              <NekoFormField
                label={nekoType === 'Pago' ? 'PAGAR DESDE' : 'CUENTA'}
                icon="card-outline"
                value={account}
              />
              <View style={styles.chipWrap}>
                {accountOptions.map((opt) => (
                  <Pressable
                    key={opt.id}
                    style={[styles.categoryChip, accountId === opt.id && styles.categoryChipActive]}
                    onPress={() => setAccountId(opt.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        accountId === opt.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {formatAccountPickerLabel(accounts, opt.id)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <NekoFormField
                label="CATEGORÍA"
                icon="layers-outline"
                value={
                  category
                    ? `${categoryGroup} · ${category}`
                    : 'Selecciona categoría'
                }
              />
              {nekoType === 'Pago' ? (
                <View style={styles.repeatBlock}>
                  <View style={styles.repeatRow}>
                    <Text style={styles.repeatTitle}>Pago recurrente</Text>
                    <Switch
                      value={repeatEnabled}
                      onValueChange={setRepeatEnabled}
                      trackColor={{ false: colors.border, true: colors.accent }}
                    />
                  </View>
                  <View style={styles.repeatRow}>
                    <Text style={styles.repeatTitle}>Recordatorio</Text>
                    <Switch
                      value={paymentReminder}
                      onValueChange={setPaymentReminder}
                      trackColor={{ false: colors.border, true: colors.accent }}
                    />
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <NekoScreenHeader
                title="Registrar"
                subtitle="Agregar transacción"
                actions={[
                  {
                    icon: 'close-outline',
                    accessibilityLabel: 'Cerrar',
                    onPress: () => goBackRoot(),
                  },
                ]}
              />
              {nekoSummary ? <NekoBalanceStrip summary={nekoSummary} /> : null}
              <Text style={styles.subtitle}>Mismos campos que en NEKO: tipo, cuenta, categorías</Text>
            </>
          )}

          {!nekoSimpleForm ? (
            <>
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

          <Text style={styles.label}>CUENTA</Text>
          <View style={styles.chipWrap}>
            {accountOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.categoryChip, accountId === opt.id && styles.categoryChipActive]}
                onPress={() => setAccountId(opt.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    accountId === opt.id && styles.categoryChipTextActive,
                  ]}
                >
                  {formatAccountPickerLabel(accounts, opt.id)}
                </Text>
              </Pressable>
            ))}
          </View>
            </>
          ) : null}

          {kind !== 'transfer' ? (
            <>
              <Text style={styles.label}>Grupo de categoría</Text>
              <View style={styles.chipWrap}>
                {allCategoryGroups()
                  .filter((g) => g !== UNCATEGORIZED_GROUP)
                  .map((group) => (
                    <CategoryPickChip
                      key={group}
                      label={group}
                      active={categoryGroup === group}
                      onPress={() => onChangeGroup(group)}
                      categoryGroup={group}
                      category={categoriesForGroup(group)[0] ?? ''}
                      kind={kind}
                    />
                  ))}
              </View>

              {categories.length > 0 ? (
                <>
                  <Text style={styles.label}>Categoría</Text>
                  <View style={styles.chipWrap}>
                    {categories.map((cat) => (
                      <CategoryPickChip
                        key={cat}
                        label={cat}
                        active={category === cat}
                        onPress={() => setCategory(cat)}
                        categoryGroup={categoryGroup}
                        category={cat}
                        kind={kind}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : nekoType === 'Transferencia' ? (
            <View style={styles.transferBlock}>
              <View style={styles.repeatRow}>
                <View style={styles.repeatTextCol}>
                  <Text style={styles.repeatTitle}>Registrar las dos cuentas</Text>
                  <Text style={styles.repeatHint}>
                    Salida desde la cuenta de arriba y entrada en la cuenta destino (como en Neko).
                  </Text>
                </View>
                <Switch value={transferPair} onValueChange={setTransferPair} />
              </View>
              {transferPair ? (
                <>
                  <Text style={styles.label}>Cuenta destino</Text>
                  <View style={styles.chipWrap}>
                    {accountOptions.map((opt) => (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.categoryChip,
                          transferToAccountId === opt.id && styles.categoryChipActive,
                        ]}
                        onPress={() => setTransferToAccountId(opt.id)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            transferToAccountId === opt.id && styles.categoryChipTextActive,
                          ]}
                        >
                          {formatAccountPickerLabel(accounts, opt.id)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.transferNote}>
                  Solo se guarda un lado (como antes). Activa el interruptor para el par completo.
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.transferNote}>
              Pago de tarjeta: un solo movimiento por ahora. Importa el CSV para el historial de Neko.
            </Text>
          )}

          {isInstallmentPurchase ? (
            <View style={styles.repeatBlock}>
              <Text style={styles.repeatTitle}>Cuotas</Text>
              <Text style={styles.repeatHint}>
                En tarjeta con corte configurado, las cuotas se proyectan en cada extracto (como en
                Colombia). En efectivo/banco, van mes a mes por fecha.
              </Text>
              <View style={styles.chipWrap}>
                {INSTALLMENT_COUNTS.map((n) => (
                  <Pressable
                    key={n}
                    style={[
                      styles.categoryChip,
                      installmentCount === n && styles.categoryChipActive,
                    ]}
                    onPress={() => setInstallmentCount(n)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        installmentCount === n && styles.categoryChipTextActive,
                      ]}
                    >
                      {n} meses
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Primera cuota (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={installmentStartDate}
                onChangeText={setInstallmentStartDate}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          {!nekoSimpleForm ? (
            <>
              <Text style={styles.label}>
                {isInstallmentPurchase ? 'Monto total (COP)' : 'Monto (COP)'}
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder={isInstallmentPurchase ? 'Ej. 1200000' : 'Ej. 85000'}
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
            </>
          ) : null}

          {kind !== 'transfer' && !isInstallmentPurchase ? (
            <View style={styles.repeatBlock}>
              <View style={styles.repeatRow}>
                <View style={styles.repeatTextCol}>
                  <Text style={styles.repeatTitle}>Repetir (plan recurrente)</Text>
                  <Text style={styles.repeatHint}>
                    Como quincena o Netflix: aparece en Plan y proyecta el calendario.
                  </Text>
                </View>
                <Switch value={repeatEnabled} onValueChange={setRepeatEnabled} />
              </View>
              {repeatEnabled ? (
                <>
                  <Text style={styles.label}>Frecuencia</Text>
                  <View style={styles.chipWrap}>
                    {RECURRENCE_FREQUENCIES.map((freq) => (
                      <Pressable
                        key={freq}
                        style={[
                          styles.categoryChip,
                          repeatFrequency === freq && styles.categoryChipActive,
                        ]}
                        onPress={() => setRepeatFrequency(freq)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            repeatFrequency === freq && styles.categoryChipTextActive,
                          ]}
                        >
                          {scheduleFrequencyLabel(freq)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>Próxima fecha (AAAA-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={repeatStartDate}
                    onChangeText={setRepeatStartDate}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                </>
              ) : null}
            </View>
          ) : null}

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
            <Text style={styles.submitText}>
              {saving ? 'Guardando…' : nekoSimpleForm ? 'Guardar' : 'Guardar movimiento'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: TAB_BAR_BOTTOM_INSET, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
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
  transferBlock: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  repeatBlock: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  repeatRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  repeatTextCol: { flex: 1, gap: 4 },
  repeatTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  repeatHint: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  submit: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  nekoTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  nekoMontoLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  nekoMontoInput: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 8,
    fontFamily: 'HankenGrotesk-Regular',
  },
  nekoInlineInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 4,
  },
});
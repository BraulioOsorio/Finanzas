import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { ScreenBackHeader } from '../components/ScreenBackHeader';
import { WidgetPreviewCard } from '../components/WidgetPreviewCard';
import { IconModePreview } from '../components/IconModePreview';
import { IconModeSelector } from '../components/IconModeSelector';
import { usePreferences } from '../context/PreferencesContext';
import { clearPin, hasPinConfigured, setPin } from '../storage/appLock';
import { colors } from '../theme';

const LEAD_OPTIONS = [7, 2, 1];

export function SettingsScreen() {
  const {
    iconDisplayMode,
    setIconDisplayMode,
    creditRemindersEnabled,
    setCreditRemindersEnabled,
    reminderLeadDays,
    setReminderLeadDays,
    appLockEnabled,
    setAppLockEnabled,
    useBiometricUnlock,
    setUseBiometricUnlock,
    prefsLoading,
  } = usePreferences();
  const [draftMode, setDraftMode] = useState(iconDisplayMode);
  const [saving, setSaving] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);

  useEffect(() => {
    setDraftMode(iconDisplayMode);
  }, [iconDisplayMode]);

  useEffect(() => {
    void hasPinConfigured().then(setPinConfigured);
  }, [appLockEnabled]);

  const dirty = draftMode !== iconDisplayMode;

  const onSave = async () => {
    setSaving(true);
    try {
      await setIconDisplayMode(draftMode);
    } finally {
      setSaving(false);
    }
  };

  const toggleLead = (day: number) => {
    const has = reminderLeadDays.includes(day);
    const next = has ? reminderLeadDays.filter((d) => d !== day) : [...reminderLeadDays, day].sort((a, b) => b - a);
    void setReminderLeadDays(next.length ? next : [1]);
  };

  const savePin = async () => {
    try {
      await setPin(newPin);
      setPinConfigured(true);
      setNewPin('');
      await setAppLockEnabled(true);
      Alert.alert('Listo', 'PIN guardado. La app se bloqueará al salir.');
    } catch (e) {
      Alert.alert('PIN', e instanceof Error ? e.message : 'No se pudo guardar');
    }
  };

  const removePin = async () => {
    await clearPin();
    setPinConfigured(false);
    await setAppLockEnabled(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBackHeader />
        <NekoScreenHeader title="Ajustes" subtitle="Preferencias y seguridad" />
        <Text style={styles.subtitle}>
          Iconos, recordatorios locales, bloqueo con PIN y huella (como NEKO Modo seguro).
        </Text>

        <Text style={styles.section}>Iconos en movimientos</Text>
        {!prefsLoading ? (
          <IconModePreview draftMode={draftMode} savedMode={iconDisplayMode} />
        ) : null}
        <IconModeSelector draftMode={draftMode} onSelectDraft={setDraftMode} />
        <Pressable
          style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!dirty || saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Guardando…' : dirty ? 'Guardar modo de iconos' : 'Modo guardado'}
          </Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.cardTitle}>Recordatorios financieros</Text>
              <Text style={styles.cardBody}>Cortes, pagos, cuotas y préstamos. Todo en el teléfono.</Text>
            </View>
            <Switch
              value={creditRemindersEnabled}
              onValueChange={(v) => void setCreditRemindersEnabled(v)}
            />
          </View>
          {creditRemindersEnabled ? (
            <>
              <Text style={styles.chipLabel}>Avisar antes (días)</Text>
              <View style={styles.chipRow}>
                {LEAD_OPTIONS.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.chip, reminderLeadDays.includes(d) && styles.chipActive]}
                    onPress={() => toggleLead(d)}
                  >
                    <Text style={[styles.chipText, reminderLeadDays.includes(d) && styles.chipTextActive]}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modo seguro</Text>
          <View style={styles.switchRow}>
            <Text style={styles.cardBody}>Bloquear al minimizar la app</Text>
            <Switch
              value={appLockEnabled}
              onValueChange={(v) => {
                if (v && !pinConfigured) {
                  Alert.alert('Modo seguro', 'Guarda un PIN de 4 dígitos antes de activar el bloqueo.');
                  return;
                }
                void setAppLockEnabled(v);
              }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.cardBody}>Desbloquear con huella / Face ID</Text>
            <Switch value={useBiometricUnlock} onValueChange={(v) => void setUseBiometricUnlock(v)} />
          </View>
          <Text style={styles.cardBody}>PIN de 4 dígitos {pinConfigured ? '(configurado)' : '(sin configurar)'}</Text>
          <TextInput
            style={styles.pinInput}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="Nuevo PIN"
            placeholderTextColor={colors.textMuted}
            value={newPin}
            onChangeText={(t) => setNewPin(t.replace(/\D/g, '').slice(0, 4))}
          />
          <Pressable style={styles.secondaryBtn} onPress={() => void savePin()} disabled={newPin.length < 4}>
            <Text style={styles.secondaryBtnText}>Guardar PIN</Text>
          </Pressable>
          {pinConfigured ? (
            <Pressable onPress={() => void removePin()}>
              <Text style={styles.danger}>Quitar PIN y desactivar bloqueo</Text>
            </Pressable>
          ) : null}
        </View>

        <WidgetPreviewCard />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Presupuesto y Plan</Text>
          <Text style={styles.cardBody}>
            Informe en trimestre/año suma límites mensuales × meses. Plan cuenta en presupuesto por categoría.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  section: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  card: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20, flex: 1 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular', fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 6 },
  chipLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontWeight: '700' },
  chipTextActive: { color: colors.white },
  pinInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    letterSpacing: 6,
    textAlign: 'center',
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.accent, fontWeight: '700' },
  danger: { color: colors.expense, fontSize: 13, fontWeight: '600' },
});
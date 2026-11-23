import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconModePreview } from '../components/IconModePreview';
import { IconModeSelector } from '../components/IconModeSelector';
import { usePreferences } from '../context/PreferencesContext';
import { colors } from '../theme';

export function SettingsScreen() {
  const {
    iconDisplayMode,
    setIconDisplayMode,
    creditRemindersEnabled,
    setCreditRemindersEnabled,
    prefsLoading,
  } = usePreferences();
  const [draftMode, setDraftMode] = useState(iconDisplayMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftMode(iconDisplayMode);
  }, [iconDisplayMode]);

  const dirty = draftMode !== iconDisplayMode;

  const onSave = async () => {
    setSaving(true);
    try {
      await setIconDisplayMode(draftMode);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>
          Elige cómo ves el icono en movimientos, historial, calendario y plan. En Cuentas siempre verás el
          logo del banco. Primero previsualiza y luego guarda.
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
          <Text style={styles.cardTitle}>Categorías y cuentas</Text>
          <Text style={styles.cardBody}>
            Gestiona grupos Neko en la pestaña Categorías y bancos o tarjetas en Cuentas.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.cardTitle}>Recordatorios financieros</Text>
              <Text style={styles.cardBody}>
                Aviso local un día antes del corte, pago de tarjeta, cuota a meses o abono de préstamo
                (día en Cuentas). Sin servidor.
              </Text>
            </View>
            <Switch
              value={creditRemindersEnabled}
              onValueChange={(v) => void setCreditRemindersEnabled(v)}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pagos recurrentes</Text>
          <Text style={styles.cardBody}>
            En Registrar puedes marcar «Repetir» al guardar (quincena, suscripciones, arriendo). También
            créalos en la pestaña Plan; alimentan la proyección del calendario.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  section: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 6 },
});
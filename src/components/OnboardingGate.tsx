import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '../context/PreferencesContext';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { tokens } from '../tokens';

type Step = 0 | 1 | 2;

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { onboardingComplete, completeOnboarding, prefsLoading } = usePreferences();
  const { accounts, transactionCount } = useTransactions();
  const [step, setStep] = useState<Step>(0);

  const show = !prefsLoading && !onboardingComplete;

  const finish = () => {
    void completeOnboarding();
  };

  if (!show) {
    return children;
  }

  return (
    <>
      {children}
      <Modal visible animationType="fade" transparent>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {step === 0 ? (
              <>
                <Text style={styles.title}>Bienvenido a Finanzas</Text>
                <Text style={styles.body}>
                  Control tipo NEKO: cuentas, categorías, calendario y datos en tu teléfono. Visual con
                  nuestros tokens (colores y tipografía propios).
                </Text>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <Text style={styles.title}>Tus cuentas</Text>
                <Text style={styles.body}>
                  Tienes {accounts.filter((a) => !a.archived).length} cuentas preparadas (bancos,
                  tarjetas, efectivo). Revísalas en la pestaña Cuentas antes de empezar.
                </Text>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <Text style={styles.title}>Empieza</Text>
                <Text style={styles.body}>
                  {transactionCount > 0
                    ? 'Ya hay movimientos cargados. Explora Inicio, Historial y Calendario.'
                    : 'Configura cuentas, añade tu quincena en Plan y registra tu primer gasto.'}
                </Text>
              </>
            ) : null}

            <View style={styles.dots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
              ))}
            </View>

            <Pressable
              style={styles.primary}
              onPress={() => {
                if (step < 2) {
                  setStep((s) => (s + 1) as Step);
                } else {
                  finish();
                }
              }}
            >
              <Text style={styles.primaryText}>{step < 2 ? 'Siguiente' : 'Entrar a la app'}</Text>
            </Pressable>
            <Pressable onPress={finish} style={styles.skip}>
              <Text style={styles.skipText}>Omitir</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: tokens.space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: colors.textMuted, fontWeight: '600' },
});
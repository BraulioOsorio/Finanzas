import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRootNav } from '../navigation/useRootNav';
import type { MoreStackParamList } from '../navigation/moreTypes';

import { usePreferences } from '../context/PreferencesContext';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';
import { tokens } from '../tokens';

type Step = 0 | 1 | 2;

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { openMas } = useRootNav();
  const { onboardingComplete, completeOnboarding, prefsLoading } = usePreferences();
  const { accounts, transactionCount, addStarterAccounts } = useTransactions();
  const [step, setStep] = useState<Step>(0);

  const show = !prefsLoading && !onboardingComplete;

  const finish = () => {
    void completeOnboarding();
  };

  const goMas = (screen: keyof MoreStackParamList) => {
    finish();
    openMas(screen);
  };

  if (!show) {
    return children;
  }

  const activeCount = accounts.filter((a) => !a.archived).length;

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
                  Tus datos en el teléfono: cuentas, categorías, calendario y disponible para gastar con
                  reglas Colombia (corte, EA, deudas).
                </Text>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <Text style={styles.title}>Cuentas</Text>
                <Text style={styles.body}>
                  {activeCount > 0
                    ? `Tienes ${activeCount} cuentas. Ajústalas (cupo, corte, préstamo) en Cuentas.`
                    : 'Crea Efectivo y Bancolombia de ejemplo o importa tu CSV de NEKO.'}
                </Text>
                {activeCount === 0 ? (
                  <Pressable style={styles.secondary} onPress={() => void addStarterAccounts()}>
                    <Text style={styles.secondaryText}>Crear Efectivo + Bancolombia</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.secondary} onPress={() => goMas('Cuentas')}>
                  <Text style={styles.secondaryText}>Abrir Cuentas</Text>
                </Pressable>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <Text style={styles.title}>Movimientos</Text>
                <Text style={styles.body}>
                  {transactionCount > 0
                    ? `${transactionCount} movimientos cargados. Usa Inicio y Buscar.`
                    : 'Importa CSV o registra tu primer gasto en Registrar.'}
                </Text>
                <Pressable style={styles.secondary} onPress={() => goMas('Importar')}>
                  <Text style={styles.secondaryText}>Importar CSV NEKO</Text>
                </Pressable>
                <Pressable style={styles.secondary} onPress={() => goMas('Buscar')}>
                  <Text style={styles.secondaryText}>Buscar en toda la app</Text>
                </Pressable>
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
  title: { color: colors.text, fontSize: 22, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
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
  primaryText: { color: colors.white, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular', fontSize: 16 },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: tokens.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: colors.accent, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: colors.textMuted, fontWeight: '600' },
});
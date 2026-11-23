import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { usePreferences } from '../context/PreferencesContext';
import { hasPinConfigured, verifyPin } from '../storage/appLock';
import { colors } from '../theme';

type Props = { children: ReactNode };

export function AppLockGate({ children }: Props) {
  const { appLockEnabled, useBiometricUnlock, prefsLoading } = usePreferences();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [hasPin, setHasPin] = useState(false);

  const refreshPinState = useCallback(async () => {
    setHasPin(await hasPinConfigured());
  }, []);

  useEffect(() => {
    void refreshPinState();
  }, [refreshPinState, appLockEnabled]);

  const shouldLock = appLockEnabled && hasPin;

  const lockNow = useCallback(() => {
    if (shouldLock) {
      setLocked(true);
      setPin('');
      setError('');
    }
  }, [shouldLock]);

  useEffect(() => {
    if (!prefsLoading && shouldLock) {
      setLocked(true);
    }
  }, [prefsLoading, shouldLock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        lockNow();
      }
    });
    return () => sub.remove();
  }, [lockNow]);

  const tryBiometric = useCallback(async () => {
    if (!useBiometricUnlock) {
      return;
    }
    const hw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hw || !enrolled) {
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Finanzas',
      cancelLabel: 'Usar PIN',
    });
    if (res.success) {
      setLocked(false);
      setPin('');
      setError('');
    }
  }, [useBiometricUnlock]);

  useEffect(() => {
    if (locked && useBiometricUnlock) {
      void tryBiometric();
    }
  }, [locked, useBiometricUnlock, tryBiometric]);

  const onSubmitPin = async () => {
    const ok = await verifyPin(pin);
    if (ok) {
      setLocked(false);
      setPin('');
      setError('');
      return;
    }
    setError('PIN incorrecto');
    setPin('');
  };

  if (!shouldLock || !locked) {
    return children;
  }

  return (
    <View style={styles.wrap}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.card}>
        <Text style={styles.title}>Finanzas</Text>
        <Text style={styles.sub}>Introduce tu PIN de 4 dígitos</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          placeholderTextColor={colors.textMuted}
        />
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <Pressable
          style={[styles.btn, pin.length < 4 && styles.btnDisabled]}
          disabled={pin.length < 4}
          onPress={() => void onSubmitPin()}
        >
          <Text style={styles.btnText}>Desbloquear</Text>
        </Pressable>
        {useBiometricUnlock ? (
          <Pressable onPress={() => void tryBiometric()}>
            <Text style={styles.bio}>Huella o Face ID</Text>
          </Pressable>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular', textAlign: 'center' },
  sub: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    color: colors.text,
  },
  err: { color: colors.expense, textAlign: 'center', fontSize: 13 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.white, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  bio: { color: colors.accent, textAlign: 'center', fontWeight: '700', marginTop: 8 },
});
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { SafeToSpendHorizon } from '../domain/safeToSpend';
import type { IconDisplayMode } from '../types';
import {
  loadPreferences,
  savePreferences,
  type StoredPreferences,
} from '../storage/preferences';

type PreferencesContextValue = {
  iconDisplayMode: IconDisplayMode;
  setIconDisplayMode: (mode: IconDisplayMode) => Promise<void>;
  onboardingComplete: boolean;
  completeOnboarding: () => Promise<void>;
  creditRemindersEnabled: boolean;
  setCreditRemindersEnabled: (enabled: boolean) => Promise<void>;
  reminderLeadDays: number[];
  setReminderLeadDays: (days: number[]) => Promise<void>;
  safeToSpendHorizon: SafeToSpendHorizon;
  setSafeToSpendHorizon: (horizon: SafeToSpendHorizon) => Promise<void>;
  appLockEnabled: boolean;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  useBiometricUnlock: boolean;
  setUseBiometricUnlock: (enabled: boolean) => Promise<void>;
  prefsLoading: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [iconDisplayMode, setIconDisplayModeState] = useState<IconDisplayMode>('category');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [creditRemindersEnabled, setCreditRemindersEnabledState] = useState(false);
  const [reminderLeadDays, setReminderLeadDaysState] = useState<number[]>([7, 2, 1]);
  const [safeToSpendHorizon, setSafeToSpendHorizonState] = useState<SafeToSpendHorizon>('month_end');
  const [appLockEnabled, setAppLockEnabledState] = useState(false);
  const [useBiometricUnlock, setUseBiometricUnlockState] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (!cancelled) {
        setIconDisplayModeState(prefs.iconDisplayMode);
        setOnboardingComplete(prefs.onboardingComplete);
        setCreditRemindersEnabledState(prefs.creditRemindersEnabled);
        setReminderLeadDaysState(prefs.reminderLeadDays);
        setSafeToSpendHorizonState(prefs.safeToSpendHorizon);
        setAppLockEnabledState(prefs.appLockEnabled);
        setUseBiometricUnlockState(prefs.useBiometricUnlock);
        setPrefsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (patch: Partial<StoredPreferences>) => {
      await savePreferences({
        iconDisplayMode,
        onboardingComplete,
        creditRemindersEnabled,
        reminderLeadDays,
        safeToSpendHorizon,
        appLockEnabled,
        useBiometricUnlock,
        ...patch,
      });
    },
    [
      iconDisplayMode,
      onboardingComplete,
      creditRemindersEnabled,
      reminderLeadDays,
      safeToSpendHorizon,
      appLockEnabled,
      useBiometricUnlock,
    ],
  );

  const setIconDisplayMode = useCallback(
    async (mode: IconDisplayMode) => {
      setIconDisplayModeState(mode);
      await persist({ iconDisplayMode: mode });
    },
    [persist],
  );

  const completeOnboarding = useCallback(async () => {
    setOnboardingComplete(true);
    await persist({ onboardingComplete: true });
  }, [persist]);

  const setCreditRemindersEnabled = useCallback(
    async (enabled: boolean) => {
      setCreditRemindersEnabledState(enabled);
      await persist({ creditRemindersEnabled: enabled });
    },
    [persist],
  );

  const setReminderLeadDays = useCallback(
    async (days: number[]) => {
      setReminderLeadDaysState(days);
      await persist({ reminderLeadDays: days });
    },
    [persist],
  );

  const setSafeToSpendHorizon = useCallback(
    async (horizon: SafeToSpendHorizon) => {
      setSafeToSpendHorizonState(horizon);
      await persist({ safeToSpendHorizon: horizon });
    },
    [persist],
  );

  const setAppLockEnabled = useCallback(
    async (enabled: boolean) => {
      setAppLockEnabledState(enabled);
      await persist({ appLockEnabled: enabled });
    },
    [persist],
  );

  const setUseBiometricUnlock = useCallback(
    async (enabled: boolean) => {
      setUseBiometricUnlockState(enabled);
      await persist({ useBiometricUnlock: enabled });
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      iconDisplayMode,
      setIconDisplayMode,
      onboardingComplete,
      completeOnboarding,
      creditRemindersEnabled,
      setCreditRemindersEnabled,
      reminderLeadDays,
      setReminderLeadDays,
      safeToSpendHorizon,
      setSafeToSpendHorizon,
      appLockEnabled,
      setAppLockEnabled,
      useBiometricUnlock,
      setUseBiometricUnlock,
      prefsLoading,
    }),
    [
      iconDisplayMode,
      setIconDisplayMode,
      onboardingComplete,
      completeOnboarding,
      creditRemindersEnabled,
      setCreditRemindersEnabled,
      reminderLeadDays,
      setReminderLeadDays,
      safeToSpendHorizon,
      setSafeToSpendHorizon,
      appLockEnabled,
      setAppLockEnabled,
      useBiometricUnlock,
      setUseBiometricUnlock,
      prefsLoading,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  }
  return ctx;
}
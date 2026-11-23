import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
  prefsLoading: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [iconDisplayMode, setIconDisplayModeState] = useState<IconDisplayMode>('category');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [creditRemindersEnabled, setCreditRemindersEnabledState] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (!cancelled) {
        setIconDisplayModeState(prefs.iconDisplayMode);
        setOnboardingComplete(prefs.onboardingComplete);
        setCreditRemindersEnabledState(prefs.creditRemindersEnabled);
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
        ...patch,
      });
    },
    [iconDisplayMode, onboardingComplete, creditRemindersEnabled],
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

  const value = useMemo(
    () => ({
      iconDisplayMode,
      setIconDisplayMode,
      onboardingComplete,
      completeOnboarding,
      creditRemindersEnabled,
      setCreditRemindersEnabled,
      prefsLoading,
    }),
    [
      iconDisplayMode,
      setIconDisplayMode,
      onboardingComplete,
      completeOnboarding,
      creditRemindersEnabled,
      setCreditRemindersEnabled,
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
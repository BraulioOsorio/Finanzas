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
import { loadPreferences, savePreferences } from '../storage/preferences';

type PreferencesContextValue = {
  iconDisplayMode: IconDisplayMode;
  setIconDisplayMode: (mode: IconDisplayMode) => Promise<void>;
  prefsLoading: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [iconDisplayMode, setIconDisplayModeState] = useState<IconDisplayMode>('category');
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (!cancelled) {
        setIconDisplayModeState(prefs.iconDisplayMode);
        setPrefsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setIconDisplayMode = useCallback(async (mode: IconDisplayMode) => {
    setIconDisplayModeState(mode);
    await savePreferences({ iconDisplayMode: mode });
  }, []);

  const value = useMemo(
    () => ({ iconDisplayMode, setIconDisplayMode, prefsLoading }),
    [iconDisplayMode, setIconDisplayMode, prefsLoading],
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
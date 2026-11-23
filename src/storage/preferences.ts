import AsyncStorage from '@react-native-async-storage/async-storage';

import type { IconDisplayMode } from '../types';

const KEY = '@finanzas/preferences_v1';

export type StoredPreferences = {
  iconDisplayMode: IconDisplayMode;
  onboardingComplete: boolean;
};

const DEFAULTS: StoredPreferences = {
  iconDisplayMode: 'category',
  onboardingComplete: false,
};

export async function loadPreferences(): Promise<StoredPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    const mode = parsed.iconDisplayMode;
    const iconDisplayMode =
      mode === 'category' || mode === 'description' || mode === 'account' ? mode : DEFAULTS.iconDisplayMode;
    return {
      iconDisplayMode,
      onboardingComplete: Boolean(parsed.onboardingComplete),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function savePreferences(prefs: StoredPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
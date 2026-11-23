import AsyncStorage from '@react-native-async-storage/async-storage';

import type { IconDisplayMode } from '../types';
import type { SafeToSpendHorizon } from '../domain/safeToSpend';

const KEY = '@finanzas/preferences_v1';

export type StoredPreferences = {
  iconDisplayMode: IconDisplayMode;
  onboardingComplete: boolean;
  creditRemindersEnabled: boolean;
  safeToSpendHorizon: SafeToSpendHorizon;
};

const DEFAULTS: StoredPreferences = {
  iconDisplayMode: 'category',
  onboardingComplete: false,
  creditRemindersEnabled: false,
  safeToSpendHorizon: 'month_end',
};

function parseHorizon(value: unknown): SafeToSpendHorizon {
  if (value === 'today' || value === 'month_end' || value === 'days_14' || value === 'until_payday') {
    return value;
  }
  return DEFAULTS.safeToSpendHorizon;
}

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
      creditRemindersEnabled: Boolean(parsed.creditRemindersEnabled),
      safeToSpendHorizon: parseHorizon(parsed.safeToSpendHorizon),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function savePreferences(prefs: StoredPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { IconDisplayMode } from '../types';
import type { SafeToSpendHorizon } from '../domain/safeToSpend';

const KEY = '@finanzas/preferences_v1';

export const DEFAULT_REMINDER_LEAD_DAYS = [7, 2, 1] as const;

export type StoredPreferences = {
  iconDisplayMode: IconDisplayMode;
  onboardingComplete: boolean;
  creditRemindersEnabled: boolean;
  safeToSpendHorizon: SafeToSpendHorizon;
  reminderLeadDays: number[];
  appLockEnabled: boolean;
  useBiometricUnlock: boolean;
};

const DEFAULTS: StoredPreferences = {
  iconDisplayMode: 'category',
  onboardingComplete: false,
  creditRemindersEnabled: false,
  safeToSpendHorizon: 'month_end',
  reminderLeadDays: [...DEFAULT_REMINDER_LEAD_DAYS],
  appLockEnabled: false,
  useBiometricUnlock: true,
};

function parseHorizon(value: unknown): SafeToSpendHorizon {
  if (value === 'today' || value === 'month_end' || value === 'days_14' || value === 'until_payday') {
    return value;
  }
  return DEFAULTS.safeToSpendHorizon;
}

function parseLeadDays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [...DEFAULTS.reminderLeadDays];
  }
  const allowed = new Set([7, 2, 1]);
  const days = value.filter((n): n is number => typeof n === 'number' && allowed.has(n));
  return days.length ? [...new Set(days)].sort((a, b) => b - a) : [...DEFAULTS.reminderLeadDays];
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
      reminderLeadDays: parseLeadDays(parsed.reminderLeadDays),
      appLockEnabled: Boolean(parsed.appLockEnabled),
      useBiometricUnlock: parsed.useBiometricUnlock !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function savePreferences(prefs: StoredPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
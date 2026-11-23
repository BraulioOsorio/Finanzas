import AsyncStorage from '@react-native-async-storage/async-storage';

import type { InstallmentPlan } from '../types';

const KEY = '@finanzas/installments_v1';

export async function loadInstallmentPlans(): Promise<InstallmentPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as InstallmentPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveInstallmentPlans(items: InstallmentPlan[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}
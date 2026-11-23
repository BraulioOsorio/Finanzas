import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScheduledPayment } from '../types';

const STORAGE_KEY = '@finanzas/scheduled_v1';

export async function loadScheduledPayments(): Promise<ScheduledPayment[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ScheduledPayment[];
    return Array.isArray(parsed) ? parsed.filter((p) => p.id) : [];
  } catch {
    return [];
  }
}

export async function saveScheduledPayments(items: ScheduledPayment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
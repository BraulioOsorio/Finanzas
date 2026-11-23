import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';

const STORAGE_KEY = '@finanzas/widget_snapshot_v1';

export type WidgetSnapshot = {
  safeToSpend: number;
  liquidNow: number;
  horizonLabel: string;
  throughDate: string;
  updatedAt: string;
  cardsPayInFull: { account: string; amount: number; due?: string }[];
};

export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const json = JSON.stringify(snapshot);
  await AsyncStorage.setItem(STORAGE_KEY, json);
  try {
    const file = new File(Paths.cache, 'widget-snapshot.json');
    file.create({ overwrite: true, intermediates: true });
    await file.write(json);
  } catch {
    // Cache no disponible (web); AsyncStorage basta para módulo nativo futuro.
  }
}

export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}
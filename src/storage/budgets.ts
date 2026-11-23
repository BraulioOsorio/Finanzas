import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CategoryBudget } from '../types';

const KEY = '@finanzas/budgets_v1';

export async function loadBudgets(): Promise<CategoryBudget[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CategoryBudget[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveBudgets(items: CategoryBudget[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}
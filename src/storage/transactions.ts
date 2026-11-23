import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrateTransaction } from './migrate';
import type { Transaction } from '../types';

const STORAGE_KEY = '@finanzas/transactions_v2';

export async function loadTransactions(): Promise<Transaction[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const legacyRaw = raw ? null : await AsyncStorage.getItem('@finanzas/transactions_v1');

  const payload = raw ?? legacyRaw;
  if (!payload) {
    return [];
  }

  try {
    const parsed = JSON.parse(payload) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    const migrated = parsed
      .map(migrateTransaction)
      .filter((t): t is Transaction => t !== null);

    if (legacyRaw && migrated.length > 0) {
      await saveTransactions(migrated);
    }

    return migrated;
  } catch {
    return [];
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}
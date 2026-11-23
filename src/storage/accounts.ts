import AsyncStorage from '@react-native-async-storage/async-storage';

import { dedupeAccounts } from '../domain/accounts/dedupeAccounts';
import { buildSeedAccounts } from '../domain/accounts/seedAccounts';
import type { AccountDef } from '../types';

const KEY = '@finanzas/accounts_v1';

export async function loadAccounts(): Promise<AccountDef[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      const seed = buildSeedAccounts();
      await AsyncStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as AccountDef[];
    return Array.isArray(parsed) ? dedupeAccounts(parsed) : buildSeedAccounts();
  } catch {
    return buildSeedAccounts();
  }
}

export async function saveAccounts(accounts: AccountDef[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(dedupeAccounts(accounts)));
}
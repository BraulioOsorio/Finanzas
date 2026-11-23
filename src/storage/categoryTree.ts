import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_CATEGORY_TREE } from '../domain/nekoCatalog';

const KEY = '@finanzas/category_tree_v1';

export type CategoryTree = Record<string, string[]>;

export async function loadCategoryTree(): Promise<CategoryTree> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      const seed = cloneTree(DEFAULT_CATEGORY_TREE);
      await AsyncStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as CategoryTree;
    return parsed && typeof parsed === 'object' ? parsed : cloneTree(DEFAULT_CATEGORY_TREE);
  } catch {
    return cloneTree(DEFAULT_CATEGORY_TREE);
  }
}

export async function saveCategoryTree(tree: CategoryTree): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(tree));
}

function cloneTree(src: Record<string, readonly string[]>): CategoryTree {
  const out: CategoryTree = {};
  for (const [g, cats] of Object.entries(src)) {
    out[g] = [...cats];
  }
  return out;
}
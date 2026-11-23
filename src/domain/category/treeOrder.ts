import type { CategoryTree } from '../../storage/categoryTree';

export function orderedGroupKeys(tree: CategoryTree): string[] {
  return Object.keys(tree);
}

export function reorderGroup(tree: CategoryTree, group: string, delta: -1 | 1): CategoryTree {
  const keys = orderedGroupKeys(tree);
  const idx = keys.indexOf(group);
  if (idx < 0) {
    return tree;
  }
  const next = idx + delta;
  if (next < 0 || next >= keys.length) {
    return tree;
  }
  const swapped = [...keys];
  [swapped[idx], swapped[next]] = [swapped[next], swapped[idx]];
  const out: CategoryTree = {};
  for (const k of swapped) {
    out[k] = tree[k];
  }
  return out;
}

export function reorderCategoryInGroup(tree: CategoryTree, group: string, category: string, delta: -1 | 1): CategoryTree {
  const list = [...(tree[group] ?? [])];
  const idx = list.indexOf(category);
  if (idx < 0) {
    return tree;
  }
  const next = idx + delta;
  if (next < 0 || next >= list.length) {
    return tree;
  }
  [list[idx], list[next]] = [list[next], list[idx]];
  return { ...tree, [group]: list };
}

export function renameGroupKey(tree: CategoryTree, from: string, to: string): CategoryTree | null {
  if (!tree[from] || tree[to]) {
    return null;
  }
  const keys = orderedGroupKeys(tree);
  const out: CategoryTree = {};
  for (const k of keys) {
    if (k === from) {
      out[to] = tree[from];
    } else {
      out[k] = tree[k];
    }
  }
  return out;
}
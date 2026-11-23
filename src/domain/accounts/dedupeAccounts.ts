import type { AccountDef } from '../../types';

function accountScore(a: AccountDef): number {
  let s = 0;
  if (a.nekoSqliteId) {
    s += 8;
  }
  if (a.nekoOpeningBalance != null && Number.isFinite(a.nekoOpeningBalance)) {
    s += 4;
  }
  if (a.nekoAccountTypeId != null) {
    s += 2;
  }
  if (!a.id.startsWith('acc-seed-')) {
    s += 1;
  }
  return s;
}

/** Elimina cuentas repetidas por `id` y reasigna ids si hiciera falta. */
export function dedupeAccounts(accounts: AccountDef[]): AccountDef[] {
  const byId = new Map<string, AccountDef>();
  for (const a of accounts) {
    const prev = byId.get(a.id);
    if (!prev) {
      byId.set(a.id, a);
      continue;
    }
    byId.set(a.id, accountScore(a) >= accountScore(prev) ? a : prev);
  }

  const usedIds = new Set<string>();
  const result: AccountDef[] = [];

  for (const a of byId.values()) {
    let id = a.id;
    if (a.nekoSqliteId && a.id !== a.nekoSqliteId) {
      id = a.nekoSqliteId;
    }
    if (usedIds.has(id)) {
      id = a.nekoSqliteId ?? `${a.id}-${usedIds.size}`;
    }
    while (usedIds.has(id)) {
      id = `${id}-x${usedIds.size}`;
    }
    usedIds.add(id);
    result.push(id === a.id ? a : { ...a, id, nekoSqliteId: a.nekoSqliteId ?? id });
  }

  const nekoNames = new Set(
    result
      .filter((a) => a.nekoSqliteId != null || a.nekoOpeningBalance != null)
      .map((a) => a.name.trim().toLowerCase()),
  );
  const withoutStaleSeed = result.filter((a) => {
    if (!a.id.startsWith('acc-seed-')) {
      return true;
    }
    return !nekoNames.has(a.name.trim().toLowerCase());
  });

  return withoutStaleSeed.sort((x, y) => x.name.localeCompare(y.name, 'es'));
}
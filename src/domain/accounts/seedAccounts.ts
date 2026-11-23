import { DEFAULT_ACCOUNTS } from '../nekoCatalog';
import { applyCreditPresetToDraft } from '../credit/creditPresets';
import { defaultLiquidForKind, inferAccountKind } from './inferAccountKind';
import type { AccountDef } from '../../types';

export function buildSeedAccounts(): AccountDef[] {
  return DEFAULT_ACCOUNTS.map((name, index) => {
    const kind = inferAccountKind(name);
    const base: AccountDef = {
      id: `acc-seed-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      kind,
      liquid: defaultLiquidForKind(kind),
      notes: '',
      archived: false,
    };
    if (kind === 'credit') {
      return { ...base, ...applyCreditPresetToDraft(name, base) };
    }
    return base;
  });
}
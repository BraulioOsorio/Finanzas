import { DEFAULT_ACCOUNTS } from '../nekoCatalog';
import { defaultLiquidForKind, inferAccountKind } from './inferAccountKind';
import type { AccountDef } from '../../types';

export function buildSeedAccounts(): AccountDef[] {
  return DEFAULT_ACCOUNTS.map((name, index) => {
    const kind = inferAccountKind(name);
    return {
      id: `acc-seed-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      kind,
      liquid: defaultLiquidForKind(kind),
      notes: '',
      archived: false,
    };
  });
}
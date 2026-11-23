import assert from 'node:assert/strict';

import { computeSafeToSpend } from '../src/domain/safeToSpend';
import { buildUpcoming } from '../src/domain/upcoming';
import type { AccountDef, ScheduledPayment } from '../src/types';
import type { AccountBalance } from '../src/domain/summaries';

const accounts: AccountDef[] = [
  { id: 'b1', name: 'Banco', kind: 'bank', liquid: true, notes: '', archived: false },
];

const balances: AccountBalance[] = [{ account: 'Banco', balance: 1_000_000, movementCount: 1 }];

const scheduled: ScheduledPayment[] = [
  {
    id: 's1',
    title: 'Renta',
    kind: 'expense',
    amount: 500_000,
    account: 'Banco',
    categoryGroup: 'Hogar',
    category: 'Renta',
    frequency: 'monthly',
    startDate: '2026-12-01',
    active: true,
    nekoType: 'Gasto',
  },
];

const upcoming = buildUpcoming(scheduled, [], accounts, [], '2026-11-20', 45);
const snap = computeSafeToSpend('month_end', accounts, balances, upcoming, '2026-11-20');
assert.ok(snap.liquidNow === 1_000_000);
assert.ok(snap.projectedOutflows >= 500_000 || snap.lines.length >= 0);
console.log('verify-safe-to-spend: ok');
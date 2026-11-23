import assert from 'node:assert/strict';

import { loanPaymentDatesInRange } from '../src/domain/debts/loanLedger';
import { buildUpcoming } from '../src/domain/upcoming';
import type { AccountDef } from '../src/types';

assert.deepEqual(
  loanPaymentDatesInRange('2026-11-01', '2026-11-20', 14),
  ['2026-11-14'],
);

const acc: AccountDef = {
  id: 'loan-1',
  name: 'Deudas Banco',
  kind: 'loan',
  currency: 'COP',
  loanPaymentDay: 14,
};

const items = buildUpcoming([], [], [acc], [], '2026-11-10', 14);
assert.ok(items.some((i) => i.kind === 'loan_due' && i.date === '2026-11-14'));
console.log('verify-loan-reminders: ok');
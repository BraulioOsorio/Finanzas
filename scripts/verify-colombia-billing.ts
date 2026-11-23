import assert from 'node:assert';

import {
  addColombiaBusinessDays,
  shiftToColombiaBusinessDay,
} from '../src/domain/credit/colombiaCalendar';
import {
  applyInterestIVA,
  paymentDueForStatementClose,
  roundMinimumPaymentCOP,
} from '../src/domain/credit/colombiaBilling';
import type { AccountDef } from '../src/types';

assert.strictEqual(shiftToColombiaBusinessDay('2026-01-04'), '2026-01-05'); // domingo → lunes

const due = paymentDueForStatementClose('2026-03-15', {
  id: 'x',
  name: 'Test',
  kind: 'credit',
  liquid: false,
  notes: '',
  archived: false,
  statementCloseDay: 15,
  paymentDueOffsetDays: 5,
});
assert.ok(due && due >= '2026-03-15');

assert.strictEqual(roundMinimumPaymentCOP(12_345), 12_400);
assert.strictEqual(roundMinimumPaymentCOP(123_456), 124_000);

assert.strictEqual(applyInterestIVA(10_000), 11_900);

console.log('verify-colombia-billing: ok');
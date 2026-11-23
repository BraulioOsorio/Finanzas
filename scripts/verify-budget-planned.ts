import assert from 'node:assert/strict';

import { budgetProgressForMonth } from '../src/domain/budgets';
import type { CategoryBudget, ScheduledPayment, Transaction } from '../src/types';

const month = '2026-11';
const budget: CategoryBudget = {
  id: 'b1',
  categoryGroup: 'Hogar',
  category: 'Renta',
  monthlyLimit: 1_000_000,
  active: true,
};

const scheduled: ScheduledPayment[] = [
  {
    id: 's1',
    title: 'Renta',
    kind: 'expense',
    amount: 800_000,
    account: 'Banco',
    categoryGroup: 'Hogar',
    category: 'Renta',
    frequency: 'monthly',
    startDate: '2026-01-15',
    active: true,
    nekoType: 'Gasto',
  },
];

const txs: Transaction[] = [
  {
    id: '1',
    kind: 'expense',
    type: 'expense',
    amount: 100_000,
    signedAmount: -100_000,
    postedDate: '2026-11-05',
    createdAt: '',
    nekoType: 'Gasto',
    description: 'Aseo',
    account: 'Banco',
    categoryGroup: 'Hogar',
    category: 'Renta',
    notes: '',
    source: 'manual',
  },
];

const prog = budgetProgressForMonth([budget], txs, month, {
  includePlanned: true,
  scheduled,
});
assert.equal(prog[0].spent, 100_000);
assert.equal(prog[0].plannedSpend, 800_000);
assert.equal(prog[0].effectiveSpent, 900_000);
console.log('verify-budget-planned: ok');
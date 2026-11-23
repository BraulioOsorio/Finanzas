import type { BudgetProgress } from './budgets';
import type { Transaction } from '../types';

/** Presupuestos que este gasto del día acerca o supera el límite del mes. */
export function budgetsTouchedByTransactions(
  dayTransactions: Transaction[],
  progress: BudgetProgress[],
): BudgetProgress[] {
  if (!dayTransactions.length || !progress.length) {
    return [];
  }
  const touched: BudgetProgress[] = [];
  for (const p of progress) {
    const matches = dayTransactions.some((t) => {
      if (t.kind !== 'expense') {
        return false;
      }
      if (t.categoryGroup.trim() !== p.budget.categoryGroup.trim()) {
        return false;
      }
      if (p.budget.category.trim()) {
        return t.category.trim() === p.budget.category.trim();
      }
      return true;
    });
    if (matches && p.ratio >= 0.75) {
      touched.push(p);
    }
  }
  return touched.sort((a, b) => b.ratio - a.ratio);
}
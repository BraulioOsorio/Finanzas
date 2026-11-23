import { currentMonthKey } from './summaries';
import type { CategoryBudget, Transaction } from '../types';

export type BudgetProgress = {
  budget: CategoryBudget;
  label: string;
  spent: number;
  limit: number;
  ratio: number;
  monthKey: string;
};

function matchesBudget(t: Transaction, b: CategoryBudget, monthKey: string): boolean {
  if (t.kind !== 'expense' || !t.postedDate.startsWith(monthKey)) {
    return false;
  }
  const group = t.categoryGroup.trim();
  if (group !== b.categoryGroup.trim()) {
    return false;
  }
  if (b.category.trim()) {
    return t.category.trim() === b.category.trim();
  }
  return true;
}

export function budgetProgressForMonth(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  monthKey = currentMonthKey(),
): BudgetProgress[] {
  return budgets
    .filter((b) => b.active && b.monthlyLimit > 0)
    .map((budget) => {
      const spent = transactions
        .filter((t) => matchesBudget(t, budget, monthKey))
        .reduce((sum, t) => sum + t.amount, 0);
      const label = budget.category.trim()
        ? `${budget.categoryGroup} › ${budget.category}`
        : budget.categoryGroup;
      return {
        budget,
        label,
        spent,
        limit: budget.monthlyLimit,
        ratio: budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0,
        monthKey,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}
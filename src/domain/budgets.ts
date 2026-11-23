import { installmentsInRange, resolveInstallmentAccount } from './installments';
import { occurrencesInRange } from './scheduleProjection';
import { daysInMonth } from './calendar';
import { currentMonthKey } from './summaries';
import type { AccountDef, CategoryBudget, InstallmentPlan, ScheduledPayment, Transaction } from '../types';

export type BudgetProgress = {
  budget: CategoryBudget;
  label: string;
  spent: number;
  plannedSpend: number;
  effectiveSpent: number;
  limit: number;
  ratio: number;
  monthKey: string;
};

export type BudgetProgressOptions = {
  includePlanned?: boolean;
  scheduled?: ScheduledPayment[];
  installmentPlans?: InstallmentPlan[];
  accounts?: AccountDef[];
};

function monthEnd(monthKey: string): string {
  const d = daysInMonth(monthKey);
  return `${monthKey}-${String(d).padStart(2, '0')}`;
}

function matchesBudgetTransaction(t: Transaction, b: CategoryBudget, monthKey: string): boolean {
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

function matchesBudgetCategory(
  group: string,
  category: string,
  b: CategoryBudget,
): boolean {
  if (group.trim() !== b.categoryGroup.trim()) {
    return false;
  }
  if (b.category.trim()) {
    return category.trim() === b.category.trim();
  }
  return true;
}

function plannedForBudget(
  budget: CategoryBudget,
  monthKey: string,
  scheduled: ScheduledPayment[],
  installmentPlans: InstallmentPlan[],
  accounts: AccountDef[],
): number {
  const start = `${monthKey}-01`;
  const end = monthEnd(monthKey);
  let sum = 0;

  for (const s of scheduled) {
    if (!s.active || s.kind !== 'expense') {
      continue;
    }
    if (!matchesBudgetCategory(s.categoryGroup, s.category, budget)) {
      continue;
    }
    const dates = occurrencesInRange(s, start, end);
    sum += dates.length * s.amount;
  }

  for (const plan of installmentPlans) {
    if (!plan.active) {
      continue;
    }
    if (!matchesBudgetCategory(plan.categoryGroup, plan.category, budget)) {
      continue;
    }
    const acc = resolveInstallmentAccount(plan, accounts);
    const hits = installmentsInRange(plan, start, end, acc);
    sum += hits.length * plan.perInstallment;
  }

  return sum;
}

function spentForBudgetBetween(
  transactions: Transaction[],
  budget: CategoryBudget,
  start: string,
  end: string,
): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.kind !== 'expense' || t.postedDate < start || t.postedDate > end) {
      continue;
    }
    const group = t.categoryGroup.trim();
    if (group !== budget.categoryGroup.trim()) {
      continue;
    }
    if (budget.category.trim() && t.category.trim() !== budget.category.trim()) {
      continue;
    }
    sum += t.amount;
  }
  return sum;
}

/** Presupuesto multi-mes: límite = monthlyLimit × nº de meses en el rango. */
export function budgetProgressForDateRange(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  start: string,
  end: string,
  monthKeysInRange: string[],
  options: BudgetProgressOptions = {},
): BudgetProgress[] {
  const includePlanned = options.includePlanned !== false;
  const scheduled = options.scheduled ?? [];
  const installmentPlans = options.installmentPlans ?? [];
  const accounts = options.accounts ?? [];
  const monthCount = Math.max(1, monthKeysInRange.length);

  return budgets
    .filter((b) => b.active && b.monthlyLimit > 0)
    .map((budget) => {
      const spent = spentForBudgetBetween(transactions, budget, start, end);
      let plannedSpend = 0;
      if (includePlanned) {
        for (const mk of monthKeysInRange) {
          plannedSpend += plannedForBudget(budget, mk, scheduled, installmentPlans, accounts);
        }
      }
      const limit = budget.monthlyLimit * monthCount;
      const effectiveSpent = spent + plannedSpend;
      const label = budget.category.trim()
        ? `${budget.categoryGroup} › ${budget.category}`
        : budget.categoryGroup;
      return {
        budget,
        label,
        spent,
        plannedSpend,
        effectiveSpent,
        limit,
        ratio: limit > 0 ? effectiveSpent / limit : 0,
        monthKey: monthKeysInRange[0] ?? '',
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export function budgetProgressForMonth(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  monthKey = currentMonthKey(),
  options: BudgetProgressOptions = {},
): BudgetProgress[] {
  const includePlanned = options.includePlanned !== false;
  const scheduled = options.scheduled ?? [];
  const installmentPlans = options.installmentPlans ?? [];
  const accounts = options.accounts ?? [];

  return budgets
    .filter((b) => b.active && b.monthlyLimit > 0)
    .map((budget) => {
      const spent = transactions
        .filter((t) => matchesBudgetTransaction(t, budget, monthKey))
        .reduce((sum, t) => sum + t.amount, 0);
      const plannedSpend = includePlanned
        ? plannedForBudget(budget, monthKey, scheduled, installmentPlans, accounts)
        : 0;
      const effectiveSpent = spent + plannedSpend;
      const label = budget.category.trim()
        ? `${budget.categoryGroup} › ${budget.category}`
        : budget.categoryGroup;
      return {
        budget,
        label,
        spent,
        plannedSpend,
        effectiveSpent,
        limit: budget.monthlyLimit,
        ratio: budget.monthlyLimit > 0 ? effectiveSpent / budget.monthlyLimit : 0,
        monthKey,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}
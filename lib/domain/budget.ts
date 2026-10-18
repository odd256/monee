import { isBillInCategoryTree } from "./categories";
import { monthRange, yearRange } from "./date";
import type { Bill, Budget, Category } from "./types";

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percent: number;
  start: number;
  end: number;
}

export function budgetRange(
  budget: Budget,
  now = Date.now(),
): [number, number] {
  return budget.period === "year" ? yearRange(now) : monthRange(now);
}

export function calculateBudget(
  budget: Budget,
  bills: Bill[],
  categories: Category[],
  now = Date.now(),
): BudgetProgress {
  const [start, end] = budgetRange(budget, now);
  const categoryIds = budget.categoryIds ?? [];
  const spent = bills.reduce((sum, bill) => {
    if (bill.deletedAt || bill.type !== "expense") return sum;
    if (bill.time < start || bill.time >= end) return sum;
    if (
      categoryIds.length > 0 &&
      !isBillInCategoryTree(categories, bill.categoryId, categoryIds)
    ) {
      return sum;
    }
    return sum + bill.amount;
  }, 0);
  const remaining = budget.amount - spent;
  const percent =
    budget.amount > 0 ? Math.min(999, (spent / budget.amount) * 100) : 0;
  return { budget, spent, remaining, percent, start, end };
}

export function calculateBudgets(
  budgets: Budget[],
  bills: Bill[],
  categories: Category[],
  now = Date.now(),
): BudgetProgress[] {
  return budgets
    .filter((budget) => !budget.deletedAt)
    .map((budget) => calculateBudget(budget, bills, categories, now));
}

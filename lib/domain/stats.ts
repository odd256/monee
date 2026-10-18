import { categoryById, rootCategory, type CategoryTotal } from "./categories";
import { dayjs } from "./date";
import type { Bill, BillType, Category } from "./types";

export interface Summary {
  income: number;
  expense: number;
  balance: number;
}

export function activeBills(bills: Bill[]): Bill[] {
  return bills.filter((bill) => !bill.deletedAt);
}

export function filterByRange(
  bills: Bill[],
  start: number,
  end: number,
): Bill[] {
  return bills.filter((bill) => bill.time >= start && bill.time < end);
}

export function summarize(bills: Bill[]): Summary {
  let income = 0;
  let expense = 0;
  for (const bill of bills) {
    if (bill.deletedAt) continue;
    if (bill.type === "income") income += bill.amount;
    else expense += bill.amount;
  }
  return { income, expense, balance: income - expense };
}

export function summarizeByType(bills: Bill[], type: BillType): number {
  return bills.reduce(
    (sum, bill) => (bill.type === type && !bill.deletedAt ? sum + bill.amount : sum),
    0,
  );
}

/**
 * Aggregate bills into top-level categories. Children roll up into their
 * parent so the pie chart stays readable.
 */
export function aggregateByCategory(
  bills: Bill[],
  categories: Category[],
  type: BillType = "expense",
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const bill of bills) {
    if (bill.deletedAt || bill.type !== type) continue;
    const category = categoryById(categories, bill.categoryId);
    const key = category ? rootCategory(categories, category).id : "__uncategorized__";
    totals.set(key, (totals.get(key) ?? 0) + bill.amount);
  }
  return Array.from(totals.entries())
    .map(([id, amount]) => ({
      category:
        id === "__uncategorized__"
          ? undefined
          : categoryById(categories, id) ??
            categories.find((category) => category.id === id),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface DayTotal {
  day: number;
  income: number;
  expense: number;
}

export function aggregateByDay(
  bills: Bill[],
  start: number,
  end: number,
): DayTotal[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const days: DayTotal[] = [];
  for (let cursor = start; cursor < end; cursor += dayMs) {
    days.push({ day: cursor, income: 0, expense: 0 });
  }
  const first = days[0]?.day ?? start;
  for (const bill of bills) {
    if (bill.deletedAt) continue;
    const index = Math.floor((bill.time - first) / dayMs);
    const bucket = days[index];
    if (!bucket) continue;
    if (bill.type === "income") bucket.income += bill.amount;
    else bucket.expense += bill.amount;
  }
  return days;
}

export interface MonthTotal {
  month: number;
  income: number;
  expense: number;
}

/** Monthly totals for the year chart. `start` is the first day of the year. */
export function aggregateByMonth(
  bills: Bill[],
  start: number,
): MonthTotal[] {
  const months: MonthTotal[] = Array.from({ length: 12 }, (_, index) => ({
    month: dayjs(start).add(index, "month").valueOf(),
    income: 0,
    expense: 0,
  }));
  for (const bill of bills) {
    if (bill.deletedAt) continue;
    const index = dayjs(bill.time).diff(dayjs(start), "month");
    const bucket = months[index];
    if (!bucket) continue;
    if (bill.type === "income") bucket.income += bill.amount;
    else bucket.expense += bill.amount;
  }
  return months;
}

export function topBills(
  bills: Bill[],
  type: BillType,
  limit = 5,
): Bill[] {
  return bills
    .filter((bill) => !bill.deletedAt && bill.type === type)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function countBills(bills: Bill[]): number {
  return bills.filter((bill) => !bill.deletedAt).length;
}

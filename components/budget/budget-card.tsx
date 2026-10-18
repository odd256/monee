"use client";

import { Card } from "@heroui/react";
import { Pencil } from "lucide-react";
import type { BudgetProgress } from "@/lib/domain/budget";
import { formatMoney } from "@/lib/domain/money";
import type { Category } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

export function BudgetCard({
  progress,
  categories,
  onEdit,
}: {
  progress: BudgetProgress;
  categories: Category[];
  onEdit: () => void;
}) {
  const { budget, spent, remaining, percent } = progress;
  const barColor =
    percent >= 100
      ? "bg-danger"
      : percent >= 80
        ? "bg-warning"
        : "bg-accent";
  const selectedCategories = (budget.categoryIds ?? [])
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => Boolean(category));

  return (
    <Card className="transition-colors hover:bg-surface">
      <Card.Content className="gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{budget.name}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {budget.period === "month" ? "每月预算" : "每年预算"}
              {selectedCategories.length > 0
                ? ` · ${selectedCategories.map((category) => category.name).join("、")}`
                : " · 全部分类"}
            </p>
          </div>
          <button
            type="button"
            aria-label="编辑预算"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="font-medium tabular-nums">
              {formatMoney(spent, budget.currency)}
            </span>
            <span className="text-muted">
              预算 {formatMoney(budget.amount, budget.currency)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {remaining >= 0
              ? `还可花 ${formatMoney(remaining, budget.currency)}`
              : `已超支 ${formatMoney(Math.abs(remaining), budget.currency)}`}
            {" · "}
            {percent.toFixed(0)}%
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}

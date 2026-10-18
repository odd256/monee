"use client";

import { Card } from "@heroui/react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { categoryById } from "@/lib/domain/categories";
import { formatDayShort } from "@/lib/domain/date";
import { formatMoney } from "@/lib/domain/money";
import type { Bill, Category } from "@/lib/domain/types";

export function TopExpenses({
  bills,
  categories,
}: {
  bills: Bill[];
  categories: Category[];
}) {
  if (bills.length === 0) return null;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm">单笔支出</Card.Title>
      </Card.Header>
      <Card.Content className="divide-y divide-separator p-0">
        {bills.map((bill) => {
          const category = categoryById(categories, bill.categoryId);
          return (
            <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${category?.color ?? "#64748b"}1f`,
                  color: category?.color ?? "#64748b",
                }}
              >
                <CategoryIcon name={category?.icon ?? "ellipsis"} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{category?.name ?? "未分类"}</p>
                <p className="truncate text-[11px] text-muted">
                  {formatDayShort(bill.time)}
                  {bill.note ? ` · ${bill.note}` : ""}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {formatMoney(bill.amount, bill.currency)}
              </span>
            </div>
          );
        })}
      </Card.Content>
    </Card>
  );
}

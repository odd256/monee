"use client";

import { CategoryIcon } from "@/components/ui/category-icon";
import { formatMoney } from "@/lib/domain/money";
import { formatTime } from "@/lib/domain/date";
import { categoryLabel } from "@/lib/domain/categories";
import type { Bill, Category } from "@/lib/domain/types";
import { useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils/cn";

export function BillItem({
  bill,
  categories,
}: {
  bill: Bill;
  categories: Category[];
}) {
  const openEdit = useEditorStore((state) => state.openEdit);
  const category = categories.find((item) => item.id === bill.categoryId);
  const color = category?.color ?? "#64748b";

  return (
    <button
      type="button"
      onClick={() => openEdit(bill.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <CategoryIcon name={category?.icon ?? "ellipsis"} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {categoryLabel(categories, bill)}
          </span>
          <span className="shrink-0 text-[11px] text-muted">
            {formatTime(bill.time)}
          </span>
        </span>
        {bill.note ? (
          <span className="mt-0.5 block truncate text-xs text-muted">
            {bill.note}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          bill.type === "income" ? "text-success" : "text-foreground",
        )}
      >
        {bill.type === "income" ? "+" : "-"}
        {formatMoney(bill.amount, bill.currency)}
      </span>
    </button>
  );
}

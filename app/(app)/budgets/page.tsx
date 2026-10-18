"use client";

import { useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@heroui/react";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetEditor } from "@/components/budget/budget-editor";
import { EmptyState } from "@/components/ui/empty-state";
import { useBillsRange } from "@/hooks/use-bills-range";
import { calculateBudgets } from "@/lib/domain/budget";
import { yearRange } from "@/lib/domain/date";
import type { Budget } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store/app-store";

export default function BudgetsPage() {
  const bookId = useAppStore((state) => state.currentBookId);
  const meta = useAppStore((state) => state.meta);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | undefined>(undefined);

  const [now] = useState(() => Date.now());
  const [start, end] = useMemo(() => yearRange(now), [now]);
  const { bills, loading } = useBillsRange(bookId, start, end);
  const categories = meta?.categories ?? [];
  const budgets = calculateBudgets(meta?.budgets ?? [], bills, categories);

  const openNew = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          预算按自然月/年统计，超支会标红。
        </p>
        <Button size="sm" onPress={openNew}>
          <Plus className="size-4" />
          新建预算
        </Button>
      </div>

      {loading && budgets.length === 0 ? (
        <div className="h-32 animate-pulse rounded-2xl bg-surface" />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="还没有预算"
          description="给每个月设一个上限，花到 80% 时会有提醒。"
          action={
            <Button size="sm" onPress={openNew}>
              <Plus className="size-4" />
              新建预算
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets.map((progress) => (
            <BudgetCard
              key={progress.budget.id}
              progress={progress}
              categories={categories}
              onEdit={() => {
                setEditing(progress.budget);
                setEditorOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <BudgetEditor
        open={editorOpen}
        budget={editing}
        onOpenChange={(next) => {
          setEditorOpen(next);
          if (!next) setEditing(undefined);
        }}
      />
    </div>
  );
}

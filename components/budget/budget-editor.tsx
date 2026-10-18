"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The drawer form is reset when it opens. */
import { useEffect, useState } from "react";
import { Drawer, Button, toast } from "@heroui/react";
import { Check, Trash2 } from "lucide-react";
import { topLevelCategories } from "@/lib/domain/categories";
import {
  currencySymbol,
  formatAmountInput,
  parseAmountInput,
} from "@/lib/domain/money";
import type { Budget, BudgetPeriod } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils/cn";
import { newId } from "@/lib/utils/id";

export function BudgetEditor({
  open,
  budget,
  onOpenChange,
}: {
  open: boolean;
  budget?: Budget;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = useAppStore((state) => state.meta);
  const saveMeta = useAppStore((state) => state.saveMeta);
  const [name, setName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("month");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = topLevelCategories(
    meta?.categories ?? [],
    "expense",
  );

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (budget) {
      setName(budget.name);
      setAmountText(formatAmountInput(budget.amount, budget.currency));
      setPeriod(budget.period);
      setCategoryIds(budget.categoryIds ?? []);
    } else {
      setName("月度预算");
      setAmountText("");
      setPeriod("month");
      setCategoryIds([]);
    }
  }, [open, budget]);

  const toggleCategory = (id: string) => {
    setCategoryIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const save = async () => {
    const amount = parseAmountInput(amountText, meta?.baseCurrency ?? "CNY");
    if (!name.trim()) {
      toast.warning("请填写预算名称");
      return;
    }
    if (amount <= 0) {
      toast.warning("请输入预算金额");
      return;
    }
    setSaving(true);
    try {
      const now = Date.now();
      const next: Budget = {
        id: budget?.id ?? newId(),
        name: name.trim(),
        amount,
        currency: meta?.baseCurrency ?? "CNY",
        period,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        updatedAt: now,
      };
      await saveMeta((current) => ({
        ...current,
        budgets: budget
          ? current.budgets.map((item) => (item.id === budget.id ? next : item))
          : [...current.budgets, next],
      }));
      toast.success(budget ? "预算已更新" : "预算已创建");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.danger("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!budget) return;
    await saveMeta((current) => ({
      ...current,
      budgets: current.budgets.filter((item) => item.id !== budget.id),
    }));
    toast.success("预算已删除");
    onOpenChange(false);
  };

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="max-h-[90dvh]">
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>{budget ? "编辑预算" : "新建预算"}</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4 pb-4">
            <label className="block">
              <span className="text-xs text-muted">名称</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={24}
                className="mt-1 h-11 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
                placeholder="例如：餐饮预算"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted">金额</span>
              <div className="mt-1 flex h-11 items-center rounded-field border border-field-border bg-field px-3">
                <span className="mr-1 text-sm text-muted">
                  {currencySymbol(meta?.baseCurrency ?? "CNY")}
                </span>
                <input
                  value={amountText}
                  onChange={(event) =>
                    setAmountText(
                      event.target.value.replace(/[^\d.]/g, "").slice(0, 12),
                    )
                  }
                  inputMode="decimal"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="0.00"
                />
              </div>
            </label>

            <div>
              <span className="text-xs text-muted">周期</span>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
                {(["month", "year"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium transition-colors",
                      period === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted",
                    )}
                  >
                    {value === "month" ? "每月" : "每年"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">适用分类</span>
                <span className="text-[11px] text-muted">
                  {categoryIds.length === 0 ? "全部分类" : `已选 ${categoryIds.length}`}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((category) => {
                  const selected = categoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        selected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-separator text-muted hover:text-foreground",
                      )}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                不选择分类时，预算统计全部支出。
              </p>
            </div>
          </Drawer.Body>
          <Drawer.Footer className="flex-col gap-2">
            <Button
              fullWidth
              isPending={saving}
              isDisabled={saving}
              onPress={() => void save()}
            >
              {saving ? null : <Check className="size-4" />}
              {saving ? "保存中…" : "保存"}
            </Button>
            {budget ? (
              confirmDelete ? (
                <div className="flex w-full gap-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    onPress={() => setConfirmDelete(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onPress={() => void remove()}
                  >
                    确认删除
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  fullWidth
                  className="text-danger"
                  onPress={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  删除预算
                </Button>
              )
            ) : null}
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

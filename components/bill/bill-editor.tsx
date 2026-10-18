"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The drawer form is reset when it opens. */
import { useEffect, useMemo, useState } from "react";
import { Drawer, Button, toast } from "@heroui/react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getBill } from "@/lib/db/bills-repo";
import {
  categoryById,
  childrenOf,
  defaultCategoryForType,
  rootCategory,
  topLevelCategories,
} from "@/lib/domain/categories";
import {
  currencySymbol,
  formatAmountInput,
  formatMoneyPlain,
  parseAmountInput,
} from "@/lib/domain/money";
import {
  fromDateInputValue,
  toDateInputValue,
} from "@/lib/domain/date";
import type { Bill, BillType, Category } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store/app-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { useLedgerStore } from "@/lib/store/ledger-store";
import type { BillInput } from "@/lib/store/ledger-store";
import { cn } from "@/lib/utils/cn";
import { AmountKeypad } from "./amount-keypad";

function applyDigit(previous: string, digit: string): string {
  if (digit === ".") {
    if (previous.includes(".")) return previous;
    return `${previous || "0"}.`;
  }
  const [, fraction] = previous.split(".");
  if (fraction !== undefined && fraction.length >= 2) return previous;
  if (previous === "0") return digit;
  if (previous.length >= 10) return previous;
  return `${previous}${digit}`;
}

export function BillEditor() {
  const open = useEditorStore((state) => state.open);
  const billId = useEditorStore((state) => state.billId);
  const defaultType = useEditorStore((state) => state.defaultType);
  const close = useEditorStore((state) => state.close);

  const bookId = useAppStore((state) => state.currentBookId);
  const meta = useAppStore((state) => state.meta);
  const addBill = useLedgerStore((state) => state.addBill);
  const updateBill = useLedgerStore((state) => state.updateBill);
  const deleteBill = useLedgerStore((state) => state.deleteBill);

  const [type, setType] = useState<BillType>("expense");
  const [amountText, setAmountText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(() => Date.now());
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);

  const metaCategories = meta?.categories;
  const categories = useMemo(
    () => metaCategories ?? [],
    [metaCategories],
  );
  const currencyCode = currency || meta?.baseCurrency || "CNY";

  const topCategories = useMemo(
    () => topLevelCategories(categories, type),
    [categories, type],
  );
  const selected = categoryById(categories, categoryId);
  const selectedRoot = selected ? rootCategory(categories, selected) : undefined;
  const subCategories = selectedRoot
    ? childrenOf(categories, selectedRoot.id)
    : [];

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setSaving(false);

    const applyBill = (bill: Bill) => {
      setType(bill.type);
      setAmountText(formatAmountInput(bill.amount, bill.currency));
      setCategoryId(bill.categoryId);
      setDate(bill.time);
      setNote(bill.note ?? "");
      setCurrency(bill.currency);
    };

    if (billId) {
      const cached = useLedgerStore
        .getState()
        .bills.find((bill) => bill.id === billId);
      if (cached) {
        applyBill(cached);
      } else {
        setLoadingBill(true);
        void getBill(billId)
          .then((bill) => {
            if (bill) applyBill(bill);
          })
          .finally(() => setLoadingBill(false));
      }
      return;
    }

    setType(defaultType);
    setAmountText("");
    setDate(Date.now());
    setNote("");
    setCurrency(meta?.baseCurrency ?? "CNY");
    setCategoryId(
      defaultCategoryForType(categories, defaultType)?.id ?? "",
    );
  }, [open, billId, defaultType, meta?.baseCurrency, categories]);

  const switchType = (next: BillType) => {
    setType(next);
    const current = categoryById(categories, categoryId);
    if (!current || current.type !== next) {
      setCategoryId(defaultCategoryForType(categories, next)?.id ?? "");
    }
  };

  const chooseCategory = (category: Category) => {
    setCategoryId(category.id);
  };

  const handleSave = async () => {
    if (!bookId) return;
    const amount = parseAmountInput(amountText, currencyCode);
    if (amount <= 0) {
      toast.warning("请输入金额");
      return;
    }
    if (!categoryId) {
      toast.warning("请选择分类");
      return;
    }
    const input: BillInput = {
      type,
      amount,
      currency: currencyCode,
      categoryId,
      time: date,
      note: note.trim() || undefined,
    };
    setSaving(true);
    try {
      if (billId) {
        await updateBill(bookId, billId, input);
      } else {
        await addBill(bookId, input);
      }
      toast.success(billId ? "账单已更新" : "已记一笔");
      close();
    } catch (error) {
      console.error(error);
      toast.danger("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bookId || !billId) return;
    await deleteBill(bookId, billId);
    toast.success("账单已删除");
    close();
  };

  return (
    <Drawer.Backdrop
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="max-h-[92dvh]">
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>
              {billId ? "编辑账单" : "记一笔"}
            </Drawer.Heading>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-4 pb-4">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
              {(["expense", "income"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchType(value)}
                  className={cn(
                    "rounded-xl py-2 text-sm font-medium transition-colors",
                    type === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted",
                  )}
                >
                  {value === "expense" ? "支出" : "收入"}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-surface p-4 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl text-muted">
                  {currencySymbol(currencyCode)}
                </span>
                <span
                  className={cn(
                    "text-4xl font-semibold tracking-tight tabular-nums",
                    !amountText && "text-muted",
                  )}
                >
                  {amountText || "0"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatMoneyPlain(parseAmountInput(amountText, currencyCode), currencyCode)}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">分类</span>
                <span className="text-xs text-muted">
                  {selected?.name ?? "未选择"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {topCategories.map((category) => {
                  const active =
                    selectedRoot?.id === category.id ||
                    selected?.id === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => chooseCategory(category)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition-colors",
                        active
                          ? "border-accent bg-accent-soft text-accent-soft-foreground"
                          : "border-separator bg-surface text-muted hover:text-foreground",
                      )}
                    >
                      <span
                        className="flex size-8 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${category.color}1f`,
                          color: category.color,
                        }}
                      >
                        <CategoryIcon name={category.icon} className="size-4" />
                      </span>
                      <span className="max-w-full truncate">{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {subCategories.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {subCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => chooseCategory(category)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        categoryId === category.id
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-separator text-muted hover:text-foreground",
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex h-11 items-center gap-2 rounded-field border border-field-border bg-field px-3 text-sm">
                <CalendarDays className="size-4 shrink-0 text-muted" />
                <input
                  type="date"
                  value={toDateInputValue(date)}
                  onChange={(event) =>
                    setDate(fromDateInputValue(event.target.value, date))
                  }
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  aria-label="日期"
                />
              </label>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="备注（可选）"
                maxLength={80}
                className="h-11 rounded-field border border-field-border bg-field px-3 text-sm outline-none placeholder:text-muted focus:border-accent"
                aria-label="备注"
              />
            </div>

            <AmountKeypad
              onDigit={(digit) =>
                setAmountText((previous) => applyDigit(previous, digit))
              }
              onBackspace={() =>
                setAmountText((previous) => previous.slice(0, -1))
              }
            />

            {loadingBill ? (
              <p className="text-center text-xs text-muted">正在加载账单…</p>
            ) : null}
          </Drawer.Body>

          <Drawer.Footer className="flex-col gap-2">
            <Button
              fullWidth
              isPending={saving}
              isDisabled={loadingBill}
              onPress={() => void handleSave()}
            >
              {({ isPending }) => (
                <>
                  {isPending ? null : <Check className="size-4" />}
                  {isPending ? "保存中…" : "保存"}
                </>
              )}
            </Button>
            {billId ? (
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
                    onPress={() => void handleDelete()}
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
                  删除账单
                </Button>
              )
            ) : null}
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

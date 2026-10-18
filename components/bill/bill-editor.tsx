"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The drawer form is reset when it opens. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  minorDigits,
  parseAmountInput,
} from "@/lib/domain/money";
import {
  dayjs,
  formatDate,
  formatDayShort,
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

const MAX_WHOLE_DIGITS = 8;

function applyDigit(previous: string, digit: string, decimals: number): string {
  if (digit === ".") {
    if (decimals === 0 || previous.includes(".")) return previous;
    return `${previous || "0"}.`;
  }
  const [whole, fraction] = previous.split(".");
  if (fraction !== undefined && fraction.length >= decimals) return previous;
  if (previous === "0") return digit;
  if (whole.length >= MAX_WHOLE_DIGITS) return previous;
  return `${previous}${digit}`;
}

/** Keep typed/pasted text to digits, one dot and the currency's decimal limit. */
function sanitizeAmountTyping(value: string, decimals: number): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (decimals === 0) return cleaned.replace(/\./g, "").slice(0, MAX_WHOLE_DIGITS);

  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) return cleaned.slice(0, MAX_WHOLE_DIGITS);

  const whole = cleaned.slice(0, dotIndex).slice(0, MAX_WHOLE_DIGITS);
  const fraction = cleaned
    .slice(dotIndex + 1)
    .replace(/\./g, "")
    .slice(0, decimals);

  return `${whole}.${fraction}`;
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
  const [noteFocused, setNoteFocused] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const metaCategories = meta?.categories;
  const categories = useMemo(
    () => metaCategories ?? [],
    [metaCategories],
  );
  const currencyCode = currency || meta?.baseCurrency || "CNY";
  const decimals = minorDigits(currencyCode);

  const topCategories = useMemo(
    () => topLevelCategories(categories, type),
    [categories, type],
  );
  const selected = categoryById(categories, categoryId);
  const selectedRoot = selected ? rootCategory(categories, selected) : undefined;
  const subCategories = selectedRoot
    ? childrenOf(categories, selectedRoot.id)
    : [];
  const dateLabel = useMemo(
    () =>
      dayjs(date).isSame(dayjs(), "year") ? formatDayShort(date) : formatDate(date),
    [date],
  );

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setSaving(false);
    setNoteFocused(false);

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

    setLoadingBill(false);
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

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Fall through to focusing the input for browsers without a picker.
      }
    }
    input.focus();
    input.click();
  };

  const handleSave = useCallback(async () => {
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
  }, [
    addBill,
    amountText,
    billId,
    bookId,
    categoryId,
    close,
    currencyCode,
    date,
    note,
    type,
    updateBill,
  ]);

  const handleDelete = async () => {
    if (!bookId || !billId) return;
    await deleteBill(bookId, billId);
    toast.success("账单已删除");
    close();
  };

  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  // On desktop the amount is a real input; focus it so typing works right away.
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const timer = window.setTimeout(() => {
      const input = amountInputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Desktop convenience: type digits anywhere in the drawer, Enter to save.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Enter") {
        // Let the focused control handle Enter on its own.
        if (target?.closest("button, a, [role='button']")) return;
        event.preventDefault();
        saveRef.current();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setAmountText((previous) => previous.slice(0, -1));
        return;
      }
      if (/^\d$/.test(event.key) || event.key === ".") {
        event.preventDefault();
        setAmountText((previous) =>
          applyDigit(previous, event.key, decimals),
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, decimals]);

  return (
    <Drawer.Backdrop
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Drawer.Content
        placement="bottom"
        className="justify-center md:items-center md:justify-center md:p-6"
      >
        <Drawer.Dialog className="flex h-[94%] max-h-none w-full flex-col overflow-hidden p-0 max-md:[@media(max-height:640px)]:h-full sm:max-w-2xl md:h-auto md:max-h-[min(90%,40rem)] md:max-w-3xl md:rounded-3xl">
          <Drawer.Handle className="md:hidden [@media(max-height:640px)]:hidden" />
          <Drawer.CloseTrigger />
          <Drawer.Header className="flex shrink-0 flex-row items-center gap-3 px-5 pb-2 pe-14 pt-4 [@media(max-height:700px)]:pb-1 [@media(max-height:700px)]:pt-3 md:px-6 md:pt-5">
            <Drawer.Heading className="text-lg font-semibold md:text-xl">
              {billId ? "编辑账单" : "记一笔"}
            </Drawer.Heading>
            <div
              role="group"
              aria-label="收支类型"
              className="ms-auto grid grid-cols-2 gap-0.5 rounded-full bg-surface p-0.5"
            >
              {(["expense", "income"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchType(value)}
                  aria-pressed={type === value}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    type === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {value === "expense" ? "支出" : "收入"}
                </button>
              ))}
            </div>
          </Drawer.Header>

          <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-6 md:px-6 md:py-2">
            <div className="contents md:col-start-1 md:flex md:flex-col md:gap-4">
              <div
                data-slot="bill-amount"
                className="order-1 shrink-0 px-5 pb-3 md:px-0 md:pb-0"
              >
                <div
                  onClick={() => amountInputRef.current?.focus()}
                  className="rounded-2xl bg-surface px-4 py-2.5 [@media(max-height:700px)]:py-2 md:rounded-3xl md:px-5 md:py-4"
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xl text-muted">
                      {currencySymbol(currencyCode)}
                    </span>
                    <span
                      className={cn(
                        "text-[clamp(2rem,9vw,2.75rem)] font-semibold leading-none tracking-tight tabular-nums md:hidden",
                        !amountText
                          ? "text-muted"
                          : type === "income"
                            ? "text-success"
                            : "text-foreground",
                      )}
                    >
                      {amountText || "0"}
                    </span>
                    <input
                      ref={amountInputRef}
                      value={amountText}
                      onChange={(event) =>
                        setAmountText(
                          sanitizeAmountTyping(event.target.value, decimals),
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSave();
                        }
                      }}
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label="金额"
                      placeholder="0"
                      style={{
                        width: `${Math.max(amountText.length, 2) + 0.25}ch`,
                      }}
                      className={cn(
                        "hidden min-w-0 bg-transparent p-0 text-center text-4xl font-semibold leading-none tracking-tight tabular-nums caret-transparent outline-none placeholder:text-muted md:block",
                        amountText && type === "income"
                          ? "text-success"
                          : "text-foreground",
                      )}
                    />
                  </div>
                  <p className="mt-1 truncate text-center text-xs text-muted [@media(max-height:600px)]:hidden">
                    {selected?.name ?? "未选择分类"} · {dateLabel}
                  </p>
                </div>
              </div>

              <div
                data-slot="bill-keypad"
                className={cn(
                  "order-3 shrink-0 border-t border-separator px-5 pb-1.5 pt-2.5 [@media(max-height:700px)]:pb-1 [@media(max-height:700px)]:pt-2 md:border-0 md:px-0 md:pb-0 md:pt-0",
                  noteFocused && "hidden md:block",
                )}
              >
                <AmountKeypad
                  className="mx-auto w-full max-w-sm"
                  onDigit={(digit) =>
                    setAmountText((previous) =>
                      applyDigit(previous, digit, decimals),
                    )
                  }
                  onBackspace={() =>
                    setAmountText((previous) => previous.slice(0, -1))
                  }
                />
              </div>
            </div>

            <div
              data-slot="bill-categories"
              className="order-2 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-4 [@media(max-height:700px)]:space-y-2.5 md:col-start-2 md:px-0 md:py-2"
            >
              {loadingBill ? (
                <p className="text-center text-xs text-muted">
                  正在加载账单…
                </p>
              ) : null}

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium">分类</h2>
                  <span className="text-xs text-muted">
                    {selected?.name ?? "未选择"}
                  </span>
                </div>
                <div
                  role="group"
                  aria-label="分类"
                  className="grid grid-cols-4 gap-1.5 sm:grid-cols-5"
                >
                  {topCategories.map((category) => {
                    const active =
                      selectedRoot?.id === category.id ||
                      selected?.id === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => chooseCategory(category)}
                        aria-pressed={active}
                        className={cn(
                          "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2 text-[11px] transition-colors active:scale-[0.97] [@media(max-height:700px)]:min-h-14 [@media(max-height:700px)]:gap-1 [@media(max-height:700px)]:py-1.5",
                          active
                            ? "border-accent bg-accent-soft text-accent-soft-foreground"
                            : "border-transparent bg-surface text-muted hover:bg-surface-secondary hover:text-foreground",
                        )}
                      >
                        <span
                          className="flex size-8 items-center justify-center rounded-full [@media(max-height:700px)]:size-7"
                          style={{
                            backgroundColor: `${category.color}1f`,
                            color: category.color,
                          }}
                        >
                          <CategoryIcon
                            name={category.icon}
                            className="size-4"
                          />
                        </span>
                        <span className="max-w-full truncate">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {subCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {subCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => chooseCategory(category)}
                        aria-pressed={categoryId === category.id}
                        className={cn(
                          "min-h-9 rounded-full border px-3 text-xs transition-colors",
                          categoryId === category.id
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-separator text-muted hover:bg-surface hover:text-foreground",
                        )}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={openDatePicker}
                    aria-label="选择日期"
                    className="flex h-11 w-full min-w-0 items-center gap-2 rounded-field border border-field-border bg-field px-3 text-left text-sm transition-colors hover:bg-surface-secondary"
                  >
                    <CalendarDays className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate tabular-nums">
                      {dateLabel}
                    </span>
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={toDateInputValue(date)}
                    onChange={(event) =>
                      setDate(fromDateInputValue(event.target.value, date))
                    }
                    className="sr-only"
                  />
                </div>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  onFocus={() => setNoteFocused(true)}
                  onBlur={() => setNoteFocused(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  placeholder="备注"
                  maxLength={80}
                  enterKeyHint="done"
                  className="h-11 min-w-0 rounded-field border border-field-border bg-field px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
                  aria-label="备注（可选）"
                />
              </div>
            </div>
          </div>

          <Drawer.Footer
            data-slot="bill-footer"
            className="flex shrink-0 flex-col gap-2 border-t border-separator bg-overlay px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 [@media(max-height:700px)]:pb-2 [@media(max-height:700px)]:pt-2 md:px-6"
          >
            <Button
              fullWidth
              size="lg"
              isPending={saving}
              isDisabled={loadingBill}
              onPress={() => void handleSave()}
              className="h-12 [@media(max-height:700px)]:h-11 md:mx-auto md:max-w-xs"
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
                <div className="flex w-full gap-2 md:mx-auto md:max-w-xs">
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
                  className="h-9 text-danger md:mx-auto md:max-w-xs"
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

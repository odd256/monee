"use client";

import { useMemo } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { Button } from "@heroui/react";
import { BillList } from "@/components/ledger/bill-list";
import { MonthSummary } from "@/components/ledger/month-summary";
import { MonthSwitcher } from "@/components/ledger/month-switcher";
import { EmptyState } from "@/components/ui/empty-state";
import { useLedger } from "@/hooks/use-ledger";
import { activeBills, summarize } from "@/lib/domain/stats";
import { useAppStore } from "@/lib/store/app-store";
import { useEditorStore } from "@/lib/store/editor-store";

export default function LedgerPage() {
  const { bills, monthAnchor, setMonth, loading } = useLedger();
  const meta = useAppStore((state) => state.meta);
  const openNew = useEditorStore((state) => state.openNew);

  const summary = useMemo(() => summarize(activeBills(bills)), [bills]);
  const categories = meta?.categories ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <MonthSwitcher monthAnchor={monthAnchor} onChange={setMonth} />
      <MonthSummary monthAnchor={monthAnchor} summary={summary} />

      {loading && bills.length === 0 ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-2xl bg-surface"
            />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="这个月还没有账单"
          description="记下第一笔，月底回看会很清楚。"
          action={
            <Button size="sm" onPress={() => openNew("expense")}>
              <Plus className="size-4" />
              记一笔
            </Button>
          }
        />
      ) : (
        <BillList bills={bills} categories={categories} />
      )}
    </div>
  );
}

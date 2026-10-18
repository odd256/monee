"use client";

import { useMemo, useState } from "react";
import { ChartPie } from "lucide-react";
import { useBillsRange } from "@/hooks/use-bills-range";
import {
  PeriodPicker,
  type StatsPeriod,
} from "@/components/stats/period-picker";
import { SummaryCards } from "@/components/stats/summary-cards";
import { CategoryPie } from "@/components/stats/category-pie";
import { DailyTrend } from "@/components/stats/daily-trend";
import { TopExpenses } from "@/components/stats/top-expenses";
import { EmptyState } from "@/components/ui/empty-state";
import {
  aggregateByCategory,
  aggregateByDay,
  aggregateByMonth,
  summarize,
  topBills,
} from "@/lib/domain/stats";
import { dayjs, monthRange, yearRange } from "@/lib/domain/date";
import { useAppStore } from "@/lib/store/app-store";

export default function StatsPage() {
  const bookId = useAppStore((state) => state.currentBookId);
  const meta = useAppStore((state) => state.meta);
  const [period, setPeriod] = useState<StatsPeriod>("month");
  const [anchor, setAnchor] = useState(() => Date.now());

  const [start, end] = useMemo(
    () => (period === "month" ? monthRange(anchor) : yearRange(anchor)),
    [period, anchor],
  );
  const { bills, loading } = useBillsRange(bookId, start, end);
  const metaCategories = meta?.categories;
  const categories = useMemo(
    () => metaCategories ?? [],
    [metaCategories],
  );

  const summary = useMemo(() => summarize(bills), [bills]);
  const categoryTotals = useMemo(
    () => aggregateByCategory(bills, categories, "expense"),
    [bills, categories],
  );
  const top = useMemo(() => topBills(bills, "expense", 5), [bills]);

  const trend = useMemo(() => {
    if (period === "month") {
      return aggregateByDay(bills, start, end).map((item) => ({
        label: dayjs(item.day).format("D"),
        expense: item.expense,
        income: item.income,
      }));
    }
    return aggregateByMonth(bills, start).map((item) => ({
      label: dayjs(item.month).format("M月"),
      expense: item.expense,
      income: item.income,
    }));
  }, [bills, start, end, period]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <PeriodPicker
        period={period}
        anchor={anchor}
        onPeriodChange={setPeriod}
        onAnchorChange={setAnchor}
      />
      <SummaryCards summary={summary} />

      {loading && bills.length === 0 ? (
        <div className="h-56 animate-pulse rounded-2xl bg-surface" />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={ChartPie}
          title="还没有可分析的数据"
          description="记几笔之后，这里会显示分类占比和收支趋势。"
        />
      ) : (
        <>
          <DailyTrend data={trend} />
          <CategoryPie totals={categoryTotals} />
          <TopExpenses bills={top} categories={categories} />
        </>
      )}
    </div>
  );
}

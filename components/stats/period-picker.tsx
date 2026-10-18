"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@heroui/react";
import {
  addMonths,
  addYears,
  dayjs,
  formatMonth,
} from "@/lib/domain/date";
import { cn } from "@/lib/utils/cn";

export type StatsPeriod = "month" | "year";

export function PeriodPicker({
  period,
  anchor,
  onPeriodChange,
  onAnchorChange,
}: {
  period: StatsPeriod;
  anchor: number;
  onPeriodChange: (period: StatsPeriod) => void;
  onAnchorChange: (anchor: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
        {(["month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPeriodChange(value)}
            className={cn(
              "rounded-xl py-1.5 text-xs font-medium transition-colors",
              period === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted",
            )}
          >
            {value === "month" ? "按月" : "按年"}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button
          isIconOnly
          variant="secondary"
          size="sm"
          aria-label="上一个周期"
          onPress={() =>
            onAnchorChange(
              period === "month"
                ? addMonths(anchor, -1)
                : addYears(anchor, -1),
            )
          }
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">
          {period === "month"
            ? formatMonth(anchor)
            : dayjs(anchor).format("YYYY年")}
        </span>
        <Button
          isIconOnly
          variant="secondary"
          size="sm"
          aria-label="下一个周期"
          onPress={() =>
            onAnchorChange(
              period === "month"
                ? addMonths(anchor, 1)
                : addYears(anchor, 1),
            )
          }
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Popover } from "@heroui/react";
import { MonthGrid, YearGrid } from "@/components/ui/period-grid";
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
  const [open, setOpen] = useState(false);
  const label =
    period === "month" ? formatMonth(anchor) : dayjs(anchor).format("YYYY年");

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

        <Popover isOpen={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${period === "month" ? "选择月份" : "选择年份"}，当前 ${label}`}
            className="h-auto gap-1 px-2 py-0.5 text-sm font-semibold"
          >
            {label}
            <ChevronDown className="size-3.5 text-muted" />
          </Button>
          <Popover.Content placement="bottom">
            <Popover.Dialog
              aria-label={period === "month" ? "选择月份" : "选择年份"}
              className="w-64 p-3"
            >
              {period === "month" ? (
                <MonthGrid
                  key={`month-${anchor}-${open}`}
                  value={anchor}
                  onSelect={(value) => {
                    onAnchorChange(value);
                    setOpen(false);
                  }}
                />
              ) : (
                <YearGrid
                  key={`year-${anchor}-${open}`}
                  value={anchor}
                  onSelect={(value) => {
                    onAnchorChange(value);
                    setOpen(false);
                  }}
                />
              )}
            </Popover.Dialog>
          </Popover.Content>
        </Popover>

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

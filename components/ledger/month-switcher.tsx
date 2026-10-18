"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@heroui/react";
import {
  addMonths,
  formatMonth,
  isCurrentMonth,
} from "@/lib/domain/date";

export function MonthSwitcher({
  monthAnchor,
  onChange,
}: {
  monthAnchor: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Button
        isIconOnly
        variant="secondary"
        size="sm"
        aria-label="上个月"
        onPress={() => onChange(addMonths(monthAnchor, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="text-center">
        <p className="text-sm font-semibold">{formatMonth(monthAnchor)}</p>
        {!isCurrentMonth(monthAnchor) ? (
          <button
            type="button"
            className="mt-0.5 text-[11px] text-accent"
            onClick={() => onChange(Date.now())}
          >
            回到本月
          </button>
        ) : (
          <p className="mt-0.5 text-[11px] text-muted">本月</p>
        )}
      </div>
      <Button
        isIconOnly
        variant="secondary"
        size="sm"
        aria-label="下个月"
        onPress={() => onChange(addMonths(monthAnchor, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

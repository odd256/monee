"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Popover } from "@heroui/react";
import { MonthGrid } from "@/components/ui/period-grid";
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
  const [open, setOpen] = useState(false);
  const calendarOpen = isCurrentMonth(monthAnchor);

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
        <Popover isOpen={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`选择月份，当前 ${formatMonth(monthAnchor)}`}
            className="h-auto gap-1 px-2 py-0.5 text-sm font-semibold"
          >
            {formatMonth(monthAnchor)}
            <ChevronDown className="size-3.5 text-muted" />
          </Button>
          <Popover.Content placement="bottom">
            <Popover.Dialog aria-label="选择月份" className="w-64 p-3">
              <MonthGrid
                key={`${monthAnchor}-${open}`}
                value={monthAnchor}
                onSelect={(value) => {
                  onChange(value);
                  setOpen(false);
                }}
              />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>

        {calendarOpen ? (
          <p className="mt-0.5 text-[11px] text-muted">本月</p>
        ) : (
          <button
            type="button"
            className="mt-0.5 text-[11px] text-accent"
            onClick={() => onChange(Date.now())}
          >
            回到本月
          </button>
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

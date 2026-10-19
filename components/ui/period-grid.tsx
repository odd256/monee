"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@heroui/react";
import { dayjs } from "@/lib/domain/date";
import { cn } from "@/lib/utils/cn";

const MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1}月`);
const YEAR_PAGE_SIZE = 12;

function NavButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={label}
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

function GridButton({
  active,
  current,
  onPress,
  children,
}: {
  active: boolean;
  current: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-xl text-xs font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-surface",
        current && !active ? "text-accent" : "",
      )}
    >
      {children}
    </button>
  );
}

function ResetButton({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="rounded-lg py-1 text-[11px] text-accent transition-colors hover:bg-accent-soft"
    >
      {children}
    </button>
  );
}

export function MonthGrid({
  value,
  onSelect,
}: {
  value: number;
  onSelect: (value: number) => void;
}) {
  const [year, setYear] = useState(() => dayjs(value).year());
  const selected = dayjs(value);
  const today = dayjs();

  return (
    <div role="group" aria-label="选择月份" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <NavButton label="上一年" onPress={() => setYear((current) => current - 1)}>
          <ChevronLeft className="size-4" />
        </NavButton>
        <span className="text-sm font-semibold">{year}年</span>
        <NavButton label="下一年" onPress={() => setYear((current) => current + 1)}>
          <ChevronRight className="size-4" />
        </NavButton>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {MONTHS.map((label, index) => {
          const active = selected.year() === year && selected.month() === index;
          const current = today.year() === year && today.month() === index;
          return (
            <GridButton
              key={label}
              active={active}
              current={current}
              onPress={() =>
                onSelect(
                  dayjs().year(year).month(index).startOf("month").valueOf(),
                )
              }
            >
              {label}
            </GridButton>
          );
        })}
      </div>

      <ResetButton onPress={() => onSelect(Date.now())}>回到本月</ResetButton>
    </div>
  );
}

export function YearGrid({
  value,
  onSelect,
}: {
  value: number;
  onSelect: (value: number) => void;
}) {
  const selectedYear = dayjs(value).year();
  const [startYear, setStartYear] = useState(
    () =>
      selectedYear -
      (((selectedYear % YEAR_PAGE_SIZE) + YEAR_PAGE_SIZE) % YEAR_PAGE_SIZE),
  );
  const todayYear = dayjs().year();
  const years = Array.from(
    { length: YEAR_PAGE_SIZE },
    (_, index) => startYear + index,
  );

  return (
    <div role="group" aria-label="选择年份" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <NavButton
          label="上一页年份"
          onPress={() => setStartYear((current) => current - YEAR_PAGE_SIZE)}
        >
          <ChevronLeft className="size-4" />
        </NavButton>
        <span className="text-sm font-semibold">
          {startYear}–{startYear + YEAR_PAGE_SIZE - 1}年
        </span>
        <NavButton
          label="下一页年份"
          onPress={() => setStartYear((current) => current + YEAR_PAGE_SIZE)}
        >
          <ChevronRight className="size-4" />
        </NavButton>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {years.map((year) => (
          <GridButton
            key={year}
            active={year === selectedYear}
            current={year === todayYear}
            onPress={() => onSelect(dayjs(value).year(year).valueOf())}
          >
            {year}
          </GridButton>
        ))}
      </div>

      <ResetButton onPress={() => onSelect(Date.now())}>回到今年</ResetButton>
    </div>
  );
}

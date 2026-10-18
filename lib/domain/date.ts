import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

dayjs.locale("zh-cn");

export { dayjs };

export function startOfDay(ts: number): number {
  return dayjs(ts).startOf("day").valueOf();
}

export function startOfMonth(ts: number): number {
  return dayjs(ts).startOf("month").valueOf();
}

export function endOfMonth(ts: number): number {
  return dayjs(ts).add(1, "month").startOf("month").valueOf();
}

export function monthRange(ts: number): [number, number] {
  return [startOfMonth(ts), endOfMonth(ts)];
}

export function yearRange(ts: number): [number, number] {
  const start = dayjs(ts).startOf("year").valueOf();
  const end = dayjs(ts).add(1, "year").startOf("year").valueOf();
  return [start, end];
}

export function formatMonth(ts: number): string {
  return dayjs(ts).format("YYYY年M月");
}

export function formatMonthShort(ts: number): string {
  return dayjs(ts).format("YYYY-MM");
}

export function formatDay(ts: number): string {
  return dayjs(ts).format("M月D日 ddd");
}

export function formatDayShort(ts: number): string {
  return dayjs(ts).format("M月D日");
}

export function formatDate(ts: number): string {
  return dayjs(ts).format("YYYY-MM-DD");
}

export function formatTime(ts: number): string {
  return dayjs(ts).format("HH:mm");
}

export function isCurrentMonth(ts: number): boolean {
  return dayjs(ts).isSame(dayjs(), "month");
}

export function addMonths(ts: number, amount: number): number {
  return dayjs(ts).add(amount, "month").startOf("month").valueOf();
}

export function addYears(ts: number, amount: number): number {
  return dayjs(ts).add(amount, "year").startOf("year").valueOf();
}

export function toDateInputValue(ts: number): string {
  return dayjs(ts).format("YYYY-MM-DD");
}

/** Parse an `<input type="date">` value without timezone surprises. */
export function fromDateInputValue(value: string, fallback = Date.now()): number {
  if (!value) return fallback;
  const parsed = dayjs(`${value}T12:00:00`);
  return parsed.isValid() ? parsed.valueOf() : fallback;
}

export function monthKey(ts: number): string {
  return dayjs(ts).format("YYYY-MM");
}

export function yearKey(ts: number): string {
  return dayjs(ts).format("YYYY");
}

export interface DayGroup<T> {
  day: number;
  items: T[];
}

export function groupByDay<T extends { time: number }>(items: T[]): DayGroup<T>[] {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const day = startOfDay(item.time);
    const bucket = groups.get(day);
    if (bucket) bucket.push(item);
    else groups.set(day, [item]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([day, items]) => ({
      day,
      items: items.sort((a, b) => b.time - a.time),
    }));
}

export function relativeDayLabel(ts: number): string {
  const day = startOfDay(ts);
  const today = startOfDay(Date.now());
  const yesterday = dayjs(today).subtract(1, "day").valueOf();
  if (day === today) return "今天";
  if (day === yesterday) return "昨天";
  return formatDay(ts);
}

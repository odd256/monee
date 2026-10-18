import { formatMoney } from "@/lib/domain/money";
import type { Bill } from "@/lib/domain/types";

export function formatBillAmount(bill: Bill): string {
  const sign = bill.type === "expense" ? "-" : "+";
  return `${sign}${formatMoney(bill.amount, bill.currency)}`;
}

export function truncate(value: string, length = 24): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString("zh-CN");
}

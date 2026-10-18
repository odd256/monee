"use client";

import { Card } from "@heroui/react";
import { formatMoney } from "@/lib/domain/money";
import { formatMonth } from "@/lib/domain/date";
import type { Summary } from "@/lib/domain/stats";

export function MonthSummary({
  monthAnchor,
  summary,
}: {
  monthAnchor: number;
  summary: Summary;
}) {
  const currency = "CNY";
  return (
    <Card className="border-none bg-accent text-accent-foreground shadow-lg shadow-accent/15">
      <Card.Content className="gap-5 p-5">
        <div className="flex items-center justify-between text-xs opacity-80">
          <span>{formatMonth(monthAnchor)}</span>
          <span>本月结余</span>
        </div>
        <div className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatMoney(summary.balance, currency)}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-current/15 pt-3">
          <div>
            <p className="text-xs opacity-70">支出</p>
            <p className="mt-0.5 text-sm font-medium tabular-nums">
              {formatMoney(summary.expense, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">收入</p>
            <p className="mt-0.5 text-sm font-medium tabular-nums">
              {formatMoney(summary.income, currency)}
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

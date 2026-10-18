"use client";

import { Card } from "@heroui/react";
import { formatMoney } from "@/lib/domain/money";
import type { Summary } from "@/lib/domain/stats";

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="border-none bg-surface">
        <Card.Content className="gap-1 p-3">
          <p className="text-[11px] text-muted">支出</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatMoney(summary.expense)}
          </p>
        </Card.Content>
      </Card>
      <Card className="border-none bg-surface">
        <Card.Content className="gap-1 p-3">
          <p className="text-[11px] text-muted">收入</p>
          <p className="text-sm font-semibold tabular-nums text-success">
            {formatMoney(summary.income)}
          </p>
        </Card.Content>
      </Card>
      <Card className="border-none bg-surface">
        <Card.Content className="gap-1 p-3">
          <p className="text-[11px] text-muted">结余</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatMoney(summary.balance)}
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

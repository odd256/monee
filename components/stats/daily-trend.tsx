"use client";

import { Card } from "@heroui/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatMoney } from "@/lib/domain/money";

export interface TrendPoint {
  label: string;
  expense: number;
  income: number;
}

export function DailyTrend({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm">收支趋势</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fontSize: 10, fill: "var(--muted)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                tickFormatter={(value: number) => formatCompact(value)}
                width={48}
              />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--separator)",
                  background: "var(--overlay)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="expense"
                name="支出"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="income"
                name="收入"
                fill="var(--success)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card.Content>
    </Card>
  );
}

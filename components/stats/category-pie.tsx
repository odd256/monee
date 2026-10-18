"use client";

import { Card } from "@heroui/react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryTotal } from "@/lib/domain/categories";
import { formatMoney } from "@/lib/domain/money";
import { CategoryIcon } from "@/components/ui/category-icon";

const FALLBACK_COLORS = [
  "#0f766e",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#84cc16",
  "#64748b",
];

export function CategoryPie({ totals }: { totals: CategoryTotal[] }) {
  const data = totals.map((item, index) => ({
    id: item.category?.id ?? "__uncategorized__",
    name: item.category?.name ?? "未分类",
    value: item.amount,
    color:
      item.category?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    icon: item.category?.icon ?? "ellipsis",
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) return null;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm">支出分类</Card.Title>
      </Card.Header>
      <Card.Content className="gap-2">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={82}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((item) => (
                  <Cell key={item.id} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--separator)",
                  background: "var(--overlay)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.slice(0, 6).map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span
                  className="flex size-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${item.color}1f`,
                    color: item.color,
                  }}
                >
                  <CategoryIcon name={item.icon} className="size-3.5" />
                </span>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-muted">{percent.toFixed(0)}%</span>
                <span className="w-20 text-right font-medium tabular-nums">
                  {formatMoney(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}

"use client";

import { Card } from "@heroui/react";
import { groupByDay, relativeDayLabel } from "@/lib/domain/date";
import { formatMoney } from "@/lib/domain/money";
import { summarizeByType } from "@/lib/domain/stats";
import type { Bill, Category } from "@/lib/domain/types";
import { BillItem } from "./bill-item";

export function BillList({
  bills,
  categories,
}: {
  bills: Bill[];
  categories: Category[];
}) {
  const groups = groupByDay(bills);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const expense = summarizeByType(group.items, "expense");
        const income = summarizeByType(group.items, "income");
        return (
          <section key={group.day} className="animate-rise">
            <div className="mb-1.5 flex items-center justify-between px-1 text-xs text-muted">
              <span>{relativeDayLabel(group.day)}</span>
              <span className="tabular-nums">
                {expense > 0 ? `支出 ${formatMoney(expense)}` : ""}
                {expense > 0 && income > 0 ? " · " : ""}
                {income > 0 ? `收入 ${formatMoney(income)}` : ""}
              </span>
            </div>
            <Card className="overflow-hidden">
              <Card.Content className="divide-y divide-separator p-0">
                {group.items.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                    categories={categories}
                  />
                ))}
              </Card.Content>
            </Card>
          </section>
        );
      })}
    </div>
  );
}

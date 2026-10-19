"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { SyncIndicator } from "./sync-indicator";

const TITLES: Record<string, string> = {
  "/": "账本",
  "/stats": "统计",
  "/budgets": "预算",
  "/settings": "设置",
  "/settings/github": "GitHub 同步",
  "/settings/books": "账本管理",
  "/settings/categories": "分类管理",
  "/settings/appearance": "外观",
  "/settings/data": "数据",
  "/settings/about": "关于",
};

export function TopBar() {
  const pathname = usePathname();
  const meta = useAppStore((state) => state.meta);
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const title = TITLES[normalizedPath] ?? "Monee";
  const isSettingsSubpage = normalizedPath.startsWith("/settings/");

  return (
    <header className="safe-top flex items-center justify-between gap-3 px-4 pb-2 md:px-8">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {isSettingsSubpage ? (
            <Link
              href="/settings"
              prefetch={false}
              aria-label="返回设置"
              className="-ml-1 rounded-full p-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : null}
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
            {title}
          </h1>
          <Link
            href="/settings/books"
            prefetch={false}
            className="hidden items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-foreground md:inline-flex"
          >
            {meta?.name ?? "账本"}
            <ChevronRight className="size-3" />
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-muted md:hidden">
          {meta?.name ?? "Monee"}
        </p>
      </div>
      <SyncIndicator />
    </header>
  );
}

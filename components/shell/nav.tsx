"use client";

import {
  BookOpen,
  ChartPie,
  CircleHelp,
  Settings,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/", label: "账本", icon: BookOpen },
  { href: "/stats", label: "统计", icon: ChartPie },
  { href: "/budgets", label: "预算", icon: Target },
  { href: "/settings", label: "设置", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabbar() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-background/90 backdrop-blur md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                active
                  ? "text-accent"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-separator px-4 py-6 md:flex">
      <Link href="/" prefetch={false} className="mb-8 flex items-center gap-2 px-2">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-foreground">
          M
        </span>
        <span className="text-lg font-semibold tracking-tight">Monee</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent-soft text-accent-soft-foreground font-medium"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 px-3 py-3 text-xs text-muted">
        <CircleHelp className="size-3.5" />
        <span>本地优先 · GitHub 同步</span>
      </div>
    </aside>
  );
}

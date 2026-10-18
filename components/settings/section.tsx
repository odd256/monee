"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      {title ? (
        <Card.Header>
          <Card.Title className="text-sm">{title}</Card.Title>
          {description ? (
            <Card.Description className="text-xs">{description}</Card.Description>
          ) : null}
        </Card.Header>
      ) : null}
      <Card.Content className="p-0">{children}</Card.Content>
    </Card>
  );
}

export function SettingsLink({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent ?? "#0f766e"}1a`,
          color: accent ?? "#0f766e",
        }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {description}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" />
    </Link>
  );
}

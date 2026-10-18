"use client";

import {
  Cloud,
  CloudOff,
  Loader2,
  WifiOff,
} from "lucide-react";
import { Button } from "@heroui/react";
import { useOnline } from "@/hooks/use-online";
import { useSyncStore } from "@/lib/store/sync-store";
import { cn } from "@/lib/utils/cn";

export function SyncIndicator() {
  const online = useOnline();
  const status = useSyncStore((state) => state.status);
  const error = useSyncStore((state) => state.error);
  const syncNow = useSyncStore((state) => state.syncNow);

  const icon =
    !online || status === "offline" ? (
      <WifiOff className="size-4" />
    ) : status === "syncing" ? (
      <Loader2 className="size-4 animate-spin" />
    ) : status === "success" ? (
      <Cloud className="size-4 text-success" />
    ) : status === "error" ? (
      <CloudOff className="size-4 text-danger" />
    ) : status === "disabled" ? (
      <CloudOff className="size-4 text-muted" />
    ) : (
      <Cloud className="size-4 text-muted" />
    );

  const label =
    !online || status === "offline"
      ? "离线"
      : status === "syncing"
        ? "同步中"
        : status === "success"
          ? "已同步"
          : status === "error"
            ? error ?? "同步失败"
            : status === "disabled"
              ? "未连接 GitHub"
              : "点击同步";

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={label}
      isDisabled={status === "syncing" || !online}
      onPress={() => void syncNow()}
      className={cn(status === "error" && "text-danger")}
    >
      {icon}
    </Button>
  );
}

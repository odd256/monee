"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { useSyncStore } from "@/lib/store/sync-store";
import {
  runSyncNow,
  setSyncRunner,
} from "@/lib/sync/scheduler";
import { setupSyncTriggers } from "@/lib/sync/triggers";

export function Bootstrap({ children }: { children: ReactNode }) {
  const ready = useAppStore((state) => state.ready);
  const onboarded = useAppStore((state) => state.onboarded);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void useAppStore.getState().init();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onOnboarding = pathname.startsWith("/onboarding");
    const onOffline = pathname.startsWith("/offline");

    if (!onboarded && !onOnboarding && !onOffline) {
      router.replace("/onboarding");
    } else if (onboarded && onOnboarding) {
      router.replace("/");
    }
  }, [ready, onboarded, pathname, router]);

  useEffect(() => {
    if (!ready || !onboarded) return;
    setSyncRunner(() => useSyncStore.getState().syncNow());
    const cleanup = setupSyncTriggers(() => {
      void runSyncNow();
    });
    const timer = window.setTimeout(() => {
      void runSyncNow();
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      cleanup();
      setSyncRunner(undefined);
    };
  }, [ready, onboarded]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <div className="flex size-14 items-center justify-center rounded-3xl bg-accent text-2xl font-bold text-accent-foreground shadow-lg">
          M
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          正在打开 Monee
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

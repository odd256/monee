"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Reading browser capabilities after mount. */
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@heroui/react";
import { isIOS, isStandalone } from "@/lib/utils/platform";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "monee.installPromptDismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    if (isIOS()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div className="above-tabbar fixed inset-x-3 z-40 md:hidden">
      <div className="flex items-start gap-3 rounded-2xl border border-separator bg-surface p-3 shadow-lg">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
          <Download className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">把 Monee 装到桌面</p>
          <p className="mt-0.5 text-xs text-muted">
            {iosHint
              ? "点击 Safari 分享按钮，然后选择“添加到主屏幕”。"
              : "像原生 App 一样打开，离线也能记账。"}
          </p>
          {!iosHint && event ? (
            <Button
              size="sm"
              className="mt-2"
              onPress={async () => {
                await event.prompt();
                const choice = await event.userChoice;
                if (choice.outcome === "accepted") dismiss();
              }}
            >
              立即安装
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="关闭安装提示"
          className="p-1 text-muted"
          onClick={dismiss}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

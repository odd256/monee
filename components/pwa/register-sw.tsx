"use client";

import { useEffect } from "react";
import { toast } from "@heroui/react";
import { registerServiceWorker } from "@/lib/pwa/register";

export function RegisterServiceWorker() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const update = await registerServiceWorker();
      if (cancelled || !update) return;
      const id = toast("Monee 有新版本", {
        description: "刷新后即可使用最新版本。",
        actionProps: {
          children: "刷新",
          onPress: () => {
            toast.close(id);
            window.location.reload();
          },
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

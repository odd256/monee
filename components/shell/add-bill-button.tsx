"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import { useEditorStore } from "@/lib/store/editor-store";

export function AddBillButton() {
  const openNew = useEditorStore((state) => state.openNew);
  const pathname = usePathname();
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  // Keep the floating action on the ledger screen; it would cover content on
  // settings, stats and budget pages.
  if (normalized !== "/") return null;

  return (
    <div className="above-tabbar fixed right-4 z-40 md:right-8">
      <Button
        isIconOnly
        size="lg"
        aria-label="记一笔"
        onPress={() => openNew("expense")}
        className="size-14 rounded-full shadow-lg shadow-accent/20"
      >
        <Plus className="size-6" />
      </Button>
    </div>
  );
}

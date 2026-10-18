"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { useLedgerStore } from "@/lib/store/ledger-store";

export function useLedger() {
  const currentBookId = useAppStore((state) => state.currentBookId);
  const monthAnchor = useLedgerStore((state) => state.monthAnchor);
  const load = useLedgerStore((state) => state.load);

  useEffect(() => {
    if (currentBookId) {
      void load(currentBookId, monthAnchor);
    }
  }, [currentBookId, monthAnchor, load]);

  return useLedgerStore();
}

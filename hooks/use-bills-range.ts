"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Loading async IndexedDB data. */
import { useEffect, useState } from "react";
import { listBills } from "@/lib/db/bills-repo";
import type { Bill } from "@/lib/domain/types";
import { useSyncStore } from "@/lib/store/sync-store";

export function useBillsRange(
  bookId: string | undefined,
  start: number,
  end: number,
) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);

  useEffect(() => {
    let cancelled = false;
    if (!bookId) {
      setBills([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    listBills(bookId, start, end)
      .then((next) => {
        if (!cancelled) setBills(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, start, end, lastSyncedAt]);

  return { bills, loading };
}

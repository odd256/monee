import { isGithubError } from "@/lib/github/errors";
import { syncBook } from "@/lib/sync/engine";
import { useAppStore } from "@/lib/store/app-store";
import { useLedgerStore } from "@/lib/store/ledger-store";
import { create } from "zustand";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "error"
  | "offline"
  | "disabled";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: number;
  error?: string;
  syncNow: () => Promise<void>;
}

let inFlight: Promise<void> | undefined;

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",

  syncNow: async () => {
    if (inFlight) return inFlight;

    const app = useAppStore.getState();
    const bookId = app.currentBookId;
    const config = app.github;

    if (!bookId || !config) {
      set({ status: "disabled" });
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ status: "offline" });
      return;
    }

    set({ status: "syncing", error: undefined });
    inFlight = (async () => {
      try {
        await syncBook(bookId, config);
        set({
          status: "success",
          lastSyncedAt: Date.now(),
          error: undefined,
        });
        await useAppStore.getState().refreshMeta();
        await useLedgerStore.getState().reload();
      } catch (error) {
        const message = isGithubError(error)
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "同步失败，请稍后重试。";
        set({ status: "error", error: message });
      } finally {
        inFlight = undefined;
      }
    })();

    return inFlight;
  },
}));

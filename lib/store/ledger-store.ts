import { listBills, softDeleteBill, upsertBills, getBill } from "@/lib/db/bills-repo";
import { monthRange } from "@/lib/domain/date";
import type { Bill, BillType } from "@/lib/domain/types";
import { newId } from "@/lib/utils/id";
import { create } from "zustand";
import { scheduleSync } from "@/lib/sync/scheduler";

export interface BillInput {
  type: BillType;
  amount: number;
  currency: string;
  categoryId: string;
  time: number;
  note?: string;
  tagIds?: string[];
  accountId?: string;
}

interface LedgerState {
  bookId?: string;
  monthAnchor: number;
  bills: Bill[];
  loading: boolean;
  load: (bookId: string, monthAnchor?: number) => Promise<void>;
  reload: () => Promise<void>;
  setMonth: (anchor: number) => void;
  addBill: (bookId: string, input: BillInput) => Promise<Bill>;
  updateBill: (bookId: string, id: string, input: BillInput) => Promise<void>;
  deleteBill: (bookId: string, id: string) => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  monthAnchor: Date.now(),
  bills: [],
  loading: false,

  load: async (bookId, monthAnchor = get().monthAnchor) => {
    set({ loading: true, bookId, monthAnchor });
    try {
      const [start, end] = monthRange(monthAnchor);
      const bills = await listBills(bookId, start, end);
      set({ bills, loading: false });
    } catch (error) {
      console.error("Failed to load bills", error);
      set({ loading: false });
    }
  },

  reload: async () => {
    const { bookId, monthAnchor } = get();
    if (!bookId) return;
    await get().load(bookId, monthAnchor);
  },

  setMonth: (anchor) => {
    set({ monthAnchor: anchor });
  },

  addBill: async (bookId, input) => {
    const now = Date.now();
    const bill: Bill = {
      ...input,
      id: newId(),
      bookId,
      createdAt: now,
      updatedAt: now,
    };
    await upsertBills([bill]);
    await get().reload();
    scheduleSync();
    return bill;
  },

  updateBill: async (bookId, id, input) => {
    const existing = await getBill(id);
    if (!existing) return;
    const next: Bill = {
      ...existing,
      ...input,
      bookId,
      id,
      updatedAt: Date.now(),
    };
    await upsertBills([next]);
    await get().reload();
    scheduleSync();
  },

  deleteBill: async (bookId, id) => {
    const existing = await getBill(id);
    if (!existing) return;
    await softDeleteBill(id, Date.now());
    await get().reload();
    scheduleSync();
  },
}));

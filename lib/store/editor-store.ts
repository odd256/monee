import type { BillType } from "@/lib/domain/types";
import { create } from "zustand";

interface EditorState {
  open: boolean;
  billId?: string;
  defaultType: BillType;
  openNew: (type?: BillType) => void;
  openEdit: (billId: string) => void;
  close: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  open: false,
  defaultType: "expense",
  openNew: (type = "expense") => set({ open: true, billId: undefined, defaultType: type }),
  openEdit: (billId) => set({ open: true, billId }),
  close: () => set({ open: false }),
}));

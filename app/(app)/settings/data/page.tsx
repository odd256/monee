"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Loading counts from IndexedDB after mount. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Database, Download, Trash2, Upload } from "lucide-react";
import { Button, Card, toast } from "@heroui/react";
import { SettingsSection } from "@/components/settings/section";
import { listAllBills, upsertBills } from "@/lib/db/bills-repo";
import {
  createBookWithMeta,
  listBooks,
} from "@/lib/db/books-repo";
import { clearLocalDatabase } from "@/lib/db/database";
import { getMeta, saveMeta } from "@/lib/db/meta-repo";
import { formatDate } from "@/lib/domain/date";
import { billSchema, bookMetaSchema } from "@/lib/domain/schemas";
import type { Bill, BookMeta, ExportedBook } from "@/lib/domain/types";
import { mergeBills, mergeMeta } from "@/lib/sync/merge";
import { useAppStore } from "@/lib/store/app-store";

interface BackupFile {
  version: number;
  exportedAt: number;
  books: ExportedBook[];
}

export default function DataSettingsPage() {
  const [count, setCount] = useState<{ books: number; bills: number } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshCount = useCallback(async () => {
    const books = await listBooks();
    let bills = 0;
    for (const book of books) {
      bills += (await listAllBills(book.id)).filter(
        (bill) => !bill.deletedAt,
      ).length;
    }
    setCount({ books: books.length, bills });
  }, []);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const books = await listBooks();
      const items: ExportedBook[] = [];
      for (const book of books) {
        const meta = await getMeta(book.id);
        if (!meta) continue;
        items.push({ meta, bills: await listAllBills(book.id) });
      }
      const backup: BackupFile = {
        version: 1,
        exportedAt: Date.now(),
        books: items,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `monee-backup-${formatDate(Date.now())}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("备份已导出");
    } catch (error) {
      console.error(error);
      toast.danger("导出失败");
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const parsed = parseBackup(raw);
      if (parsed.length === 0) {
        toast.warning("没有识别到账本数据");
        return;
      }
      for (const item of parsed) {
        await importBook(item);
      }
      await useAppStore.getState().refreshBooks();
      await useAppStore.getState().refreshMeta();
      await refreshCount();
      toast.success(`已导入 ${parsed.length} 个账本`);
    } catch (error) {
      console.error(error);
      toast.danger(
        error instanceof Error ? `导入失败：${error.message}` : "导入失败",
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SettingsSection
        title="本地数据"
        description="Monee 以 IndexedDB 为主库，导出的 JSON 包含全部账本和墓碑记录。"
      >
        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="rounded-xl bg-surface p-3">
            <p className="text-[11px] text-muted">账本</p>
            <p className="mt-0.5 text-lg font-semibold">{count?.books ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-surface p-3">
            <p className="text-[11px] text-muted">有效账单</p>
            <p className="mt-0.5 text-lg font-semibold">{count?.bills ?? "—"}</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="备份与恢复">
        <div className="flex flex-col gap-2 p-4">
          <Button
            variant="secondary"
            fullWidth
            isPending={busy}
            isDisabled={busy}
            onPress={() => void exportBackup()}
          >
            <Download className="size-4" />
            导出 JSON 备份
          </Button>
          <Button
            variant="secondary"
            fullWidth
            isDisabled={busy}
            onPress={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            导入 JSON 备份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importBackup(file);
            }}
          />
          <p className="text-[11px] leading-4 text-muted">
            导入按 id 合并，不会覆盖较新的本地记录；同一个账本会合并分类和账单。
          </p>
        </div>
      </SettingsSection>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm">清除本地数据</Card.Title>
          <Card.Description className="text-xs">
            会删除本机 IndexedDB 中的全部账本、账单和 GitHub Token。GitHub 仓库不会被修改。
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2 p-4 pt-0">
          {confirmClear ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onPress={() => setConfirmClear(false)}
              >
                取消
              </Button>
              <Button
                variant="danger"
                fullWidth
                onPress={async () => {
                  await clearLocalDatabase();
                  window.location.reload();
                }}
              >
                确认清除
              </Button>
            </div>
          ) : (
            <Button
              variant="danger-soft"
              fullWidth
              onPress={() => setConfirmClear(true)}
            >
              <Trash2 className="size-4" />
              清除本地数据
            </Button>
          )}
        </Card.Content>
      </Card>

      <p className="flex items-center justify-center gap-1.5 py-3 text-[11px] text-muted">
        <Database className="size-3" />
        数据不会上传到 Monee 服务器
      </p>
    </div>
  );
}

function parseBackup(raw: unknown): ExportedBook[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.books)) {
    return record.books.map((item) => validateBook(item));
  }
  if (record.meta && Array.isArray(record.bills)) {
    return [validateBook(record)];
  }
  return [];
}

function validateBook(raw: unknown): ExportedBook {
  if (!raw || typeof raw !== "object") {
    throw new Error("账本格式不正确");
  }
  const record = raw as Record<string, unknown>;
  const meta = bookMetaSchema.parse(record.meta);
  const bills = billSchema.array().parse(record.bills ?? []);
  return { meta, bills: bills as Bill[] };
}

async function importBook(item: ExportedBook) {
  const meta = item.meta as BookMeta;
  const importedBills = item.bills.map((bill) => ({
    ...bill,
    bookId: meta.id,
  }));
  const existingMeta = await getMeta(meta.id);
  if (!existingMeta) {
    await createBookWithMeta(meta);
    await upsertBills(importedBills);
    return;
  }

  const mergedMeta = mergeMeta(existingMeta, meta);
  const localBills = await listAllBills(meta.id);
  const { changed } = mergeBills(localBills, importedBills);
  await saveMeta(mergedMeta);
  if (changed.length > 0) {
    await upsertBills(changed);
  }
}

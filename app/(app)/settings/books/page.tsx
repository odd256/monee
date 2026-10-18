"use client";

import { useState } from "react";
import { BookOpen, Check, Plus } from "lucide-react";
import { Button, Card, toast } from "@heroui/react";
import { SettingsSection } from "@/components/settings/section";
import { formatDate } from "@/lib/domain/date";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils/cn";

export default function BooksSettingsPage() {
  const books = useAppStore((state) => state.books);
  const currentBookId = useAppStore((state) => state.currentBookId);
  const switchBook = useAppStore((state) => state.switchBook);
  const addBook = useAppStore((state) => state.addBook);

  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      toast.warning("请输入账本名称");
      return;
    }
    setAdding(true);
    try {
      const id = await addBook(name);
      await switchBook(id);
      setName("");
      toast.success("账本已创建");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SettingsSection
        title="我的账本"
        description="每个账本在 GitHub 仓库里有独立的 books/<id>/ 目录。"
      >
        <div className="divide-y divide-separator">
          {books.map((book) => {
            const active = book.id === currentBookId;
            return (
              <button
                key={book.id}
                type="button"
                onClick={async () => {
                  if (active) return;
                  await switchBook(book.id);
                  toast.success(`已切换到「${book.name}」`);
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface text-muted",
                  )}
                >
                  <BookOpen className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{book.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    创建于 {formatDate(book.createdAt)}
                  </span>
                </span>
                {active ? (
                  <span className="flex items-center gap-1 text-[11px] text-accent">
                    <Check className="size-3.5" />
                    当前
                  </span>
                ) : (
                  <span className="text-[11px] text-muted">切换</span>
                )}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm">新建账本</Card.Title>
          <Card.Description className="text-xs">
            例如「家庭账本」「旅行账本」，数据仍然同步到同一个仓库。
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex gap-2 p-4 pt-0">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            placeholder="账本名称"
            className="h-10 min-w-0 flex-1 rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
            onKeyDown={(event) => {
              if (event.key === "Enter") void create();
            }}
          />
          <Button
            isPending={adding}
            isDisabled={adding}
            onPress={() => void create()}
          >
            <Plus className="size-4" />
            创建
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

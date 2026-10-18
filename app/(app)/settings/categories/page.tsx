"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@heroui/react";
import { CategoryEditor } from "@/components/settings/category-editor";
import { SettingsSection } from "@/components/settings/section";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  childrenOf,
  topLevelCategories,
} from "@/lib/domain/categories";
import type { BillType, Category } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store/app-store";

export default function CategoriesSettingsPage() {
  const meta = useAppStore((state) => state.meta);
  const categories = meta?.categories ?? [];
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const [initialType, setInitialType] = useState<BillType>("expense");

  const openNew = (type: BillType) => {
    setEditing(undefined);
    setInitialType(type);
    setEditorOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setInitialType(category.type);
    setEditorOpen(true);
  };

  const renderSection = (type: BillType, title: string) => {
    const tops = topLevelCategories(categories, type);
    return (
      <SettingsSection
        title={title}
        description={
          type === "expense"
            ? "点击分类可以修改名称、图标和颜色。"
            : "收入分类通常不需要太多层级。"
        }
      >
        <div className="divide-y divide-separator">
          {tops.map((category) => {
            const children = childrenOf(categories, category.id);
            return (
              <div key={category.id}>
                <CategoryRow category={category} onClick={() => openEdit(category)} />
                {children.map((child) => (
                  <CategoryRow
                    key={child.id}
                    category={child}
                    indent
                    onClick={() => openEdit(child)}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <div className="border-t border-separator p-3">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onPress={() => openNew(type)}
          >
            <Plus className="size-4" />
            添加{title}
          </Button>
        </div>
      </SettingsSection>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {renderSection("expense", "支出分类")}
      {renderSection("income", "收入分类")}

      <CategoryEditor
        open={editorOpen}
        category={editing}
        initialType={initialType}
        onOpenChange={(next) => {
          setEditorOpen(next);
          if (!next) setEditing(undefined);
        }}
      />
    </div>
  );
}

function CategoryRow({
  category,
  indent,
  onClick,
}: {
  category: Category;
  indent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${category.color}1f`,
          color: category.color,
        }}
      >
        <CategoryIcon name={category.icon} className="size-4" />
      </span>
      <span className={indent ? "pl-4 text-sm" : "text-sm font-medium"}>
        {category.name}
      </span>
    </button>
  );
}

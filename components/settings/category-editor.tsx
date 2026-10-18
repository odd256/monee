"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The drawer form is reset when it opens. */
import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button, Drawer, toast } from "@heroui/react";
import {
  CATEGORY_ICON_NAMES,
  CategoryIcon,
} from "@/components/ui/category-icon";
import {
  categoriesForType,
  topLevelCategories,
} from "@/lib/domain/categories";
import type { BillType, Category } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils/cn";
import { newId } from "@/lib/utils/id";

const COLORS = [
  "#0f766e",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#14b8a6",
  "#64748b",
];

export function CategoryEditor({
  open,
  category,
  initialType,
  onOpenChange,
}: {
  open: boolean;
  category?: Category;
  initialType: BillType;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = useAppStore((state) => state.meta);
  const saveMeta = useAppStore((state) => state.saveMeta);

  const [name, setName] = useState("");
  const [type, setType] = useState<BillType>(initialType);
  const [parentId, setParentId] = useState<string>("");
  const [icon, setIcon] = useState("ellipsis");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = meta?.categories ?? [];
  const parents = topLevelCategories(categories, type).filter(
    (item) => item.id !== category?.id,
  );

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (category) {
      setName(category.name);
      setType(category.type);
      setParentId(category.parentId ?? "");
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setName("");
      setType(initialType);
      setParentId("");
      setIcon("ellipsis");
      setColor(COLORS[0]);
    }
  }, [open, category, initialType]);

  const save = async () => {
    if (!name.trim()) {
      toast.warning("请输入分类名称");
      return;
    }
    setSaving(true);
    try {
      const now = Date.now();
      const existing = category;
      const next: Category = {
        id: existing?.id ?? newId(),
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        icon,
        color,
        order:
          existing?.order ??
          Math.max(
            0,
            ...categoriesForType(categories, type).map((item) => item.order),
          ) +
            10,
        updatedAt: now,
      };
      await saveMeta((current) => ({
        ...current,
        categories: existing
          ? current.categories.map((item) =>
              item.id === existing.id ? next : item,
            )
          : [...current.categories, next],
      }));
      toast.success(existing ? "分类已更新" : "分类已创建");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.danger("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!category) return;
    const now = Date.now();
    await saveMeta((current) => ({
      ...current,
      categories: current.categories.map((item) =>
        item.id === category.id || item.parentId === category.id
          ? { ...item, deletedAt: now, updatedAt: now }
          : item,
      ),
    }));
    toast.success("分类已删除");
    onOpenChange(false);
  };

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="max-h-[90dvh]">
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>
              {category ? "编辑分类" : "新建分类"}
            </Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4 pb-4">
            <label className="block">
              <span className="text-xs text-muted">名称</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={12}
                placeholder="例如：咖啡"
                className="mt-1 h-11 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
              />
            </label>

            <div>
              <span className="text-xs text-muted">类型</span>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
                {(["expense", "income"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setType(value);
                      setParentId("");
                    }}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium transition-colors",
                      type === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted",
                    )}
                  >
                    {value === "expense" ? "支出" : "收入"}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs text-muted">父分类（可选）</span>
              <select
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">作为一级分类</option>
                {parents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-xs text-muted">图标</span>
              <div className="mt-1 grid grid-cols-8 gap-1">
                {CATEGORY_ICON_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    onClick={() => setIcon(name)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                      icon === name
                        ? "border-accent bg-accent-soft text-accent-soft-foreground"
                        : "border-separator text-muted",
                    )}
                  >
                    <CategoryIcon name={name} className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted">颜色</span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {COLORS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={value}
                    onClick={() => setColor(value)}
                    className={cn(
                      "size-7 rounded-full border-2",
                      color === value
                        ? "border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: value }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  aria-label="自定义颜色"
                  className="size-7 cursor-pointer rounded-full border border-separator bg-transparent p-0"
                />
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer className="flex-col gap-2">
            <Button
              fullWidth
              isPending={saving}
              isDisabled={saving}
              onPress={() => void save()}
            >
              {saving ? null : <Check className="size-4" />}
              {saving ? "保存中…" : "保存"}
            </Button>
            {category ? (
              confirmDelete ? (
                <div className="flex w-full gap-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    onPress={() => setConfirmDelete(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onPress={() => void remove()}
                  >
                    确认删除
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  fullWidth
                  className="text-danger"
                  onPress={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  删除分类
                </Button>
              )
            ) : null}
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

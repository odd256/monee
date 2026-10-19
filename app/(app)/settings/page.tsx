"use client";

import Link from "next/link";
import {
  BookOpen,
  Cloud,
  Database,
  GitBranch,
  Info,
  Palette,
  Settings2,
  Tags,
} from "lucide-react";
import { SettingsLink, SettingsSection } from "@/components/settings/section";
import { useAppStore } from "@/lib/store/app-store";
import { useSyncStore } from "@/lib/store/sync-store";
import { relativeTime } from "@/lib/utils/format";

export default function SettingsPage() {
  const github = useAppStore((state) => state.github);
  const meta = useAppStore((state) => state.meta);
  const status = useSyncStore((state) => state.status);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SettingsSection>
        <div className="flex items-center gap-3 p-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-foreground">
            M
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{meta?.name ?? "我的账本"}</p>
            <p className="mt-0.5 text-xs text-muted">
              {github
                ? `已连接 ${github.owner}/${github.repo}`
                : "本地模式 · 数据只在这台设备"}
            </p>
          </div>
          <Link
            href="/settings/github"
            prefetch={false}
            className="rounded-full bg-surface px-3 py-1.5 text-xs text-accent"
          >
            {github ? "同步设置" : "连接 GitHub"}
          </Link>
        </div>
        <div className="flex items-center justify-between border-t border-separator px-4 py-2.5 text-[11px] text-muted">
          <span>
            {status === "syncing"
              ? "正在同步…"
              : status === "error"
                ? "上次同步失败"
                : lastSyncedAt
                  ? `上次同步 ${relativeTime(lastSyncedAt)}`
                  : "尚未同步"}
          </span>
        </div>
      </SettingsSection>

      <SettingsSection>
        <SettingsLink
          href="/settings/books"
          icon={BookOpen}
          title="账本"
          description="切换、创建和查看多个账本"
          accent="#0f766e"
        />
        <div className="mx-4 border-t border-separator" />
        <SettingsLink
          href="/settings/categories"
          icon={Tags}
          title="分类"
          description="管理收支分类和图标颜色"
          accent="#f59e0b"
        />
        <div className="mx-4 border-t border-separator" />
        <SettingsLink
          href="/settings/github"
          icon={GitBranch}
          title="GitHub 同步"
          description="私有仓库、Token 和手动同步"
          accent="#334155"
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsLink
          href="/settings/appearance"
          icon={Palette}
          title="外观"
          description="主题模式与主题色"
          accent="#8b5cf6"
        />
        <div className="mx-4 border-t border-separator" />
        <SettingsLink
          href="/settings/data"
          icon={Database}
          title="数据"
          description="导出备份、导入和清除本地缓存"
          accent="#0ea5e9"
        />
        <div className="mx-4 border-t border-separator" />
        <SettingsLink
          href="/settings/about"
          icon={Info}
          title="关于 Monee"
          description="版本、原理和隐私说明"
          accent="#64748b"
        />
      </SettingsSection>

      <div className="flex items-center justify-center gap-1.5 py-4 text-[11px] text-muted">
        <Cloud className="size-3" />
        本地优先 · GitHub 存储
        <span className="mx-1">·</span>
        <Settings2 className="size-3" />
        v0.1.0
      </div>
    </div>
  );
}

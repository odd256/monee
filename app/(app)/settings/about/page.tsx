"use client";

import { Cloud, GitBranch, ShieldCheck, Smartphone } from "lucide-react";
import { SettingsSection } from "@/components/settings/section";
import { APP_VERSION } from "@/lib/config";
import { useAppStore } from "@/lib/store/app-store";

export default function AboutSettingsPage() {
  const meta = useAppStore((state) => state.meta);
  const github = useAppStore((state) => state.github);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-[1.4rem] bg-accent text-3xl font-bold text-accent-foreground shadow-lg shadow-accent/20">
          M
        </div>
        <div>
          <h2 className="text-xl font-semibold">Monee</h2>
          <p className="mt-0.5 text-xs text-muted">v{APP_VERSION} · 个人记账 PWA</p>
        </div>
      </div>

      <SettingsSection title="它怎么工作">
        <div className="flex flex-col gap-4 p-4 text-sm leading-6 text-muted">
          <div className="flex gap-3">
            <Smartphone className="mt-1 size-4 shrink-0 text-accent" />
            <p>
              所有账单先写入浏览器 IndexedDB，离线也能查看和记录。
              安装到桌面后，可以像原生应用一样打开。
            </p>
          </div>
          <div className="flex gap-3">
            <GitBranch className="mt-1 size-4 shrink-0 text-accent" />
            <p>
              连接 GitHub 后，账本按年写入你自己的私有仓库。每次同步只上传变化的文件，
              历史提交就是版本记录。
            </p>
          </div>
          <div className="flex gap-3">
            <Cloud className="mt-1 size-4 shrink-0 text-accent" />
            <p>
              当前账本：{meta?.name ?? "—"}
              {github
                ? ` · 同步到 ${github.owner}/${github.repo}`
                : " · 尚未连接 GitHub"}
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="隐私">
        <div className="flex gap-3 p-4 text-sm leading-6 text-muted">
          <ShieldCheck className="mt-1 size-4 shrink-0 text-accent" />
          <p>
            Monee 没有后端服务器，不会收集、上传或分析你的账本数据。
            GitHub Token 只保存在本机，仅用于直接请求 api.github.com。
          </p>
        </div>
      </SettingsSection>

      <p className="pb-4 text-center text-[11px] text-muted">
        Built with Next.js · HeroUI · Dexie
      </p>
    </div>
  );
}

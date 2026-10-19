"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { SettingsSection } from "@/components/settings/section";
import { useAccent } from "@/hooks/use-accent";
import { useMounted } from "@/hooks/use-mounted";
import { ACCENT_OPTIONS } from "@/lib/theme/accent";
import { isStandalone } from "@/lib/utils/platform";
import { cn } from "@/lib/utils/cn";

const OPTIONS = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const mounted = useMounted();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SettingsSection
        title="主题"
        description="Monee 的配色使用 HeroUI 的 oklch 主题变量。"
      >
        <div className="grid grid-cols-3 gap-2 p-4">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs transition-colors",
                  active
                    ? "border-accent bg-accent-soft text-accent-soft-foreground"
                    : "border-separator text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="主题色"
        description="选择后立即生效，只保存在这台设备。"
      >
        <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
          {ACCENT_OPTIONS.map((option) => {
            const active = mounted && accent === option.id;
            return (
              <button
                key={option.id}
                type="button"
                data-accent={option.id}
                aria-pressed={active}
                onClick={() => setAccent(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 text-[11px] transition-colors",
                  active
                    ? "border-foreground/20 bg-surface"
                    : "border-transparent hover:bg-surface",
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
                  {active ? <Check className="size-4" /> : null}
                </span>
                <span
                  className={active ? "font-medium text-foreground" : "text-muted"}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="安装状态">
        <div className="px-4 py-3 text-sm">
          {mounted && isStandalone()
            ? "已作为独立应用运行。"
            : "在浏览器中打开。使用浏览器菜单中的“安装”或“添加到主屏幕”即可像 App 一样使用。"}
        </div>
      </SettingsSection>
    </div>
  );
}

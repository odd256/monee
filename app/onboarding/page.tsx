"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Cloud,
  GitBranch,
  HardDrive,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, toast } from "@heroui/react";
import { validateGithubConfig } from "@/lib/github/client";
import { isGithubError } from "@/lib/github/errors";
import { DEFAULT_CURRENCY } from "@/lib/domain/defaults";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils/cn";

type Mode = "local" | "github";

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [mode, setMode] = useState<Mode>("local");
  const [bookName, setBookName] = useState("我的账本");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState<{
    login: string;
    fullName: string;
    defaultBranch: string;
  } | null>(null);

  const canSubmit =
    bookName.trim().length > 0 &&
    (mode === "local" ||
      (token.trim() && owner.trim() && repo.trim() && validated !== null));

  const testConnection = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      toast.warning("请填写 Token、仓库所有者和仓库名");
      return;
    }
    setTesting(true);
    setValidated(null);
    try {
      const { user, repo: repository } = await validateGithubConfig({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
      });
      setValidated({
        login: user.login,
        fullName: repository.full_name,
        defaultBranch: repository.default_branch,
      });
      setBranch(repository.default_branch || branch || "main");
      toast.success(`已连接 ${repository.full_name}`);
    } catch (error) {
      const message = isGithubError(error)
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : "连接失败";
      toast.danger(message);
    } finally {
      setTesting(false);
    }
  };

  const start = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await completeOnboarding({
        bookName: bookName.trim(),
        currency,
        github:
          mode === "github" && validated
            ? {
                token: token.trim(),
                owner: owner.trim(),
                repo: repo.trim(),
                branch: branch.trim() || validated.defaultBranch,
              }
            : undefined,
      });
      router.replace("/");
    } catch (error) {
      console.error(error);
      toast.danger("初始化失败，请重试");
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-[1.4rem] bg-accent text-3xl font-bold text-accent-foreground shadow-lg shadow-accent/20">
          M
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">欢迎使用 Monee</h1>
          <p className="mt-1 text-sm text-muted">
            本地优先的个人记账，数据可以放在你自己的 GitHub 私有仓库里。
          </p>
        </div>
      </div>

      <Card>
        <Card.Content className="gap-5 p-5">
          <div>
            <label className="text-sm font-medium" htmlFor="book-name">
              账本名称
            </label>
            <input
              id="book-name"
              value={bookName}
              onChange={(event) => setBookName(event.target.value)}
              maxLength={24}
              className="mt-2 h-11 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
              placeholder="我的账本"
            />
          </div>

          <div>
            <span className="text-sm font-medium">数据存放方式</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("local")}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors",
                  mode === "local"
                    ? "border-accent bg-accent-soft text-accent-soft-foreground"
                    : "border-separator bg-surface text-muted",
                )}
              >
                <HardDrive className="size-5" />
                <span className="text-sm font-medium">先本地使用</span>
                <span className="text-[11px] leading-4 opacity-80">
                  数据保存在本机，之后随时可以连接 GitHub。
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("github")}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors",
                  mode === "github"
                    ? "border-accent bg-accent-soft text-accent-soft-foreground"
                    : "border-separator bg-surface text-muted",
                )}
              >
                <GitBranch className="size-5" />
                <span className="text-sm font-medium">连接 GitHub</span>
                <span className="text-[11px] leading-4 opacity-80">
                  同步到你的私有仓库，换设备也能恢复。
                </span>
              </button>
            </div>
          </div>

          {mode === "github" ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-separator p-3">
              <div className="flex items-start gap-2 text-xs text-muted">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                <p>
                  Token 只保存在这台设备，直接请求 api.github.com。建议创建只授权单仓库、
                  Contents 读写的 Fine-grained Token。
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-accent underline underline-offset-2"
                  >
                    去创建
                  </a>
                </p>
              </div>

              <label className="block">
                <span className="text-xs text-muted">Fine-grained Token</span>
                <input
                  type="password"
                  value={token}
                  onChange={(event) => {
                    setToken(event.target.value);
                    setValidated(null);
                  }}
                  autoComplete="off"
                  placeholder="github_pat_..."
                  className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 font-mono text-xs outline-none focus:border-accent"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-muted">仓库所有者</span>
                  <input
                    value={owner}
                    onChange={(event) => {
                      setOwner(event.target.value);
                      setValidated(null);
                    }}
                    placeholder="your-name"
                    className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">仓库名</span>
                  <input
                    value={repo}
                    onChange={(event) => {
                      setRepo(event.target.value);
                      setValidated(null);
                    }}
                    placeholder="monee-data"
                    className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
                  />
                </label>
              </div>

              <div className="flex items-end gap-2">
                <label className="block flex-1">
                  <span className="text-xs text-muted">分支</span>
                  <input
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    placeholder="main"
                    className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
                  />
                </label>
                <Button
                  variant="secondary"
                  isPending={testing}
                  isDisabled={testing}
                  onPress={() => void testConnection()}
                >
                  {testing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Cloud className="size-4" />
                  )}
                  测试连接
                </Button>
              </div>

              {validated ? (
                <div className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-xs text-success-soft-foreground">
                  <Check className="size-4" />
                  <span>
                    已连接 {validated.fullName}（{validated.login}）
                  </span>
                </div>
              ) : null}

              <p className="text-[11px] text-muted">
                仓库需要是私有的；如果仓库还没有数据，Monee 会在首次同步时创建
                books/ 目录。Token 需要 Contents 读写权限。
              </p>
            </div>
          ) : null}

          <label className="block">
            <span className="text-xs text-muted">本位币</span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
            >
              <option value="CNY">人民币 CNY</option>
              <option value="USD">美元 USD</option>
              <option value="EUR">欧元 EUR</option>
              <option value="JPY">日元 JPY</option>
              <option value="HKD">港币 HKD</option>
            </select>
          </label>

          <Button
            fullWidth
            isPending={saving}
            isDisabled={!canSubmit || saving}
            onPress={() => void start()}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {mode === "github" ? "创建账本并连接" : "开始记账"}
          </Button>

          {mode === "github" && !validated ? (
            <p className="-mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-muted">
              <KeyRound className="size-3" />
              先测试连接，再开始使用
            </p>
          ) : null}
        </Card.Content>
      </Card>

      <p className="text-center text-[11px] text-muted">
        Monee 没有服务器，不会收集你的账本数据。
      </p>
    </main>
  );
}

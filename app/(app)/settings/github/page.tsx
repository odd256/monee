"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Keep the form in sync with the connected account. */
import { useEffect, useState } from "react";
import {
  Check,
  Cloud,
  ExternalLink,
  GitBranch,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, toast } from "@heroui/react";
import { SettingsSection } from "@/components/settings/section";
import { useOnline } from "@/hooks/use-online";
import { validateGithubConfig } from "@/lib/github/client";
import { isGithubError } from "@/lib/github/errors";
import { useAppStore } from "@/lib/store/app-store";
import { useSyncStore } from "@/lib/store/sync-store";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function GithubSettingsPage() {
  const github = useAppStore((state) => state.github);
  const setGithub = useAppStore((state) => state.setGithub);
  const status = useSyncStore((state) => state.status);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const syncError = useSyncStore((state) => state.error);
  const syncNow = useSyncStore((state) => state.syncNow);
  const online = useOnline();

  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    setToken(github?.token ?? "");
    setOwner(github?.owner ?? "");
    setRepo(github?.repo ?? "");
    setBranch(github?.branch ?? "main");
    setValidated(null);
  }, [github]);

  const test = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      toast.warning("请填写 Token、所有者和仓库名");
      return;
    }
    setTesting(true);
    try {
      const { repo: repository } = await validateGithubConfig({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
      });
      setValidated(repository.full_name);
      setBranch(repository.default_branch || branch || "main");
      toast.success(`连接成功：${repository.full_name}`);
    } catch (error) {
      setValidated(null);
      toast.danger(
        isGithubError(error)
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "连接失败",
      );
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      toast.warning("请填写完整的 GitHub 配置");
      return;
    }
    setSaving(true);
    try {
      await setGithub({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || "main",
      });
      toast.success("GitHub 配置已保存");
      setValidated(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SettingsSection
        title="连接状态"
        description="Monee 直接请求 GitHub，不需要自己的服务器。"
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  github
                    ? online
                      ? "bg-success"
                      : "bg-warning"
                    : "bg-muted",
                )}
              />
              <span className="text-sm font-medium">
                {github ? `${github.owner}/${github.repo}` : "尚未连接"}
              </span>
            </div>
            {github ? (
              <a
                href={`https://github.com/${github.owner}/${github.repo}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-accent"
              >
                打开仓库
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted">
            <div>
              分支：<span className="text-foreground">{github?.branch ?? "-"}</span>
            </div>
            <div>
              上次同步：
              <span className="text-foreground">
                {lastSyncedAt ? relativeTime(lastSyncedAt) : "从未"}
              </span>
            </div>
          </div>
          {syncError ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger-soft-foreground">
              {syncError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              isDisabled={!github || status === "syncing" || !online}
              isPending={status === "syncing"}
              onPress={() => void syncNow()}
            >
              {status === "syncing" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Cloud className="size-4" />
              )}
              立即同步
            </Button>
            {github ? (
              confirmDisconnect ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => setConfirmDisconnect(false)}
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onPress={async () => {
                      await setGithub(undefined);
                      await syncNow();
                      setConfirmDisconnect(false);
                      toast.success("已断开 GitHub，本地数据保留");
                    }}
                  >
                    确认断开
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onPress={() => setConfirmDisconnect(true)}
                >
                  <LogOut className="size-4" />
                  断开
                </Button>
              )
            ) : null}
          </div>
        </div>
      </SettingsSection>

      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2 text-sm">
            <GitBranch className="size-4" />
            Fine-grained Token
          </Card.Title>
          <Card.Description className="text-xs">
            只授权一个私有仓库，权限选择 Contents: Read and write。
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3 p-4 pt-0">
          <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-[11px] leading-5 text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Token 只保存在本地 IndexedDB，不会上传到任何 Monee 服务器。
              在公共电脑上使用后，请记得断开连接或清除本地数据。
            </p>
          </div>

          <label className="block">
            <span className="text-xs text-muted">Token</span>
            <input
              type="password"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setValidated(null);
              }}
              placeholder="github_pat_..."
              autoComplete="off"
              className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 font-mono text-xs outline-none focus:border-accent"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-muted">所有者</span>
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
              <span className="text-xs text-muted">仓库</span>
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

          <label className="block">
            <span className="text-xs text-muted">分支</span>
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder="main"
              className="mt-1 h-10 w-full rounded-field border border-field-border bg-field px-3 text-sm outline-none focus:border-accent"
            />
          </label>

          {validated ? (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <Check className="size-3.5" />
              已连接 {validated}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              isPending={testing}
              isDisabled={testing}
              onPress={() => void test()}
            >
              {testing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Cloud className="size-4" />
              )}
              测试连接
            </Button>
            <Button
              size="sm"
              isPending={saving}
              isDisabled={saving}
              onPress={() => void save()}
            >
              保存配置
            </Button>
          </div>

          <p className="text-[11px] text-muted">
            还没有 Token？
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent underline underline-offset-2"
            >
              在 GitHub 创建
            </a>
            。仓库为空时，首次同步会自动创建 books/ 目录。
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

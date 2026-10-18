import { SYNC_MAX_RETRIES } from "@/lib/config";
import { listAllBills, upsertBills } from "@/lib/db/bills-repo";
import { getMeta, saveMeta } from "@/lib/db/meta-repo";
import { putRemoteFiles, getRemoteFile } from "@/lib/db/remote-cache-repo";
import { patchSyncState, saveSyncState } from "@/lib/db/sync-state-repo";
import { createBookMeta } from "@/lib/domain/defaults";
import { billSchema, bookMetaSchema } from "@/lib/domain/schemas";
import type { Bill, BookMeta, GithubConfig } from "@/lib/domain/types";
import {
  createBlob,
  createCommit,
  createTree,
  getCommit,
  getRef,
  getRepo,
  getTree,
  putFile,
  readJsonBlob,
  updateRef,
} from "@/lib/github/client";
import { isGithubError } from "@/lib/github/errors";
import type { GithubTreeEntry } from "@/lib/github/types";
import { sleep } from "@/lib/utils/platform";
import { dirtyYears, mergeBills, mergeMeta, metaNeedsPush } from "./merge";
import { billsPath, metaPath, parseBookFilePath } from "./paths";

export type SyncResultStatus = "success" | "disabled" | "offline";

export interface SyncResult {
  status: SyncResultStatus;
  pushedFiles: number;
  headSha?: string;
}

interface RemoteBook {
  headSha: string;
  treeSha: string;
  entries: GithubTreeEntry[];
}

interface RemoteData {
  remote?: RemoteBook;
  meta?: BookMeta;
  bills: Bill[];
  files: { path: string; sha: string; content: unknown }[];
}

interface PullResult {
  remote: RemoteBook;
  remoteMeta?: BookMeta;
  remoteBills: Bill[];
  mergedMeta: BookMeta;
  mergedBills: Bill[];
  metaNeedsPush: boolean;
  dirtyYears: number[];
}

function configFor(config: GithubConfig) {
  return {
    token: config.token,
    owner: config.owner,
    repo: config.repo,
  };
}

async function loadRemoteBook(
  config: GithubConfig,
  branch: string,
): Promise<RemoteBook | undefined> {
  const ref = await getRef(configFor(config), branch);
  if (!ref) return undefined;
  const commit = await getCommit(configFor(config), ref.object.sha);
  const tree = await getTree(configFor(config), commit.tree.sha);
  return {
    headSha: ref.object.sha,
    treeSha: commit.tree.sha,
    entries: tree.tree.filter((entry) => entry.type === "blob"),
  };
}

async function fetchRemoteData(
  bookId: string,
  config: GithubConfig,
  remote: RemoteBook,
): Promise<RemoteData> {
  let meta: BookMeta | undefined;
  const bills: Bill[] = [];
  const files: { path: string; sha: string; content: unknown }[] = [];

  for (const entry of remote.entries) {
    const parsedPath = parseBookFilePath(bookId, entry.path);
    if (!parsedPath) continue;

    let content: unknown;
    const cached = await getRemoteFile(bookId, entry.path);
    if (cached && cached.sha === entry.sha) {
      content = cached.content;
    } else {
      content = await readJsonBlob(configFor(config), entry.sha);
      files.push({ path: entry.path, sha: entry.sha, content });
    }

    if (parsedPath.kind === "meta") {
      const parsed = bookMetaSchema.safeParse(content);
      if (!parsed.success) {
        throw new Error(`远端 ${entry.path} 格式不正确`);
      }
      meta = { ...parsed.data, id: bookId };
    } else {
      const parsed = billSchema.array().safeParse(content);
      if (!parsed.success) {
        throw new Error(`远端 ${entry.path} 格式不正确`);
      }
      bills.push(
        ...parsed.data.map((bill) => ({
          ...bill,
          bookId,
        })),
      );
    }
  }

  if (files.length > 0) {
    await putRemoteFiles(bookId, files);
  }

  return { remote, meta, bills, files };
}

async function pullAndMerge(
  bookId: string,
  config: GithubConfig,
  remote: RemoteBook,
): Promise<PullResult> {
  const remoteData = await fetchRemoteData(bookId, config, remote);
  const localMeta = await getMeta(bookId);
  const localBills = await listAllBills(bookId);

  // A freshly installed app has a default meta that was never edited. When
  // restoring from GitHub, let the remote copy win instead of overwriting it
  // with timestamps from the new device.
  const localMetaIsPristine =
    localBills.length === 0 &&
    localMeta !== undefined &&
    localMeta.updatedAt === localMeta.createdAt;

  let mergedMeta: BookMeta;
  if (remoteData.meta) {
    mergedMeta =
      localMeta && !localMetaIsPristine
        ? mergeMeta(localMeta, remoteData.meta)
        : remoteData.meta;
  } else {
    mergedMeta = localMeta ?? createBookMeta(bookId, "我的账本");
  }
  await saveMeta(mergedMeta);

  const { merged, changed } = mergeBills(localBills, remoteData.bills);
  if (changed.length > 0) {
    await upsertBills(changed);
  }

  return {
    remote,
    remoteMeta: remoteData.meta,
    remoteBills: remoteData.bills,
    mergedMeta,
    mergedBills: merged,
    metaNeedsPush: remoteData.meta
      ? metaNeedsPush(mergedMeta, remoteData.meta)
      : true,
    dirtyYears: dirtyYears(merged, remoteData.bills),
  };
}

interface PushResult {
  headSha: string;
  treeSha: string;
  pushedFiles: number;
}

async function pushChanges(
  bookId: string,
  config: GithubConfig,
  branch: string,
  remote: RemoteBook,
  pulled: PullResult,
  signal?: AbortSignal,
): Promise<PushResult | undefined> {
  const allBills = await listAllBills(bookId);
  const files: { path: string; content: unknown }[] = [];

  if (pulled.metaNeedsPush) {
    files.push({ path: metaPath(bookId), content: pulled.mergedMeta });
  }

  for (const year of pulled.dirtyYears) {
    const yearBills = allBills
      .filter((bill) => new Date(bill.time).getFullYear() === year)
      .sort((a, b) => a.time - b.time);
    files.push({ path: billsPath(bookId, year), content: yearBills });
  }

  if (files.length === 0) return undefined;

  const blobs = await Promise.all(
    files.map(async (file) => ({
      ...file,
      sha: (await createBlob(configFor(config), file.content, signal)).sha,
    })),
  );

  const tree = await createTree(
    configFor(config),
    remote.treeSha,
    blobs.map((blob) => ({ path: blob.path, sha: blob.sha })),
    signal,
  );

  const commit = await createCommit(
    configFor(config),
    {
      message: `monee: sync ${files.length} file${files.length > 1 ? "s" : ""}`,
      tree: tree.sha,
      parents: [remote.headSha],
    },
    signal,
  );

  await updateRef(configFor(config), branch, commit.sha, signal);

  await putRemoteFiles(
    bookId,
    blobs.map((blob) => ({
      path: blob.path,
      sha: blob.sha,
      content: blob.content,
    })),
  );

  return {
    headSha: commit.sha,
    treeSha: tree.sha,
    pushedFiles: files.length,
  };
}

function errorMessage(error: unknown): string {
  if (isGithubError(error)) return error.userMessage;
  if (error instanceof Error) return error.message;
  return "同步失败，请稍后重试。";
}

/**
 * Sync one book with GitHub. The caller is responsible for deduplicating
 * concurrent runs (see lib/sync/scheduler.ts).
 */
export async function syncBook(
  bookId: string,
  config: GithubConfig,
): Promise<SyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { status: "offline", pushedFiles: 0 };
  }

  const repo = await getRepo(configFor(config));
  let branch = config.branch || repo.default_branch;
  let lastError: unknown;

  for (let attempt = 0; attempt < SYNC_MAX_RETRIES; attempt += 1) {
    // Capture the start time before pulling. Writes that happen during the
    // sync get a newer updatedAt and will be picked up next time.
    const startedAt = Date.now();
    try {
      let remote = await loadRemoteBook(config, branch);
      if (!remote && branch !== repo.default_branch) {
        branch = repo.default_branch;
        remote = await loadRemoteBook(config, branch);
      }

      if (!remote) {
        // Empty repository: create the first file through the Contents API so
        // GitHub creates the initial commit and branch for us.
        const meta =
          (await getMeta(bookId)) ?? createBookMeta(bookId, "我的账本");
        await saveMeta(meta);
        await putFile(configFor(config), {
          path: metaPath(bookId),
          content: meta,
          message: "monee: initialize book",
          branch,
        });
        remote = await loadRemoteBook(config, branch);
        if (!remote) throw new Error("无法初始化 GitHub 仓库");
      }

      const pulled = await pullAndMerge(bookId, config, remote);
      const pushed = await pushChanges(
        bookId,
        config,
        branch,
        remote,
        pulled,
      );

      const headSha = pushed?.headSha ?? remote.headSha;
      const treeSha = pushed?.treeSha ?? remote.treeSha;

      await saveSyncState({
        bookId,
        headSha,
        treeSha,
        lastSyncedAt: startedAt,
      });

      return {
        status: "success",
        pushedFiles: pushed?.pushedFiles ?? 0,
        headSha,
      };
    } catch (error) {
      lastError = error;
      if (
        isGithubError(error) &&
        error.isConflict &&
        attempt < SYNC_MAX_RETRIES - 1
      ) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  const message = errorMessage(lastError);
  await patchSyncState(bookId, { lastError: message });
  throw lastError instanceof Error ? lastError : new Error(message);
}

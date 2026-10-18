import { GITHUB_API_BASE } from "@/lib/config";
import { base64ToUtf8, utf8ToBase64 } from "./base64";
import { GithubError } from "./errors";
import type {
  GithubBlob,
  GithubCommit,
  GithubContent,
  GithubRef,
  GithubRepo,
  GithubTree,
  GithubUser,
} from "./types";

export interface GithubRequestConfig {
  token: string;
  owner?: string;
  repo?: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function githubRequest<T>(
  config: GithubRequestConfig,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      // Ignore malformed error bodies.
    }
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    const rateLimitReset =
      remaining === "0" && reset ? Number(reset) * 1000 : undefined;
    throw new GithubError(response.status, message, rateLimitReset);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function repoPath(config: GithubRequestConfig, suffix: string): string {
  if (!config.owner || !config.repo) {
    throw new Error("GitHub owner/repo is not configured");
  }
  return `/repos/${config.owner}/${config.repo}${suffix}`;
}

export async function getAuthenticatedUser(token: string): Promise<GithubUser> {
  return githubRequest<GithubUser>({ token }, "/user");
}

export async function getRepo(
  config: GithubRequestConfig,
): Promise<GithubRepo> {
  return githubRequest<GithubRepo>(config, repoPath(config, ""));
}

export async function validateGithubConfig(input: {
  token: string;
  owner: string;
  repo: string;
}) {
  const user = await getAuthenticatedUser(input.token);
  const repo = await getRepo(input);
  if (repo.permissions && !repo.permissions.push) {
    throw new GithubError(403, "Token 没有该仓库的写入权限");
  }
  return { user, repo };
}

export async function getRef(
  config: GithubRequestConfig,
  branch: string,
): Promise<GithubRef | undefined> {
  try {
    return await githubRequest<GithubRef>(
      config,
      repoPath(config, `/git/ref/heads/${encodeURIComponent(branch)}`),
    );
  } catch (error) {
    if (error instanceof GithubError && (error.status === 404 || error.status === 409)) {
      return undefined;
    }
    throw error;
  }
}

export async function getCommit(
  config: GithubRequestConfig,
  sha: string,
): Promise<GithubCommit> {
  return githubRequest<GithubCommit>(
    config,
    repoPath(config, `/git/commits/${sha}`),
  );
}

export async function getTree(
  config: GithubRequestConfig,
  sha: string,
): Promise<GithubTree> {
  return githubRequest<GithubTree>(
    config,
    repoPath(config, `/git/trees/${sha}?recursive=1`),
  );
}

export async function getBlob(
  config: GithubRequestConfig,
  sha: string,
): Promise<GithubBlob> {
  return githubRequest<GithubBlob>(
    config,
    repoPath(config, `/git/blobs/${sha}`),
  );
}

export async function readJsonBlob<T>(
  config: GithubRequestConfig,
  sha: string,
): Promise<T> {
  const blob = await getBlob(config, sha);
  return JSON.parse(base64ToUtf8(blob.content)) as T;
}

export async function createBlob(
  config: GithubRequestConfig,
  content: unknown,
  signal?: AbortSignal,
): Promise<{ sha: string }> {
  return githubRequest<{ sha: string }>(
    config,
    repoPath(config, "/git/blobs"),
    {
      method: "POST",
      body: {
        content: utf8ToBase64(JSON.stringify(content)),
        encoding: "base64",
      },
      signal,
    },
  );
}

export async function createTree(
  config: GithubRequestConfig,
  baseTree: string | undefined,
  files: { path: string; sha: string | null }[],
  signal?: AbortSignal,
): Promise<{ sha: string }> {
  return githubRequest<{ sha: string }>(
    config,
    repoPath(config, "/git/trees"),
    {
      method: "POST",
      body: {
        ...(baseTree ? { base_tree: baseTree } : {}),
        tree: files.map((file) => ({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: file.sha,
        })),
      },
      signal,
    },
  );
}

export async function createCommit(
  config: GithubRequestConfig,
  input: {
    message: string;
    tree: string;
    parents: string[];
  },
  signal?: AbortSignal,
): Promise<GithubCommit> {
  return githubRequest<GithubCommit>(
    config,
    repoPath(config, "/git/commits"),
    { method: "POST", body: input, signal },
  );
}

export async function updateRef(
  config: GithubRequestConfig,
  branch: string,
  sha: string,
  signal?: AbortSignal,
): Promise<GithubRef> {
  return githubRequest<GithubRef>(
    config,
    repoPath(config, `/git/refs/heads/${encodeURIComponent(branch)}`),
    {
      method: "PATCH",
      body: { sha, force: false },
      signal,
    },
  );
}

export async function putFile(
  config: GithubRequestConfig,
  input: {
    path: string;
    content: unknown;
    message: string;
    branch: string;
  },
): Promise<GithubContent> {
  const response = await githubRequest<{ content: GithubContent }>(
    config,
    repoPath(config, `/contents/${input.path}`),
    {
      method: "PUT",
      body: {
        message: input.message,
        content: utf8ToBase64(JSON.stringify(input.content)),
        branch: input.branch,
      },
    },
  );
  return response.content;
}

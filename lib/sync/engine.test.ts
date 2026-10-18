import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearLocalDatabase } from "@/lib/db/database";
import { createBookWithMeta } from "@/lib/db/books-repo";
import { getSyncState } from "@/lib/db/sync-state-repo";
import { upsertBills } from "@/lib/db/bills-repo";
import { createBookMeta } from "@/lib/domain/defaults";
import type { Bill, GithubConfig } from "@/lib/domain/types";
import { syncBook } from "@/lib/sync/engine";

interface FakeFile {
  blobSha: string;
}

interface FakeCommit {
  treeSha: string;
  parent?: string;
}

/**
 * A tiny in-memory implementation of the subset of the GitHub Git Data API
 * used by the sync engine. It catches mistakes in the request shapes and in
 * the pull/push ordering without needing a real token.
 */
function createFakeGithub() {
  const files = new Map<string, FakeFile>();
  const blobs = new Map<string, string>();
  const commits = new Map<string, FakeCommit>();
  const trees = new Map<string, Map<string, string>>();
  let head: string | undefined;
  let counter = 0;

  const next = (prefix: string) => `${prefix}-${++counter}`;
  const treeSnapshot = () =>
    new Map(Array.from(files.entries()).map(([path, file]) => [path, file.blobSha]));

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    });

  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const path = url.pathname;
    const method = init?.method ?? "GET";
    const body =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;

    if (method === "GET" && path === "/repos/owner/repo") {
      return json({
        id: 1,
        name: "repo",
        full_name: "owner/repo",
        default_branch: "main",
        private: true,
        permissions: { admin: true, push: true, pull: true },
      });
    }

    if (method === "GET" && path === "/repos/owner/repo/git/ref/heads/main") {
      if (!head) return json({ message: "Not Found" }, 404);
      return json({ ref: "refs/heads/main", object: { sha: head, type: "commit" } });
    }

    if (method === "GET" && path.startsWith("/repos/owner/repo/git/commits/")) {
      const sha = path.split("/").pop()!;
      const commit = commits.get(sha);
      if (!commit) return json({ message: "Not Found" }, 404);
      return json({ sha, tree: { sha: commit.treeSha } });
    }

    if (method === "GET" && path.startsWith("/repos/owner/repo/git/trees/")) {
      const sha = path.split("/").pop()!;
      const tree = trees.get(sha);
      if (!tree) return json({ message: "Not Found" }, 404);
      return json({
        sha,
        truncated: false,
        tree: Array.from(tree.entries()).map(([filePath, blobSha]) => ({
          path: filePath,
          mode: "100644",
          type: "blob",
          sha: blobSha,
        })),
      });
    }

    if (method === "GET" && path.startsWith("/repos/owner/repo/git/blobs/")) {
      const sha = path.split("/").pop()!;
      const content = blobs.get(sha);
      if (!content) return json({ message: "Not Found" }, 404);
      return json({ sha, encoding: "base64", content });
    }

    if (method === "POST" && path === "/repos/owner/repo/git/blobs") {
      const blobSha = next("blob");
      blobs.set(blobSha, body.content);
      return json({ sha: blobSha });
    }

    if (method === "PUT" && path.startsWith("/repos/owner/repo/contents/")) {
      const filePath = decodeURIComponent(path.replace("/repos/owner/repo/contents/", ""));
      const blobSha = next("blob");
      blobs.set(blobSha, body.content);
      files.set(filePath, { blobSha });
      const treeSha = next("tree");
      trees.set(treeSha, treeSnapshot());
      const commitSha = next("commit");
      commits.set(commitSha, { treeSha, parent: head });
      head = commitSha;
      return json({
        content: { name: filePath.split("/").pop(), path: filePath, sha: blobSha },
        commit: { sha: commitSha },
      });
    }

    if (method === "POST" && path === "/repos/owner/repo/git/trees") {
      const base = body.base_tree ? trees.get(body.base_tree) : undefined;
      const tree = base ? new Map(base) : new Map<string, string>();
      for (const item of body.tree as { path: string; sha: string | null }[]) {
        if (item.sha) {
          tree.set(item.path, item.sha);
          files.set(item.path, { blobSha: item.sha });
        } else {
          tree.delete(item.path);
          files.delete(item.path);
        }
      }
      const treeSha = next("tree");
      trees.set(treeSha, tree);
      return json({ sha: treeSha });
    }

    if (method === "POST" && path === "/repos/owner/repo/git/commits") {
      const commitSha = next("commit");
      commits.set(commitSha, { treeSha: body.tree, parent: body.parents?.[0] });
      return json({ sha: commitSha, tree: { sha: body.tree } });
    }

    if (method === "PATCH" && path === "/repos/owner/repo/git/refs/heads/main") {
      head = body.sha;
      return json({ ref: "refs/heads/main", object: { sha: head, type: "commit" } });
    }

    return json({ message: `Unhandled ${method} ${path}` }, 404);
  };

  return {
    fetch,
    files,
    getHead: () => head,
  };
}

function makeBill(): Bill {
  const now = new Date("2026-01-15T12:00:00").getTime();
  return {
    id: "bill-1",
    bookId: "default",
    type: "expense",
    amount: 1234,
    currency: "CNY",
    categoryId: "food",
    time: now,
    note: "测试",
    createdAt: now,
    updatedAt: now,
  };
}

const config: GithubConfig = {
  token: "test-token",
  owner: "owner",
  repo: "repo",
  branch: "main",
};

describe("syncBook", () => {
  beforeEach(async () => {
    await clearLocalDatabase();
  });

  it("bootstraps an empty repo, pushes local bills, and is idempotent", async () => {
    const fake = createFakeGithub();
    vi.stubGlobal("fetch", fake.fetch);

    const meta = createBookMeta("default", "测试账本");
    await createBookWithMeta(meta);
    await upsertBills([makeBill()]);

    const first = await syncBook("default", config);
    expect(first.status).toBe("success");
    expect(fake.getHead()).toBeTruthy();
    expect(fake.files.has("books/default/meta.json")).toBe(true);
    expect(fake.files.has("books/default/bills/2026.json")).toBe(true);

    const state = await getSyncState("default");
    expect(state?.lastSyncedAt).toBeDefined();
    expect(state?.headSha).toBe(fake.getHead());

    const headAfterFirst = fake.getHead();
    const second = await syncBook("default", config);
    expect(second.status).toBe("success");
    expect(fake.getHead()).toBe(headAfterFirst);
  });
});

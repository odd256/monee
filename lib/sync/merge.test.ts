import { describe, expect, it } from "vitest";
import { createBookMeta } from "@/lib/domain/defaults";
import type { Bill, BookMeta } from "@/lib/domain/types";
import {
  dirtyYears,
  mergeBills,
  mergeMeta,
  metaNeedsPush,
} from "@/lib/sync/merge";

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: "bill-1",
    bookId: "default",
    type: "expense",
    amount: 1000,
    currency: "CNY",
    categoryId: "food",
    time: new Date("2026-03-01T10:00:00").getTime(),
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("mergeBills", () => {
  it("keeps the newer local bill", () => {
    const local = bill({ amount: 2000, updatedAt: 2 });
    const remote = bill({ amount: 1000, updatedAt: 1 });
    const result = mergeBills([local], [remote]);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].amount).toBe(2000);
    expect(result.changed).toHaveLength(0);
  });

  it("lets a newer remote tombstone win", () => {
    const local = bill({ updatedAt: 1 });
    const remote = bill({ updatedAt: 2, deletedAt: 2 });
    const result = mergeBills([local], [remote]);
    expect(result.merged[0].deletedAt).toBe(2);
    expect(result.changed).toHaveLength(1);
  });

  it("merges records that only exist on one side", () => {
    const local = bill({ id: "local", updatedAt: 1 });
    const remote = bill({ id: "remote", updatedAt: 1 });
    const result = mergeBills([local], [remote]);
    expect(result.merged.map((item) => item.id).sort()).toEqual([
      "local",
      "remote",
    ]);
  });

  it("reports years that need pushing", () => {
    const local = bill({
      time: new Date("2025-06-01T10:00:00").getTime(),
      updatedAt: 2,
    });
    const remote = bill({
      time: new Date("2025-06-01T10:00:00").getTime(),
      updatedAt: 1,
    });
    expect(dirtyYears([local], [remote])).toEqual([2025]);
  });
});

describe("mergeMeta", () => {
  it("merges categories by id using updatedAt", () => {
    const local = createBookMeta("default", "本地", "CNY");
    const remote: BookMeta = {
      ...local,
      name: "远端",
      updatedAt: local.updatedAt + 10,
      categories: local.categories.map((category) =>
        category.id === "food"
          ? { ...category, name: "吃饭", updatedAt: local.updatedAt + 10 }
          : category,
      ),
    };
    local.categories = local.categories.map((category) =>
      category.id === "food"
        ? { ...category, name: "本地餐饮", updatedAt: local.updatedAt + 20 }
        : category,
    );
    const merged = mergeMeta(local, remote);
    expect(merged.name).toBe("远端");
    expect(merged.categories.find((item) => item.id === "food")?.name).toBe(
      "本地餐饮",
    );
  });

  it("detects local categories that are ahead of remote", () => {
    const local = createBookMeta("default", "账本", "CNY");
    const remote = createBookMeta("default", "账本", "CNY");
    remote.categories = remote.categories.map((category) => ({
      ...category,
      updatedAt: 1,
    }));
    local.categories = local.categories.map((category) => ({
      ...category,
      updatedAt: 2,
    }));
    expect(metaNeedsPush(local, remote)).toBe(true);
  });
});

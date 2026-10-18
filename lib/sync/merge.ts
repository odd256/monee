import type { Bill, BookMeta } from "@/lib/domain/types";

interface Timestamped {
  id: string;
  updatedAt: number;
}

function chooseNewer<T extends Timestamped>(local: T, remote: T): T {
  // Remote wins ties so two devices converge deterministically.
  return remote.updatedAt >= local.updatedAt ? remote : local;
}

function mergeCollection<T extends Timestamped>(
  local: T[],
  remote: T[],
): T[] {
  const merged = new Map<string, T>(local.map((item) => [item.id, item]));
  for (const item of remote) {
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? chooseNewer(existing, item) : item);
  }
  return Array.from(merged.values());
}

export interface MergeBillsResult {
  merged: Bill[];
  changed: Bill[];
}

export function mergeBills(local: Bill[], remote: Bill[]): MergeBillsResult {
  const localMap = new Map(local.map((bill) => [bill.id, bill]));
  const merged = new Map<string, Bill>(localMap);
  const changed: Bill[] = [];

  for (const bill of remote) {
    const existing = localMap.get(bill.id);
    if (!existing) {
      merged.set(bill.id, bill);
      changed.push(bill);
      continue;
    }
    const winner = chooseNewer(existing, bill);
    merged.set(bill.id, winner);
    if (winner !== existing) changed.push(winner);
  }

  return {
    merged: Array.from(merged.values()).sort((a, b) => b.time - a.time),
    changed,
  };
}

export function mergeMeta(local: BookMeta, remote: BookMeta): BookMeta {
  const base = remote.updatedAt > local.updatedAt ? remote : local;
  return {
    ...base,
    id: local.id,
    schemaVersion: Math.max(local.schemaVersion, remote.schemaVersion),
    categories: mergeCollection(local.categories, remote.categories),
    tags: mergeCollection(local.tags, remote.tags),
    accounts: mergeCollection(local.accounts, remote.accounts),
    budgets: mergeCollection(local.budgets, remote.budgets),
    createdAt: Math.min(local.createdAt, remote.createdAt),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

/** True when the merged local meta has something newer than the remote copy. */
export function metaNeedsPush(merged: BookMeta, remote: BookMeta): boolean {
  if (
    merged.name !== remote.name ||
    merged.baseCurrency !== remote.baseCurrency ||
    merged.settings.showCents !== remote.settings.showCents
  ) {
    return true;
  }
  return (
    isCollectionAhead(merged.categories, remote.categories) ||
    isCollectionAhead(merged.tags, remote.tags) ||
    isCollectionAhead(merged.accounts, remote.accounts) ||
    isCollectionAhead(merged.budgets, remote.budgets)
  );
}

function isCollectionAhead<T extends Timestamped>(
  merged: T[],
  remote: T[],
): boolean {
  const remoteMap = new Map(remote.map((item) => [item.id, item]));
  return merged.some((item) => {
    const remoteItem = remoteMap.get(item.id);
    return !remoteItem || item.updatedAt > remoteItem.updatedAt;
  });
}

/** Years that contain at least one bill newer than the remote copy. */
export function dirtyYears(merged: Bill[], remote: Bill[]): number[] {
  const remoteMap = new Map(remote.map((bill) => [bill.id, bill]));
  const years = new Set<number>();
  for (const bill of merged) {
    const remoteBill = remoteMap.get(bill.id);
    if (!remoteBill || bill.updatedAt > remoteBill.updatedAt) {
      years.add(new Date(bill.time).getFullYear());
    }
  }
  return Array.from(years).sort((a, b) => a - b);
}

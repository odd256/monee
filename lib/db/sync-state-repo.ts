import { getDB } from "./database";
import type { SyncStateRecord } from "./schema";

export async function getSyncState(
  bookId: string,
): Promise<SyncStateRecord | undefined> {
  return getDB().syncStates.get(bookId);
}

export async function saveSyncState(
  state: SyncStateRecord,
): Promise<void> {
  await getDB().syncStates.put(state);
}

export async function patchSyncState(
  bookId: string,
  patch: Partial<SyncStateRecord>,
): Promise<SyncStateRecord> {
  const current = (await getSyncState(bookId)) ?? { bookId };
  const next = { ...current, ...patch, bookId };
  await saveSyncState(next);
  return next;
}

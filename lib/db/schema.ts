import Dexie, { type Table } from "dexie";
import type { Bill, BookMeta, BookRecord } from "@/lib/domain/types";

export interface MetaRecord {
  bookId: string;
  meta: BookMeta;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface SyncStateRecord {
  bookId: string;
  headSha?: string;
  treeSha?: string;
  lastSyncedAt?: number;
  lastError?: string;
}

export interface RemoteFileRecord {
  bookId: string;
  path: string;
  sha: string;
  content: unknown;
}

export class MoneeDB extends Dexie {
  books!: Table<BookRecord, string>;
  metas!: Table<MetaRecord, string>;
  bills!: Table<Bill, string>;
  syncStates!: Table<SyncStateRecord, string>;
  remoteFiles!: Table<RemoteFileRecord, [string, string]>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super("monee");
    this.version(1).stores({
      books: "id, updatedAt",
      metas: "bookId",
      bills: "id, bookId, [bookId+time], time, categoryId, updatedAt",
      syncStates: "bookId",
      remoteFiles: "[bookId+path], bookId, path",
      settings: "key",
    });
  }
}

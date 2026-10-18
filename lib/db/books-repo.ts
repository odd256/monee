import { createBookRecord } from "@/lib/domain/defaults";
import type { BookMeta, BookRecord } from "@/lib/domain/types";
import { getDB } from "./database";
import type { MetaRecord } from "./schema";

export async function listBooks(): Promise<BookRecord[]> {
  const books = await getDB().books.toArray();
  return books.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  return getDB().books.get(id);
}

export async function upsertBook(book: BookRecord): Promise<void> {
  await getDB().books.put(book);
}

export async function createBookWithMeta(meta: BookMeta): Promise<BookRecord> {
  const db = getDB();
  const record = createBookRecord(meta);
  await db.transaction("rw", db.books, db.metas, async () => {
    await db.books.put(record);
    const metaRecord: MetaRecord = { bookId: meta.id, meta };
    await db.metas.put(metaRecord);
  });
  return record;
}

export async function deleteBook(id: string): Promise<void> {
  const db = getDB();
  await db.transaction(
    "rw",
    db.books,
    db.metas,
    db.bills,
    db.syncStates,
    db.remoteFiles,
    async () => {
      await db.books.delete(id);
      await db.metas.delete(id);
      await db.bills.where("bookId").equals(id).delete();
      await db.syncStates.delete(id);
      await db.remoteFiles.where("bookId").equals(id).delete();
    },
  );
}

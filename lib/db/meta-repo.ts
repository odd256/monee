import type { BookMeta } from "@/lib/domain/types";
import { getDB } from "./database";
import type { MetaRecord } from "./schema";

export async function getMeta(bookId: string): Promise<BookMeta | undefined> {
  const record = await getDB().metas.get(bookId);
  return record?.meta;
}

export async function saveMeta(meta: BookMeta): Promise<void> {
  const record: MetaRecord = { bookId: meta.id, meta };
  await getDB().metas.put(record);
  const book = await getDB().books.get(meta.id);
  if (book) {
    await getDB().books.put({
      ...book,
      name: meta.name,
      updatedAt: meta.updatedAt,
    });
  }
}

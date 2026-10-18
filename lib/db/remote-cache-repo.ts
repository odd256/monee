import { getDB } from "./database";
import type { RemoteFileRecord } from "./schema";

export async function getRemoteFile(
  bookId: string,
  path: string,
): Promise<RemoteFileRecord | undefined> {
  return getDB().remoteFiles.get([bookId, path]);
}

export async function listRemoteFiles(
  bookId: string,
): Promise<RemoteFileRecord[]> {
  return getDB().remoteFiles.where("bookId").equals(bookId).toArray();
}

export async function putRemoteFiles(
  bookId: string,
  files: { path: string; sha: string; content: unknown }[],
): Promise<void> {
  if (files.length === 0) return;
  await getDB().remoteFiles.bulkPut(
    files.map((file) => ({ ...file, bookId })),
  );
}

export async function deleteRemoteFile(
  bookId: string,
  path: string,
): Promise<void> {
  await getDB().remoteFiles.delete([bookId, path]);
}

export async function clearRemoteFiles(bookId: string): Promise<void> {
  await getDB().remoteFiles.where("bookId").equals(bookId).delete();
}

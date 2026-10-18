import { getDB } from "./database";

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await getDB().settings.get(key);
  return row?.value as T | undefined;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await getDB().settings.put({ key, value });
}

export async function removeSetting(key: string): Promise<void> {
  await getDB().settings.delete(key);
}

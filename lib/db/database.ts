import { MoneeDB } from "./schema";

let database: MoneeDB | undefined;

export function getDB(): MoneeDB {
  if (!database) {
    database = new MoneeDB();
  }
  return database;
}

export async function clearLocalDatabase(): Promise<void> {
  if (database) {
    database.close();
    await database.delete();
    database = undefined;
  } else {
    const db = new MoneeDB();
    await db.delete();
    db.close();
  }
}

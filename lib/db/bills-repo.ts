import type { Bill } from "@/lib/domain/types";
import { getDB } from "./database";

export async function listBills(
  bookId: string,
  start?: number,
  end?: number,
): Promise<Bill[]> {
  const db = getDB();
  const collection =
    start !== undefined && end !== undefined
      ? db.bills
          .where("[bookId+time]")
          .between([bookId, start], [bookId, end], true, false)
      : db.bills.where("bookId").equals(bookId);
  const bills = await collection.toArray();
  return bills
    .filter((bill) => !bill.deletedAt)
    .sort((a, b) => b.time - a.time);
}

export async function listAllBills(bookId: string): Promise<Bill[]> {
  const bills = await getDB().bills.where("bookId").equals(bookId).toArray();
  return bills.sort((a, b) => b.time - a.time);
}

export async function listBillsUpdatedSince(
  bookId: string,
  since: number,
): Promise<Bill[]> {
  const bills = await getDB().bills.where("bookId").equals(bookId).toArray();
  return bills.filter((bill) => bill.updatedAt > since);
}

export async function getBill(id: string): Promise<Bill | undefined> {
  return getDB().bills.get(id);
}

export async function upsertBills(bills: Bill[]): Promise<void> {
  if (bills.length === 0) return;
  await getDB().bills.bulkPut(bills);
}

export async function softDeleteBill(id: string, at = Date.now()): Promise<void> {
  const bill = await getDB().bills.get(id);
  if (!bill) return;
  await getDB().bills.put({ ...bill, deletedAt: at, updatedAt: at });
}

export async function countBills(bookId: string): Promise<number> {
  return getDB().bills.where("bookId").equals(bookId).count();
}

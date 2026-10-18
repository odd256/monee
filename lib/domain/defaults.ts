import { createDefaultCategories } from "./categories";
import {
  SCHEMA_VERSION,
  type BookMeta,
  type BookRecord,
} from "./types";

export const DEFAULT_CURRENCY = "CNY";
export const DEFAULT_LOCALE = "zh-CN";

export function createBookMeta(
  id: string,
  name: string,
  baseCurrency = DEFAULT_CURRENCY,
): BookMeta {
  const createdAt = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name,
    baseCurrency,
    categories: createDefaultCategories(),
    tags: [],
    accounts: [],
    budgets: [],
    settings: {
      showCents: true,
      updatedAt: createdAt,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export function createBookRecord(meta: BookMeta): BookRecord {
  return {
    id: meta.id,
    name: meta.name,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
}

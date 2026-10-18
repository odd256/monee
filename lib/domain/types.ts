export const SCHEMA_VERSION = 1;

export type BillType = "expense" | "income";

/** A bill. Amounts are always stored as integer minor units (e.g. CNY cents). */
export interface Bill {
  id: string;
  bookId: string;
  type: BillType;
  amount: number;
  currency: string;
  categoryId: string;
  /** When the money was spent/received, in ms. */
  time: number;
  note?: string;
  tagIds?: string[];
  accountId?: string;
  createdAt: number;
  updatedAt: number;
  /** Tombstone used for cross-device merging. */
  deletedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  type: BillType;
  /** lucide-react icon key, see components/ui/category-icon.tsx */
  icon: string;
  color: string;
  parentId?: string;
  order: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  updatedAt: number;
  deletedAt?: number;
}

export type AccountType = "cash" | "bank" | "credit" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: string;
  updatedAt: number;
  deletedAt?: number;
}

export type BudgetPeriod = "month" | "year";

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  /** Empty or omitted means "all expense categories". */
  categoryIds?: string[];
  updatedAt: number;
  deletedAt?: number;
}

export interface BookSettings {
  /** Reserved for future features such as a custom month start day. */
  showCents: boolean;
  updatedAt: number;
}

export interface BookMeta {
  schemaVersion: number;
  id: string;
  name: string;
  baseCurrency: string;
  categories: Category[];
  tags: Tag[];
  accounts: Account[];
  budgets: Budget[];
  settings: BookSettings;
  createdAt: number;
  updatedAt: number;
}

export interface BookRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface ExportedBook {
  meta: BookMeta;
  bills: Bill[];
}

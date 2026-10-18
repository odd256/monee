import { z } from "zod";

const idSchema = z.string().min(1);
const timestampSchema = z.number().int().nonnegative();

export const billSchema = z.object({
  id: idSchema,
  bookId: idSchema,
  type: z.enum(["expense", "income"]),
  amount: z.number().int(),
  currency: z.string().min(1),
  categoryId: idSchema,
  time: timestampSchema,
  note: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  accountId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  type: z.enum(["expense", "income"]),
  icon: z.string().default("ellipsis"),
  color: z.string().default("#64748b"),
  parentId: z.string().optional(),
  order: z.number().default(0),
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

export const tagSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  color: z.string().optional(),
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

export const accountSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  type: z.enum(["cash", "bank", "credit", "other"]),
  initialBalance: z.number().int(),
  currency: z.string().min(1),
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

export const budgetSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
  period: z.enum(["month", "year"]),
  categoryIds: z.array(z.string()).optional(),
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

export const bookSettingsSchema = z.object({
  showCents: z.boolean(),
  updatedAt: timestampSchema,
});

export const bookMetaSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: idSchema,
  name: z.string().min(1),
  baseCurrency: z.string().min(1),
  categories: z.array(categorySchema),
  tags: z.array(tagSchema),
  accounts: z.array(accountSchema),
  budgets: z.array(budgetSchema),
  settings: bookSettingsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const exportedBookSchema = z.object({
  meta: bookMetaSchema,
  bills: z.array(billSchema),
});

export type ParsedBookMeta = z.infer<typeof bookMetaSchema>;
export type ParsedBill = z.infer<typeof billSchema>;

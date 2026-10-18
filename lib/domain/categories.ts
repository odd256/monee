import type { Bill, BillType, Category } from "./types";

type CategorySeed = Omit<Category, "updatedAt"> & { children?: CategorySeed[] };

const now = Date.now();

export const DEFAULT_EXPENSE_CATEGORIES: CategorySeed[] = [
  {
    id: "food",
    name: "餐饮",
    type: "expense",
    icon: "utensils",
    color: "#f97316",
    order: 10,
    children: [
      { id: "breakfast", name: "早餐", type: "expense", icon: "coffee", color: "#fb923c", parentId: "food", order: 11 },
      { id: "lunch", name: "午餐", type: "expense", icon: "utensils", color: "#fb923c", parentId: "food", order: 12 },
      { id: "dinner", name: "晚餐", type: "expense", icon: "utensils", color: "#fb923c", parentId: "food", order: 13 },
      { id: "snack", name: "零食", type: "expense", icon: "cookie", color: "#fb923c", parentId: "food", order: 14 },
      { id: "delivery", name: "外卖", type: "expense", icon: "bike", color: "#fb923c", parentId: "food", order: 15 },
    ],
  },
  {
    id: "transport",
    name: "交通",
    type: "expense",
    icon: "car",
    color: "#3b82f6",
    order: 20,
    children: [
      { id: "metro", name: "公交地铁", type: "expense", icon: "bus", color: "#60a5fa", parentId: "transport", order: 21 },
      { id: "taxi", name: "打车", type: "expense", icon: "car", color: "#60a5fa", parentId: "transport", order: 22 },
      { id: "fuel", name: "加油", type: "expense", icon: "fuel", color: "#60a5fa", parentId: "transport", order: 23 },
      { id: "parking", name: "停车", type: "expense", icon: "parking-circle", color: "#60a5fa", parentId: "transport", order: 24 },
    ],
  },
  {
    id: "shopping",
    name: "购物",
    type: "expense",
    icon: "shopping-bag",
    color: "#ec4899",
    order: 30,
    children: [
      { id: "daily", name: "日用品", type: "expense", icon: "shopping-basket", color: "#f472b6", parentId: "shopping", order: 31 },
      { id: "clothing", name: "服饰", type: "expense", icon: "shirt", color: "#f472b6", parentId: "shopping", order: 32 },
      { id: "digital", name: "数码", type: "expense", icon: "smartphone", color: "#f472b6", parentId: "shopping", order: 33 },
    ],
  },
  {
    id: "housing",
    name: "居住",
    type: "expense",
    icon: "house",
    color: "#8b5cf6",
    order: 40,
    children: [
      { id: "rent", name: "房租", type: "expense", icon: "house", color: "#a78bfa", parentId: "housing", order: 41 },
      { id: "utilities", name: "水电", type: "expense", icon: "zap", color: "#a78bfa", parentId: "housing", order: 42 },
      { id: "property", name: "物业", type: "expense", icon: "building-2", color: "#a78bfa", parentId: "housing", order: 43 },
    ],
  },
  {
    id: "entertainment",
    name: "娱乐",
    type: "expense",
    icon: "gamepad-2",
    color: "#06b6d4",
    order: 50,
    children: [
      { id: "movie", name: "电影", type: "expense", icon: "film", color: "#22d3ee", parentId: "entertainment", order: 51 },
      { id: "travel", name: "旅行", type: "expense", icon: "plane", color: "#22d3ee", parentId: "entertainment", order: 52 },
      { id: "fitness", name: "运动", type: "expense", icon: "dumbbell", color: "#22d3ee", parentId: "entertainment", order: 53 },
    ],
  },
  {
    id: "medical",
    name: "医疗",
    type: "expense",
    icon: "heart-pulse",
    color: "#ef4444",
    order: 60,
    children: [
      { id: "clinic", name: "门诊", type: "expense", icon: "stethoscope", color: "#f87171", parentId: "medical", order: 61 },
      { id: "pharmacy", name: "药品", type: "expense", icon: "pill", color: "#f87171", parentId: "medical", order: 62 },
    ],
  },
  {
    id: "education",
    name: "教育",
    type: "expense",
    icon: "graduation-cap",
    color: "#14b8a6",
    order: 70,
    children: [
      { id: "course", name: "课程", type: "expense", icon: "book-open", color: "#2dd4bf", parentId: "education", order: 71 },
      { id: "books", name: "书籍", type: "expense", icon: "library", color: "#2dd4bf", parentId: "education", order: 72 },
    ],
  },
  {
    id: "social",
    name: "人情",
    type: "expense",
    icon: "gift",
    color: "#f59e0b",
    order: 80,
    children: [
      { id: "gift", name: "礼物", type: "expense", icon: "gift", color: "#fbbf24", parentId: "social", order: 81 },
      { id: "redpacket", name: "红包", type: "expense", icon: "hand-coins", color: "#fbbf24", parentId: "social", order: 82 },
    ],
  },
  {
    id: "other-expense",
    name: "其他",
    type: "expense",
    icon: "ellipsis",
    color: "#64748b",
    order: 90,
  },
];

export const DEFAULT_INCOME_CATEGORIES: CategorySeed[] = [
  { id: "salary", name: "工资", type: "income", icon: "briefcase", color: "#10b981", order: 10 },
  { id: "part-time", name: "兼职", type: "income", icon: "clock", color: "#22c55e", order: 20 },
  { id: "investment", name: "理财", type: "income", icon: "trending-up", color: "#84cc16", order: 30 },
  { id: "redpacket-income", name: "红包", type: "income", icon: "gift", color: "#eab308", order: 40 },
  { id: "other-income", name: "其他", type: "income", icon: "wallet", color: "#64748b", order: 50 },
];

function flatten(seeds: CategorySeed[]): Category[] {
  return seeds.flatMap((seed) => {
    const { children, ...category } = seed;
    return [
      { ...category, updatedAt: now },
      ...(children ? flatten(children) : []),
    ];
  });
}

export function createDefaultCategories(): Category[] {
  return [
    ...flatten(DEFAULT_EXPENSE_CATEGORIES),
    ...flatten(DEFAULT_INCOME_CATEGORIES),
  ];
}

export function categoryById(
  categories: Category[],
  id: string | undefined,
): Category | undefined {
  if (!id) return undefined;
  return categories.find((category) => category.id === id);
}

export function rootCategory(
  categories: Category[],
  category: Category,
): Category {
  let current = category;
  const seen = new Set<string>();
  while (current.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = categoryById(categories, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

export function categoriesForType(
  categories: Category[],
  type: BillType,
): Category[] {
  return categories
    .filter((category) => category.type === type && !category.deletedAt)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function topLevelCategories(
  categories: Category[],
  type: BillType,
): Category[] {
  return categoriesForType(categories, type).filter(
    (category) => !category.parentId,
  );
}

export function childrenOf(
  categories: Category[],
  parentId: string,
): Category[] {
  return categories
    .filter((category) => category.parentId === parentId && !category.deletedAt)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function isBillInCategoryTree(
  categories: Category[],
  categoryId: string,
  parentIds: string[],
): boolean {
  if (parentIds.length === 0) return true;
  const category = categoryById(categories, categoryId);
  if (!category) return false;
  let current: Category | undefined = category;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    if (parentIds.includes(current.id)) return true;
    seen.add(current.id);
    current = categoryById(categories, current.parentId);
  }
  return false;
}

export function defaultCategoryForType(
  categories: Category[],
  type: BillType,
): Category | undefined {
  return topLevelCategories(categories, type)[0];
}

/** A compact view used by charts and lists. */
export interface CategoryTotal {
  category: Category | undefined;
  amount: number;
}

export function categoryLabel(
  categories: Category[],
  bill: Pick<Bill, "categoryId">,
): string {
  return categoryById(categories, bill.categoryId)?.name ?? "未分类";
}

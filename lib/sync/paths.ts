export function bookBasePath(bookId: string): string {
  return `books/${bookId}`;
}

export function metaPath(bookId: string): string {
  return `${bookBasePath(bookId)}/meta.json`;
}

export function billsPath(bookId: string, year: number): string {
  return `${bookBasePath(bookId)}/bills/${year}.json`;
}

export function parseBookFilePath(
  bookId: string,
  path: string,
): { kind: "meta" } | { kind: "bills"; year: number } | undefined {
  const base = `${bookBasePath(bookId)}/`;
  if (path === `${base}meta.json`) return { kind: "meta" };
  const match = path.match(new RegExp(`^${escapeRegExp(base)}bills/(\\d{4})\\.json$`));
  if (!match) return undefined;
  return { kind: "bills", year: Number(match[1]) };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

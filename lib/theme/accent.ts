export const ACCENT_STORAGE_KEY = "monee.accent";

export const ACCENT_OPTIONS = [
  { id: "jade", label: "玉青" },
  { id: "ocean", label: "海蓝" },
  { id: "violet", label: "紫罗兰" },
  { id: "rose", label: "玫瑰" },
  { id: "amber", label: "琥珀" },
  { id: "graphite", label: "石墨" },
] as const;

export type AccentId = (typeof ACCENT_OPTIONS)[number]["id"];

export const DEFAULT_ACCENT: AccentId = "jade";

const ACCENT_IDS: readonly string[] = ACCENT_OPTIONS.map((option) => option.id);

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && ACCENT_IDS.includes(value);
}

/** Read the saved accent. Safe to call during SSR. */
export function readAccent(): AccentId {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    return isAccentId(stored) ? stored : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

/** Apply an accent immediately and remember it for the next visit. */
export function applyAccent(id: AccentId): void {
  if (typeof window === "undefined") return;
  document.documentElement.dataset.accent = id;
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
  } catch {
    // Private browsing or a full quota should not break the UI.
  }
}

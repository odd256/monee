export const APP_NAME = "Monee";

export const GITHUB_API_BASE = "https://api.github.com";

export const SYNC_DEBOUNCE_MS = 2_500;
export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
export const SYNC_MAX_RETRIES = 3;

export const SETTING_KEYS = {
  onboarded: "monee.onboarded",
  lastBookId: "monee.lastBookId",
  github: "monee.github",
  deviceId: "monee.deviceId",
} as const;

export const DEFAULT_BOOK_ID = "default";
export const DEFAULT_BRANCH = "main";

export const APP_VERSION = "0.1.0";

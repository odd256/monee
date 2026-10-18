import { SYNC_DEBOUNCE_MS } from "@/lib/config";

type Runner = () => Promise<void>;

let runner: Runner | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | undefined;

export function setSyncRunner(next: Runner | undefined): void {
  runner = next;
}

/** Debounce a sync after a local write. */
export function scheduleSync(delay = SYNC_DEBOUNCE_MS): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    void runSyncNow();
  }, delay);
}

/** Run a sync immediately, deduplicating concurrent calls. */
export function runSyncNow(): Promise<void> {
  if (running) return running;
  if (!runner) return Promise.resolve();
  running = runner().finally(() => {
    running = undefined;
  });
  return running;
}

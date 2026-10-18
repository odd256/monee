import { SYNC_INTERVAL_MS } from "@/lib/config";
import { isOnline } from "@/lib/utils/platform";

/**
 * Sync when the app becomes visible, when the network returns, and on a slow
 * interval. Background sync is not available on iOS, so foreground triggers
 * are the important ones.
 */
export function setupSyncTriggers(run: () => void): () => void {
  const onOnline = () => run();
  const onVisibility = () => {
    if (document.visibilityState === "visible") run();
  };
  const interval = window.setInterval(() => {
    if (isOnline()) run();
  }, SYNC_INTERVAL_MS);

  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisibility);
    window.clearInterval(interval);
  };
}

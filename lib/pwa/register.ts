/**
 * Registers the generated service worker. In development we unregister any
 * existing worker so stale caches never hide Next.js HMR updates.
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    return false;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const registration = await navigator.serviceWorker.register(
    `${basePath}/sw.js`,
    {
      scope: `${basePath}/`,
      updateViaCache: "none",
    },
  );

  if (registration.waiting) return true;

  return new Promise<boolean>((resolve) => {
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return resolve(false);
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          resolve(true);
        }
      });
    });
    // No update after 1.5s; the current worker is fine.
    window.setTimeout(() => resolve(false), 1500);
  });
}

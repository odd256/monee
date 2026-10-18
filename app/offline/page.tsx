import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl bg-surface text-muted">
        <WifiOff className="size-6" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">现在没有网络</h1>
        <p className="mt-1 max-w-xs text-sm text-muted">
          Monee 的账单都在本地。你仍然可以查看和记录，联网后会自动同步。
        </p>
      </div>
      <Link
        href="/"
        prefetch={false}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        回到账本
      </Link>
    </main>
  );
}

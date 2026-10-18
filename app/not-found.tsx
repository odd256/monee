import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl bg-surface text-muted">
        <FileQuestion className="size-6" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">页面不存在</h1>
        <p className="mt-1 text-sm text-muted">
          这个地址没有对应的页面，可能已经移动了。
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

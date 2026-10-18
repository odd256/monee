"use client";

import type { ReactNode } from "react";
import { AddBillButton } from "@/components/shell/add-bill-button";
import { DesktopSidebar, MobileTabbar } from "@/components/shell/nav";
import { TopBar } from "@/components/shell/top-bar";
import { BillEditor } from "@/components/bill/bill-editor";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <DesktopSidebar />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-4 pb-28 pt-2 md:px-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
      <MobileTabbar />
      <AddBillButton />
      <InstallPrompt />
      <BillEditor />
    </div>
  );
}

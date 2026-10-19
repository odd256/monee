import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Bootstrap } from "@/components/app/bootstrap";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import {
  ACCENT_OPTIONS,
  ACCENT_STORAGE_KEY,
} from "@/lib/theme/accent";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Restore the saved theme color before first paint so the app never flashes
// the default jade palette when another accent is selected.
const accentInitScript = `(function(){try{var key=${JSON.stringify(ACCENT_STORAGE_KEY)};var allowed=${JSON.stringify(
  ACCENT_OPTIONS.map((option) => option.id),
)};var value=localStorage.getItem(key);if(value&&allowed.indexOf(value)!==-1){document.documentElement.setAttribute("data-accent",value)}}catch(error){}})();`;

export const metadata: Metadata = {
  title: {
    default: "Monee · 个人记账",
    template: "%s · Monee",
  },
  description: "本地优先、用 GitHub 存储数据的个人记账 PWA。",
  applicationName: "Monee",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Monee",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <script
          id="accent-init"
          dangerouslySetInnerHTML={{ __html: accentInitScript }}
        />
        <Providers>
          <RegisterServiceWorker />
          <Bootstrap>{children}</Bootstrap>
        </Providers>
      </body>
    </html>
  );
}

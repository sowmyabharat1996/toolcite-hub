import "./globals.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: "ToolCite Hub — Free Smart Web Tools",
  description:
    "ToolCite Hub is a growing collection of smart, free web tools built for speed and simplicity — from weather forecasts to productivity utilities, all in one place.",
  metadataBase: new URL("https://toolcite.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>

      <body
        className="
          min-h-dvh flex flex-col
          bg-gradient-to-b from-blue-50 via-blue-100 to-white
          dark:bg-gradient-to-b dark:from-[#000000] dark:via-[#0a0a0a] dark:to-[#121212]
          text-gray-800 dark:text-neutral-100
          transition-colors duration-500
        "
      >
        <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              ToolCite <span className="font-normal text-gray-500">Hub</span>
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Smart • Fast • Reliable
              </p>
              <ThemeToggle />
            </div>
          </header>

          {children}
        </main>

        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12 py-6 border-t border-gray-200 dark:border-gray-800">
          © {new Date().getFullYear()} ToolCite. Built by Bharat 💡 ·{" "}
          <a href="/privacy" className="text-blue-600 hover:underline mx-1">
            Privacy Policy
          </a>
          ·{" "}
          <a href="/terms" className="text-blue-600 hover:underline mx-1">
            Terms of Use
          </a>
        </footer>
      </body>
    </html>
  );
}

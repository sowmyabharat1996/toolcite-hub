import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ToolCite Hub — Smart Free Web Tools",
  description:
    "ToolCite Hub is a growing collection of free, fast, and reliable smart web tools — no sign-ups, no clutter.",
  metadataBase: new URL("https://toolcite.com"),
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>

      {/* Light: soft blue gradient; Dark: soft charcoal gradient */}
      <body className="min-h-screen flex flex-col
                       bg-gradient-to-br from-sky-50 via-white to-blue-50
                       dark:from-[#0e0e0e] dark:via-[#101010] dark:to-[#171717]
                       text-gray-800 dark:text-gray-100
                       transition-colors duration-500">
        <main className="flex-grow">{children}</main>

        <footer className="text-center text-sm text-gray-600 dark:text-gray-400 py-8
                           border-t border-gray-200 dark:border-gray-800">
          © {new Date().getFullYear()} ToolCite Hub •{" "}
          <a href="/terms" className="text-blue-700 dark:text-blue-400 hover:underline">Terms</a>{" "}
          •{" "}
          <a href="/privacy" className="text-blue-700 dark:text-blue-400 hover:underline">Privacy</a>
        </footer>
      </body>
    </html>
  );
}

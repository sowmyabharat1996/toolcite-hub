import "./globals.css";
import Script from "next/script";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ToolCite Hub — Smart Free Web Tools",
  description:
    "ToolCite Hub is a growing collection of free, fast, and reliable smart web tools — no sign-ups, no clutter.",
  metadataBase: new URL("https://toolcite.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <body className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 dark:from-[#0d0d0d] dark:via-[#141414] dark:to-[#1b1b1b] text-gray-800 dark:text-gray-100 transition-colors duration-500">
        <main className="flex-grow">{children}</main>

        <footer className="text-center text-sm text-gray-600 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-800">
          © {new Date().getFullYear()} ToolCite Hub •{" "}
          <a
            href="/terms"
            className="text-blue-700 dark:text-blue-400 hover:underline"
          >
            Terms
          </a>{" "}
          •{" "}
          <a
            href="/privacy"
            className="text-blue-700 dark:text-blue-400 hover:underline"
          >
            Privacy
          </a>
        </footer>
      </body>
    </html>
  );
}

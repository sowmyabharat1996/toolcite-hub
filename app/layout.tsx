import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ToolCite Hub — Smart Free Web Tools",
  description:
    "ToolCite Hub is a fast, free collection of smart web tools — no sign-ups, no clutter. Reliable utilities for everyday use.",
  metadataBase: new URL("https://toolcite.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>

      {/* Solid dark foundation (subtle vignette) */}
      <body className="min-h-screen bg-[#0b0b0b] text-gray-100">
        {/* Top-right mini tagline like the screenshot */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-end pt-5 px-6">
            <span className="text-sm text-gray-400">Smart • Fast • Reliable</span>
          </div>
        </div>

        <main>{children}</main>

        <footer className="text-center text-sm text-gray-500 py-10">
          © {new Date().getFullYear()} ToolCite Hub
        </footer>
      </body>
    </html>
  );
}

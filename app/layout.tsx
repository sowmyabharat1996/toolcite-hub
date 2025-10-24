import "./globals.css";
import Script from "next/script";
import { Metadata } from "next";

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
    <html lang="en">
      <head>
        {/* Google AdSense Verification Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white text-gray-800">
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 py-6 border-t">
          © {new Date().getFullYear()} ToolCite. Built by Bharat 💡 ·{" "}
          <a
            href="/privacy"
            className="text-blue-600 hover:underline mx-1"
          >
            Privacy Policy
          </a>
          ·{" "}
          <a
            href="/terms"
            className="text-blue-600 hover:underline mx-1"
          >
            Terms of Use
          </a>
        </footer>
      </body>
    </html>
  );
}

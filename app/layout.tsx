import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ToolCite – Free Online Tools Hub",
  description:
    "ToolCite brings together simple, fast, and useful tools like Weather, Speed Test, BMI, and more — all in one clean interface.",
  keywords: [
    "online tools",
    "toolcite",
    "free utilities",
    "internet speed test",
    "weather app",
    "bmi calculator",
  ],
  authors: [{ name: "ToolCite" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google AdSense Verification Code */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
          crossOrigin="anonymous"
        ></script>

        {/* ✅ Meta tags for SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#2B47FF" />
        <meta property="og:title" content="ToolCite – Smart Tools Hub" />
        <meta
          property="og:description"
          content="A hub of online tools including weather, speed test, and more."
        />
        <meta property="og:url" content="https://toolcite.com" />
        <meta property="og:type" content="website" />
      </head>

      <body className={inter.className}>
        {/* 🧠 All your pages and components render here */}
        {children}
      </body>
    </html>
  );
}

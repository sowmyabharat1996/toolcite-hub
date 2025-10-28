// app/layout.tsx
import "./globals.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Site-wide defaults; tool pages can override via generateMetadata.
export const metadata: Metadata = {
  metadataBase: new URL("https://toolcite.com"),
  title: {
    default: "ToolCite – Free AI, Document & Dev Tools",
    template: "%s | ToolCite",
  },
  description:
    "ToolCite is a growing collection of fast, free tools for AI productivity, documents, and developer/SEO workflows.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ToolCite",
    url: "https://toolcite.com",
    title: "ToolCite – Free AI, Document & Dev Tools",
    description:
      "Fast, free web tools built for speed and simplicity — from weather to AI & SEO utilities.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "ToolCite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@yourhandle",
    images: ["/og-default.png"], // Dimensions are taken from OG
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/app-192.png",
  },
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* GA/Clarity optional (kept commented) */}
        {/*
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXX" strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXX', { anonymize_ip: true });
        `}</Script>

        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "YOUR_ID");
        `}</Script>
        */}
      </head>

      <body
        className={`${inter.className} min-h-dvh flex flex-col
          bg-gradient-to-b from-blue-50 via-blue-100 to-white
          dark:bg-gradient-to-b dark:from-[#000000] dark:via-[#0a0a0a] dark:to-[#121212]
          text-gray-800 dark:text-neutral-100 transition-colors duration-500`}
      >
        <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              ToolCite <span className="font-normal text-gray-500">Hub</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Smart • Fast • Reliable
            </p>
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

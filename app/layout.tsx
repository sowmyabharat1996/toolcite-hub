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
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "ToolCite" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ToolCite",
    creator: "@ToolCite",
    images: ["/og-default.png"],
  },
  icons: { icon: "/favicon.ico", apple: "/app-192.png" },
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <head>
        {/* NOTE: AdSense removed to improve Lighthouse/CLS.
            If you want it back later, mount it via a tiny client component
            that skips loading when ?noads=1 is present. */}

        {/* Organization JSON-LD */}
        <Script id="org-jsonld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "ToolCite",
            url: "https://toolcite.com",
            logo: "https://toolcite.com/app-192.png",
            sameAs: ["https://twitter.com/ToolCite"],
          })}
        </Script>
      </head>

      <body
        className={`${inter.className} min-h-dvh flex flex-col
          bg-gradient-to-b from-blue-50 via-blue-100 to-white
          dark:bg-gradient-to-b dark:from-[#000000] dark:via-[#0a0a0a] dark:to-[#121212]
          text-gray-800 dark:text-neutral-100 transition-colors duration-500`}
      >
        {/* Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 rounded px-3 py-2 bg-white dark:bg-neutral-900 shadow
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Skip to content
        </a>

        {/* Live region for share/copy announcements */}
        <div id="a11y-announcer" className="sr-only" aria-live="polite" />

        <main id="main" role="main" tabIndex={-1} className="flex-grow mx-auto w-full max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between" role="banner">
            <h1 className="text-2xl font-semibold tracking-tight">
              ToolCite <span className="font-normal text-gray-500">Hub</span>
            </h1>

            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Smart • Fast • Reliable</p>
              <button
                id="share-link"
                type="button"
                aria-label="Share or copy link"
                title="Share"
                className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2
                           hover:bg-gray-50 dark:hover:bg-neutral-800
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Share
              </button>
            </div>
          </header>

          {children}
        </main>

        <footer
          role="contentinfo"
          className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12 py-6 border-t border-gray-200 dark:border-gray-800"
        >
          © {new Date().getFullYear()} ToolCite. Built by Bharat 💡 ·{" "}
          <a href="/privacy" className="text-blue-600 hover:underline mx-1">Privacy Policy</a> ·{" "}
          <a href="/terms" className="text-blue-600 hover:underline mx-1">Terms of Use</a>
        </footer>

        {/* Share button logic */}
        <Script id="share-link-script" strategy="afterInteractive">{`
          (function () {
            const btn = document.getElementById('share-link');
            const live = document.getElementById('a11y-announcer');
            if (!btn || !live) return;
            async function shareOrCopy() {
              const url = window.location.href;
              try {
                if (navigator.share) {
                  await navigator.share({ title: document.title, url });
                  live.textContent = 'Share dialog opened.'; return;
                }
              } catch {}
              try {
                await navigator.clipboard.writeText(url);
                live.textContent = 'Link copied to clipboard.';
                btn.setAttribute('data-copied', 'true');
                setTimeout(() => btn.removeAttribute('data-copied'), 1500);
              } catch { live.textContent = 'Unable to copy link.'; }
            }
            btn.addEventListener('click', shareOrCopy);
            btn.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shareOrCopy(); }
            });
          })();
        `}</Script>
      </body>
    </html>
  );
}

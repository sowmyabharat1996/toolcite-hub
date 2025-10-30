import type { Metadata } from "next";
import dynamic from "next/dynamic";

// 1) SEO stays on the server
export const metadata: Metadata = {
  title: "Keyword Research Tool (Instant Suggestions, KSI, Exports) | ToolCite",
  description:
    "Free keyword research tool to generate intent-based keywords, see KSI/health, copy CSV/Tailwind, save sessions, and share deep links. Built for fast SEO workflows.",
  alternates: {
    canonical: "https://toolcite.com/tools/keyword-research-basic",
  },
  openGraph: {
    title: "Keyword Research Tool – Free Online SEO Utility",
    description:
      "Find search keywords, intents, difficulty by source, and export reports. Includes KSI bar, charts, and sharable URLs.",
    url: "https://toolcite.com/tools/keyword-research-basic",
    siteName: "ToolCite",
    images: [
      {
        // if you don't have this yet, change to "/og-default.png"
        url: "/og-keyword-research.png",
        width: 1200,
        height: 630,
        alt: "Keyword Research Tool – ToolCite",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ToolCite",
    creator: "@ToolCite",
    images: ["/og-keyword-research.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 2) Tool itself is client-only → avoids `localStorage is not defined`
const KeywordResearchClient = dynamic(
  () => import("@/components/tools/KeywordResearch"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-5xl mx-auto p-6 rounded-xl border border-neutral-200/20 bg-black/10 dark:bg-neutral-900/30">
        Loading keyword tool…
      </div>
    ),
  }
);

// 3) Page component just renders the client tool
export default function Page() {
  return <KeywordResearchClient />;
}

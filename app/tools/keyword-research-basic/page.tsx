// app/tools/keyword-research-basic/page.tsx
import type { Metadata } from "next";
import KeywordResearch from "@/components/tools/KeywordResearch";

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
        // if you don't have a per-tool OG yet, use /og-default.png
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

export default function Page() {
  return <KeywordResearch />;
}

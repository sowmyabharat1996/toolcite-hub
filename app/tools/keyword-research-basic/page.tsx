// app/tools/keyword-research-basic/page.tsx
import type { Metadata } from "next";
import KeywordResearchClient from "./client";

export const metadata: Metadata = {
  title: "Keyword Research Tool (Instant SEO ideas) | ToolCite",
  description:
    "Free keyword research tool to generate intent-based keywords, see KSI/health, copy CSV/Tailwind, save sessions, and share deep links.",
  alternates: {
    canonical: "https://toolcite.com/tools/keyword-research-basic",
  },
  openGraph: {
    title: "Keyword Research Tool – ToolCite",
    description:
      "Find keywords, intents, difficulty-by-source, export JSON/CSV, and share the exact state via URL.",
    url: "https://toolcite.com/tools/keyword-research-basic",
    siteName: "ToolCite",
    images: [
      {
        // change to /og-default.png if you don’t have this yet
        url: "/og-keyword-research.png",
        width: 1200,
        height: 630,
        alt: "Keyword Research – ToolCite",
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
  // this is now a pure server component
  // it only renders the CLIENT wrapper
  return <KeywordResearchClient />;
}

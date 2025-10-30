// app/tools/meta-og-generator/page.tsx
import type { Metadata } from "next";
import MetaOgGeneratorClient from "./client";

const CANONICAL = "https://toolcite.com/tools/meta-og-generator";

export const metadata: Metadata = {
  title: "Meta & Social Tag Generator – Open Graph, Twitter, Canonical | ToolCite",
  description:
    "Generate ready-to-paste SEO, Open Graph, and Twitter meta tags in seconds. Supports presets, fallbacks, and shareable snippets.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    title: "Meta & Social Tag Generator – ToolCite",
    description: "SEO + OG + Twitter tags, all in-browser. No login.",
    images: [
      {
        url: "/og/tools/meta-og-generator.png",
        width: 1200,
        height: 630,
        alt: "ToolCite Meta & Social Tag Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meta & Social Tag Generator – ToolCite",
    description: "Generate Open Graph, Twitter, and canonical meta tags instantly.",
    images: ["/og/tools/meta-og-generator.png"],
    site: "@toolcite",
    creator: "@bharat",
  },
};

export default function Page() {
  // just render the client UI
  return <MetaOgGeneratorClient />;
}

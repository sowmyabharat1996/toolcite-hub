// app/tools/regex-tester/page.tsx
import type { Metadata } from "next";
import Script from "next/script";
import RegexTester from "@/components/tools/RegexTester";

export const metadata: Metadata = {
  title: "Regex Tester – Online Regular Expression Tool | ToolCite",
  description:
    "Test JavaScript regular expressions with flags, highlights, groups, CSV/TSV export, and presets. Fast and privacy-friendly.",
  alternates: { canonical: "/tools/regex-tester" },
  openGraph: {
    type: "website",
    title: "Regex Tester – ToolCite",
    description:
      "Highlight matches, inspect groups, copy as CSV/TSV, import/export presets, and more.",
    images: [{ url: "/og/regex-tester.png", width: 1200, height: 630, alt: "Regex Tester" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regex Tester – ToolCite",
    description: "Real-time highlighting, groups table, and preset library.",
    images: ["/og/regex-tester.png"],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Regex Tester",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "All",
    url: "https://toolcite.com/tools/regex-tester",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Script id="regex-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      <RegexTester />
    </main>
  );
}

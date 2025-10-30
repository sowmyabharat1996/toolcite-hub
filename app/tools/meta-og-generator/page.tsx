// app/tools/meta-og-generator/page.tsx
import type { Metadata } from "next";
import Script from "next/script";
import MetaOgGenerator from "@/components/tools/MetaOgGenerator";

const CANONICAL = "https://toolcite.com/tools/meta-og-generator";

export const metadata: Metadata = {
  title: "Meta Tag & Open Graph Generator | ToolCite",
  description:
    "Generate SEO meta tags, Open Graph, Twitter card tags, and canonical URLs. Copy or download a full <head> snippet in seconds.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: "Meta Tag & Open Graph Generator | ToolCite",
    description:
      "Create social previews and meta tags for your pages quickly.",
    url: CANONICAL,
    images: [
      {
        url: "https://toolcite.com/og-default.png",
        width: 1200,
        height: 630,
        alt: "Meta Tag & Open Graph Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meta Tag & Open Graph Generator | ToolCite",
    description: "Build meta tags for SEO, Facebook, and Twitter. Copy in 1 click.",
    images: ["https://toolcite.com/og-default.png"],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Meta Tag & Open Graph Generator",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "All",
    url: CANONICAL,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Script id="meta-og-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      <MetaOgGenerator />
    </main>
  );
}

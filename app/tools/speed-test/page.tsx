// app/tools/speed-test/page.tsx
import type { Metadata } from "next";
import Script from "next/script";
import SpeedTest from "@/components/tools/SpeedTest";

export const metadata: Metadata = {
  title: "Website Speed Test – TTFB & Load Analyzer | ToolCite",
  description:
    "Measure TTFB, DOM load, and total load times locally in your browser. Compare 2 sites, export JSON, and share results.",
  alternates: { canonical: "/tools/speed-test" },
  openGraph: {
    type: "website",
    title: "Website Speed Test – ToolCite",
    description:
      "Quick local website speed checks: TTFB, DOM load, total load, and comparison charts.",
    images: [{ url: "/og/speed-test.png", width: 1200, height: 630, alt: "Website Speed Test" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Speed Test – ToolCite",
    description: "Analyze site speed locally. Compare two URLs and export results.",
    images: ["/og/speed-test.png"],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Website Speed Test",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    url: "https://toolcite.com/tools/speed-test",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Script id="speed-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      <SpeedTest />
    </main>
  );
}

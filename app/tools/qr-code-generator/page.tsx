// app/tools/qr-code-generator/page.tsx
import type { Metadata } from "next";
import Script from "next/script";
import QrCodeGenerator from "@/components/tools/QrCodeGenerator";

export const metadata: Metadata = {
  title: "Free QR Code Generator – Download PNG/JPG/SVG | ToolCite",
  description:
    "Create customizable QR codes for URLs and text. Choose size, colors, margins, and error correction. Download as PNG, JPG, WebP, or SVG. No sign-up.",
  alternates: { canonical: "/tools/qr-code-generator" },
  openGraph: {
    type: "website",
    title: "Free QR Code Generator – ToolCite",
    description:
      "Generate and download QR codes instantly. Choose size, margin, colors, and error correction.",
    images: [{ url: "/og/qr-code-generator.png", width: 1200, height: 630, alt: "QR Code Generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator – ToolCite",
    description:
      "Make and download QR codes in seconds. PNG, JPG, SVG, WebP supported.",
    images: ["/og/qr-code-generator.png"],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QR Code Generator",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    url: "https://toolcite.com/tools/qr-code-generator",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Script id="qr-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      <QrCodeGenerator />
    </main>
  );
}

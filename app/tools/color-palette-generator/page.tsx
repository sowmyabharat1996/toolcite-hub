// app/tools/color-palette-generator/page.tsx
import type { Metadata } from "next";
import Script from "next/script";
import ColorPaletteGenerator from "@/components/tools/ColorPaletteGenerator";

export const metadata: Metadata = {
  title: "Color Palette Generator – HEX, Contrast Matrix | ToolCite",
  description:
    "Generate palettes from a base color or image. Lock/reorder, copy HEX/CSV, export PNG/JSON, and check WCAG contrast.",
  alternates: { canonical: "/tools/color-palette-generator" },
  openGraph: {
    type: "website",
    title: "Color Palette Generator – ToolCite",
    description:
      "Create accessible color palettes with contrast badges, previews, and exports.",
    images: [{ url: "/og/color-palette-generator.png", width: 1200, height: 630, alt: "Color Palette Generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Palette Generator – ToolCite",
    description:
      "WCAG-aware palettes, contrast matrix, and developer exports.",
    images: ["/og/color-palette-generator.png"],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Color Palette Generator",
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
    url: "https://toolcite.com/tools/color-palette-generator",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Script id="palette-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      <ColorPaletteGenerator />
    </main>
  );
}
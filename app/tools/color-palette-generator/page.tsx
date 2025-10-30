// app/tools/color-palette-generator/page.tsx
import type { Metadata } from "next";
import ColorPaletteGenerator from "@/components/tools/ColorPaletteGenerator";

export const metadata: Metadata = {
  title: "Color Palette Generator – Free Online Tool | ToolCite",
  description:
    "Generate color palettes from a seed color or image, reorder swatches, copy CSS variables, export PNG/GPL/CSV, and share via URL. No sign-up, fast, free.",
  alternates: {
    canonical: "https://toolcite.com/tools/color-palette-generator",
  },
  openGraph: {
    title: "Color Palette Generator – Free Online Tool",
    description:
      "Build accessible color palettes with WCAG badges, presets, reordering, pro exports, and image → palette extraction.",
    url: "https://toolcite.com/tools/color-palette-generator",
    siteName: "ToolCite",
    images: [
      {
        url: "/og-color-palette-generator.png", // if you don’t have it yet, keep /og-default.png
        width: 1200,
        height: 630,
        alt: "Color Palette Generator – ToolCite",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ToolCite",
    creator: "@ToolCite",
    images: ["/og-color-palette-generator.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <ColorPaletteGenerator />;
}

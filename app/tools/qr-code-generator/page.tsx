// app/tools/qr-code-generator/page.tsx
import type { Metadata } from "next";
import QrCodeGenerator from "@/components/tools/QrCodeGenerator";

export const metadata: Metadata = {
  title: "Free QR Code Generator – Online | ToolCite",
  description:
    "Generate free QR codes for links, text, contacts, or Wi-Fi. Customize size, colors, error correction, and download as PNG, JPG, WEBP, or SVG.",
  alternates: {
    canonical: "https://toolcite.com/tools/qr-code-generator",
  },
  openGraph: {
    title: "Free QR Code Generator – Online | ToolCite",
    description:
      "Create high-quality QR codes in your browser. No signup.",
    url: "https://toolcite.com/tools/qr-code-generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator – Online | ToolCite",
    description:
      "Create high-quality QR codes in your browser. No signup.",
  },
};

export default function Page() {
  return <QrCodeGenerator />;
}

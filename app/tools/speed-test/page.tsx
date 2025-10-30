// app/tools/speed-test/page.tsx
import type { Metadata } from "next";
import SpeedTestClient from "./client";

export const metadata: Metadata = {
  metadataBase: new URL("https://toolcite.com"),
  title: "Website Speed Test – Free Online Tool | ToolCite",
  description:
    "Test website speed directly in your browser. Measure TTFB, DOM load, total load time, compare two URLs, export JSON, and share the result — no signup.",
  alternates: {
    canonical: "/tools/speed-test",
  },
  openGraph: {
    type: "website",
    url: "https://toolcite.com/tools/speed-test",
    siteName: "ToolCite",
    title: "Website Speed Test – Free Online Tool",
    description:
      "Analyze page performance, TTFB, and connection metrics. Compare two sites side by side.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "ToolCite Website Speed Test",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ToolCite",
    creator: "@ToolCite",
    title: "Website Speed Test – Free Online Tool",
    description:
      "Measure website TTFB, DOM load, and total load time in the browser.",
    images: ["/og-default.png"],
  },
};

export default function Page() {
  return <SpeedTestClient />;
}

// app/tools/website-speed-test/page.tsx
import type { Metadata } from "next";
import SpeedTest from "@/components/tools/SpeedTest";

export const metadata: Metadata = {
  title: "Website Speed Test – Free Online Tool | ToolCite",
  description: "Test TTFB, DOM load, total load time, and compare two websites in your browser. 100% client-side.",
  alternates: { canonical: "https://toolcite.com/tools/website-speed-test" },
  openGraph: {
    title: "Website Speed Test – Free Online Tool",
    description: "Analyze website load performance, TTFB, and connection metrics — locally.",
    images: ["/og-speed-test.png"], // or /og-default.png
    url: "https://toolcite.com/tools/website-speed-test",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ToolCite",
    creator: "@ToolCite",
    images: ["/og-speed-test.png"],
  },
};

export default function Page() {
  return <SpeedTest />;
}

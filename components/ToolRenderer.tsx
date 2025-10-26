// components/ToolRenderer.tsx
"use client";

import dynamic from "next/dynamic";
import React from "react";

/**
 * Map live tool slugs → client components.
 * Add new entries here as you implement each tool UI.
 */
const REGISTRY: Record<string, React.ComponentType<any>> = {
  "qr-code-generator": dynamic(
    () => import("@/components/tools/QrCodeGenerator"),
    { ssr: false }
  ),
  // Example: when you build these, just uncomment/add:
  // "image-compressor": dynamic(() => import("@/components/tools/ImageCompressor"), { ssr: false }),
  // "regex-tester": dynamic(() => import("@/components/tools/RegexTester"), { ssr: false }),
  // "weather": dynamic(() => import("@/components/tools/WeatherEmbedded"), { ssr: false }),
};

export default function ToolRenderer({ slug }: { slug: string }) {
  const Comp = REGISTRY[slug];
  if (!Comp) return null; // page shows the “Coming soon” fallback
  return <Comp />;
}

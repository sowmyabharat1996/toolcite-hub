"use client";

import dynamic from "next/dynamic";

const MAP: Record<string, any> = {
  "qr-code-generator": dynamic(
    () => import("@/components/tools/QrCodeGenerator"),
    { ssr: false }
  ),
  // add more tools here as you build them…
};

export default function ToolRenderer({ slug }: { slug: string }) {
  const C = MAP[slug];
  if (!C) return null; // page will show the "Coming soon" fallback
  return <C />;
}

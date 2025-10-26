"use client";
import dynamic from "next/dynamic";
import React from "react";

const REGISTRY: Record<string, React.ComponentType<any>> = {
  "qr-code-generator": dynamic(() => import("@/components/tools/QrCodeGenerator"), { ssr: false }),
  "image-compressor": dynamic(() => import("@/components/tools/ImageCompressor"), { ssr: false }),
  "regex-tester": dynamic(() => import("@/components/tools/RegexTester"), { ssr: false }), // ⬅️ new
};

export default function ToolRenderer({ slug }: { slug: string }) {
  const Comp = REGISTRY[slug];
  if (!Comp) return null;
  return <Comp />;
}

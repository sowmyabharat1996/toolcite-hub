"use client";

import dynamic from "next/dynamic";
import React from "react";

// Optional: simple loading fallback for heavy tools
const Loading = () => (
  <div className="rounded-xl border p-6 text-sm text-gray-600 dark:text-gray-300">
    Loading tool…
  </div>
);

const REGISTRY: Record<string, React.ComponentType<any>> = {
  "qr-code-generator": dynamic(() => import("@/components/tools/QrCodeGenerator"), {
    ssr: false,
    loading: Loading,
  }),
  "image-compressor": dynamic(() => import("@/components/tools/ImageCompressor"), {
    ssr: false,
    loading: Loading,
  }),
  "meta-og-generator": dynamic(() => import("@/components/tools/MetaOgGenerator"), {
    ssr: false,
    loading: Loading,
  }),
  "regex-tester": dynamic(() => import("@/components/tools/RegexTester"), {
    ssr: false,
    loading: Loading,
  }),
};

export default function ToolRenderer({ slug }: { slug: string }) {
  const Comp = REGISTRY[slug];
  if (!Comp) {
    return (
      <div className="rounded-xl border p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This tool isn’t wired yet (<code className="font-mono">{slug}</code>).
        </p>
      </div>
    );
  }
  return <Comp />;
}

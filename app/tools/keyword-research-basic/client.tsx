// app/tools/keyword-research-basic/client.tsx
"use client";

import dynamic from "next/dynamic";

const KeywordResearch = dynamic(
  () => import("@/components/tools/KeywordResearch"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-5xl mx-auto p-6 rounded-xl border border-neutral-200/10 bg-black/5 dark:bg-neutral-900/40">
        Loading keyword tool…
      </div>
    ),
  }
);

export default function KeywordResearchClient() {
  return <KeywordResearch />;
}

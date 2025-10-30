"use client";

import dynamic from "next/dynamic";

// load the heavy client-only tool on the client
const RegexTester = dynamic(
  () => import("@/components/tools/RegexTester"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border bg-white/60 dark:bg-neutral-900/40 p-6 text-sm">
        Loading regex tester…
      </div>
    ),
  }
);

export default function RegexTesterClient() {
  return <RegexTester />;
}

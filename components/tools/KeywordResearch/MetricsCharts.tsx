// components/tools/KeywordResearch/MetricsCharts.tsx
"use client";
import React from "react";
import { Metrics } from "./utils";

export default function MetricsCharts({ metrics }: { metrics: Metrics }) {
  const pairs = [
    { label: "Navigational", value: metrics.byIntent.Navigational, color: "bg-sky-500" },
    { label: "Transactional", value: metrics.byIntent.Transactional, color: "bg-emerald-500" },
    { label: "Informational", value: metrics.byIntent.Informational, color: "bg-indigo-500" },
    { label: "Commercial", value: metrics.byIntent.Commercial, color: "bg-amber-500" },
  ];
  const max = Math.max(...pairs.map(p => p.value), 1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {pairs.map((p) => (
        <div key={p.label} className="rounded-xl p-3 border border-neutral-200/70 dark:border-neutral-800">
          <div className="text-sm text-neutral-600 dark:text-neutral-300">{p.label}</div>
          <div className="mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className={`h-full ${p.color} transition-all duration-700`}
              style={{ width: `${(p.value / max) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{p.value} keywords</div>
        </div>
      ))}
    </div>
  );
}

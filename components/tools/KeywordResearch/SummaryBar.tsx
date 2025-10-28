// components/tools/KeywordResearch/SummaryBar.tsx
"use client";

import React from "react";
import type { Metrics } from "./utils";

type Props = {
  metrics: Metrics;
  previous: Metrics | null;
  lastUpdated: number;
  showTrend: boolean;
  estClicks: number;
  /** Optional small caption shown under the KPI row */
  extraNote?: string;
};

export default function SummaryBar({
  metrics,
  previous,
  lastUpdated,
  showTrend,
  estClicks,
  extraNote,
}: Props) {
  // --- helpers ---
  const pctDelta = (curr: number, prev: number | undefined | null) => {
    if (!showTrend || prev == null) return null;
    if (prev === 0) return curr === 0 ? 0 : 100;
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  };
  const arrow = (d: number | null) =>
    d == null ? null : d > 0 ? "▲" : d < 0 ? "▼" : "▬";
  const color = (d: number | null) =>
    d == null
      ? "text-neutral-400"
      : d > 0
      ? "text-emerald-600"
      : d < 0
      ? "text-rose-600"
      : "text-neutral-500";

  // deltas against previous snapshot (when provided)
  const dTotal = pctDelta(metrics.total, previous?.total);
  const dAvgDiff = pctDelta(metrics.avgDifficulty, previous?.avgDifficulty);
  const dNav = pctDelta(metrics.byIntent.Navigational, previous?.byIntent.Navigational);
  const dTran = pctDelta(metrics.byIntent.Transactional, previous?.byIntent.Transactional);
  const dInfo = pctDelta(metrics.byIntent.Informational, previous?.byIntent.Informational);
  const dComm = pctDelta(metrics.byIntent.Commercial, previous?.byIntent.Commercial);
  const dHealth = pctDelta(metrics.health, previous?.health);

  return (
    <section className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Kpi label="Total Keywords" value={metrics.total} delta={dTotal} />
        <Kpi label="Avg Difficulty" value={metrics.avgDifficulty} delta={dAvgDiff} />
        <Kpi label="Navigational" value={metrics.byIntent.Navigational} delta={dNav} />
        <Kpi label="Transactional" value={metrics.byIntent.Transactional} delta={dTran} />
        <Kpi label="Informational" value={metrics.byIntent.Informational} delta={dInfo} />
        <Kpi label="Commercial" value={metrics.byIntent.Commercial} delta={dComm} />
        <Kpi label="Est. Monthly Clicks" value={estClicks.toLocaleString()} />
      </div>

      {/* Health + last updated */}
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-neutral-500">Keyword Health</span>
          <div className="relative h-2 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-2 bg-sky-500"
              style={{ width: `${Math.max(0, Math.min(100, metrics.health))}%` }}
            />
          </div>
          {showTrend && dHealth != null && (
            <span className={`ml-1 text-xs font-medium ${color(dHealth)}`}>
              {arrow(dHealth)} {Math.abs(dHealth)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-neutral-500">
          <span className="text-xs">Last Updated</span>
          <span className="text-xs">
            {Math.max(0, Math.round((Date.now() - lastUpdated) / 1000))}s ago
          </span>
        </div>
      </div>

      {/* optional caption */}
      {extraNote && (
        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
          {extraNote}
        </div>
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  delta,
}: {
  label: string;
  value: number | string;
  delta?: number | null;
}) {
  const icon = delta == null ? null : delta > 0 ? "▲" : delta < 0 ? "▼" : "▬";
  const tone =
    delta == null
      ? "text-neutral-400"
      : delta > 0
      ? "text-emerald-600"
      : delta < 0
      ? "text-rose-600"
      : "text-neutral-500";

  return (
    <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-neutral-200/70 dark:border-neutral-800 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {delta != null && (
        <div className={`text-[11px] mt-0.5 ${tone}`}>
          {icon} {Math.abs(delta)}%
        </div>
      )}
    </div>
  );
}

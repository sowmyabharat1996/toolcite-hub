// components/tools/KeywordResearch/SummaryBar.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Intent, Metrics } from "./utils";

type Props = {
  metrics: Metrics;
  lastUpdated: number;
  showTrend: boolean;
  previous?: Metrics | null;
};

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function bgForHealth(h: number) {
  // animated background class by health (A/B/C requirement)
  if (h >= 70) return "from-green-500/15 to-emerald-500/15";
  if (h >= 40) return "from-blue-500/15 to-sky-500/15";
  return "from-zinc-500/15 to-neutral-600/15";
}

function TrendArrow({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span className={classNames(
      "ml-1 text-xs font-medium inline-flex items-center gap-0.5 transition-opacity duration-300",
      up ? "text-green-600" : "text-rose-600"
    )}>
      {up ? "▲" : "▼"} {Math.abs(delta)}%
    </span>
  );
}

function useTicker(target: number, deps: React.DependencyList) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const dur = 700;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return n;
}

export default function SummaryBar({ metrics, lastUpdated, showTrend, previous }: Props) {
  const [spin, setSpin] = useState(false);
  // Simulate a quick spinner whenever timestamp changes
  useEffect(() => {
    setSpin(true);
    const id = setTimeout(() => setSpin(false), 600);
    return () => clearTimeout(id);
  }, [lastUpdated]);

  const secondsAgo = useMemo(() => {
    const s = Math.floor((Date.now() - lastUpdated) / 1000);
    return s < 1 ? 0 : s;
  }, [lastUpdated]);

  const totalN = useTicker(metrics.total, [metrics.total, lastUpdated]);
  const avgDiffN = useTicker(metrics.avgDifficulty, [metrics.avgDifficulty, lastUpdated]);
  const healthN = useTicker(metrics.health, [metrics.health, lastUpdated]);

  const deltas = useMemo(() => {
    if (!previous) return null;
    return {
      avgDifficulty: previous.avgDifficulty === 0 ? 0 : Math.round(((metrics.avgDifficulty - previous.avgDifficulty) / Math.max(1, previous.avgDifficulty)) * 100),
      intents: (["Navigational","Transactional","Informational","Commercial"] as Intent[]).reduce<Record<Intent, number>>((acc, key) => {
        const prev = previous.byIntent[key] || 0;
        const cur = metrics.byIntent[key] || 0;
        acc[key] = prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);
        return acc;
      }, {Navigational:0,Transactional:0,Informational:0,Commercial:0}),
      health: previous.health === 0 ? 0 : Math.round(((metrics.health - previous.health) / Math.max(1, previous.health)) * 100),
    };
  }, [metrics, previous]);

  return (
    <div
      className={classNames(
        "sticky top-0 z-20 mb-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80 bg-gradient-to-r",
        bgForHealth(metrics.health),
        "backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-black/40"
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4">
        <Stat label="Total Keywords" value={totalN} />
        <Stat label="Avg Difficulty" value={avgDiffN}>
          {showTrend && deltas && <TrendArrow delta={-deltas.avgDifficulty} />}
        </Stat>
        <Stat label="Navigational" value={metrics.byIntent.Navigational}>
          {showTrend && deltas && <TrendArrow delta={deltas.intents.Navigational} />}
        </Stat>
        <Stat label="Transactional" value={metrics.byIntent.Transactional}>
          {showTrend && deltas && <TrendArrow delta={deltas.intents.Transactional} />}
        </Stat>
        <Stat label="Informational" value={metrics.byIntent.Informational}>
          {showTrend && deltas && <TrendArrow delta={deltas.intents.Informational} />}
        </Stat>
        <Stat label="Commercial" value={metrics.byIntent.Commercial}>
          {showTrend && deltas && <TrendArrow delta={deltas.intents.Commercial} />}
        </Stat>
      </div>

      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">Keyword Health</span>
          <div className="relative w-44 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full transition-all duration-700"
              style={{
                width: `${metrics.health}%`,
                background:
                  "linear-gradient(90deg, rgba(34,197,94,1) 0%, rgba(59,130,246,1) 60%, rgba(59,130,246,1) 100%)",
              }}
            />
          </div>
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{healthN}</span>
          {showTrend && deltas && <TrendArrow delta={deltas.health} />}
        </div>

        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          <button
            aria-label="Refresh"
            className={classNames("mr-2 inline-flex items-center", spin && "animate-spin")}
            onClick={() => {/* spin purely visual; main refresh in parent */}}
          >
            🔄
          </button>
          Last Updated <span className="font-medium">{secondsAgo}s</span> ago
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: number | string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-white/5 p-3 shadow-sm border border-neutral-200/60 dark:border-neutral-800">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {value}
        {children}
      </div>
    </div>
  );
}

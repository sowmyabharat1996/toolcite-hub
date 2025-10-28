"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Intent, Metrics } from "./utils";

type Props = {
  metrics: Metrics;
  lastUpdated: number;
  showTrend: boolean;
  previous?: Metrics | null;
  estClicks?: number;
};

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

function bgForHealth(h: number) {
  if (h >= 70) return "from-green-500/15 to-emerald-500/15";
  if (h >= 40) return "from-blue-500/15 to-sky-500/15";
  return "from-rose-500/15 to-red-500/15";
}

function TrendArrow({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={`ml-1 text-xs font-medium inline-flex items-center gap-0.5 transition-opacity duration-300 ${
        up ? "text-green-600" : "text-rose-600"
      }`}
      aria-label={up ? `Up ${Math.abs(delta)} percent` : `Down ${Math.abs(delta)} percent`}
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}%
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const width = 60;
  const height = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const norm = (v: number) =>
    max - min === 0 ? height / 2 : height - ((v - min) / (max - min)) * height;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${norm(v)}`)
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="ml-2"
      role="img"
      aria-label="Trend sparkline"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        points={points}
        className="opacity-80 transition-all duration-500"
      />
      <circle
        cx={width}
        cy={norm(data[data.length - 1])}
        r="2.5"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
}

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const fmt = (n: number | undefined) =>
  typeof n === "number" ? n.toLocaleString() : "—";

export default function SummaryBar({
  metrics,
  lastUpdated,
  showTrend,
  previous,
  estClicks = 0,
}: Props) {
  const [spin, setSpin] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      time: number;
      total: number;
      avgDifficulty: number;
      health: number;
      intents: Metrics["byIntent"];
      estClicks: number;
    }>
  >([]);

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem("metricHistory") || "[]").map((x: any) => ({
      ...x,
      estClicks: typeof x.estClicks === "number" ? x.estClicks : 0,
    }));
    setHistory(h);
  }, []);

  useEffect(() => {
    if (!metrics || metrics.total === 0) return;
    const newEntry = {
      time: Date.now(),
      total: metrics.total,
      avgDifficulty: metrics.avgDifficulty,
      health: metrics.health,
      intents: metrics.byIntent,
      estClicks,
    };
    const updated = [...history.slice(-4), newEntry];
    setHistory(updated);
    localStorage.setItem("metricHistory", JSON.stringify(updated));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics.total, metrics.avgDifficulty, metrics.health, estClicks]);

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
  const clicksN = useTicker(estClicks, [estClicks, lastUpdated]);

  const deltas = useMemo(() => {
    if (!previous) return null;
    return {
      avgDifficulty:
        previous.avgDifficulty === 0
          ? 0
          : Math.round(
              ((metrics.avgDifficulty - previous.avgDifficulty) /
                Math.max(1, previous.avgDifficulty)) *
                100
            ),
      intents: (["Navigational", "Transactional", "Informational", "Commercial"] as Intent[]).reduce<
        Record<Intent, number>
      >((acc, key) => {
        const prev = previous.byIntent[key] || 0;
        const cur = metrics.byIntent[key] || 0;
        acc[key] = prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);
        return acc;
      }, { Navigational: 0, Transactional: 0, Informational: 0, Commercial: 0 }),
      health:
        previous.health === 0
          ? 0
          : Math.round(((metrics.health - previous.health) / Math.max(1, previous.health)) * 100),
    };
  }, [metrics, previous]);

  const trendColor = useMemo(() => {
    const d = deltas?.health ?? 0;
    if (Math.abs(d) < 1) return "#3b82f6";
    return d > 0 ? "#22c55e" : "#ef4444";
  }, [deltas]);

  const prevClicks = history.length ? history[history.length - 1].estClicks : 0;
  const clicksDelta =
    prevClicks === 0 ? 0 : Math.round(((estClicks - prevClicks) / Math.max(1, prevClicks)) * 100);

  const getSpark = (key: "total" | "avgDifficulty" | "health" | "estClicks") =>
    history.map((h) => h[key]).slice(-5);

  return (
    <div
      className={classNames(
        "sticky top-0 z-20 mb-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80 bg-gradient-to-r",
        bgForHealth(metrics.health),
        "backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-black/40 transition-shadow duration-500"
      )}
      aria-label="Summary KPIs"
    >
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 p-4">
        <Stat label="Total Keywords" value={totalN} spark={getSpark("total")} color={trendColor} />
        <Stat label="Avg Difficulty" value={avgDiffN} spark={getSpark("avgDifficulty")} color={trendColor}>
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
        <Stat label="Est. Monthly Clicks" value={fmt(clicksN)} spark={getSpark("estClicks")} color={trendColor}>
          {showTrend && <TrendArrow delta={clicksDelta} />}
        </Stat>
      </div>

      {/* Health bar row with progress semantics */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">Keyword Health</span>
          <div
            className="relative w-44 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden"
            role="progressbar"
            aria-label="Keyword Health"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metrics.health}
          >
            <div
              className="absolute left-0 top-0 h-full transition-all duration-700"
              style={{
                width: `${metrics.health}%`,
                background:
                  trendColor === "#22c55e"
                    ? "linear-gradient(90deg, rgba(34,197,94,1) 0%, rgba(52,211,153,1) 100%)"
                    : trendColor === "#ef4444"
                    ? "linear-gradient(90deg, rgba(239,68,68,1) 0%, rgba(251,113,133,1) 100%)"
                    : "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(96,165,250,1) 100%)",
                boxShadow: `0 0 12px ${trendColor}`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{healthN}</span>
          {showTrend && deltas && <TrendArrow delta={deltas.health} />}
          <Sparkline data={getSpark("health")} color={trendColor} />
        </div>

        {/* polite live region for time updates */}
        <div className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-1" role="status" aria-live="polite" aria-atomic="true">
          <button
            aria-label="Refresh visual tick"
            className={classNames("inline-flex items-center", spin && "animate-spin")}
            onClick={() => {}}
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
  spark,
  color,
}: {
  label: string;
  value: number | string;
  children?: React.ReactNode;
  spark?: number[];
  color?: string;
}) {
  return (
    <div
      className="rounded-xl bg-white/60 dark:bg-white/5 p-3 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex flex-col justify-between transition-all duration-500 hover:shadow-md"
      role="group"
      aria-label={label}
    >
      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
        <span>{label}</span>
        {spark && spark.length > 1 && <Sparkline data={spark} color={color ?? "#3b82f6"} />}
      </div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
        {value}
        {children}
      </div>
    </div>
  );
}

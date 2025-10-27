// components/tools/KeywordResearch/index.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import SummaryBar from "./SummaryBar";
import MetricsCharts from "./MetricsCharts";
import KeywordList from "./KeywordList";
import {
  Dataset,
  KeywordSourceBlock,
  Metrics,
  KeywordItem,
  generateMockData,
  computeMetrics,
  toCSV,
  shareURLFromSeed,
  runAIInsight,
  applyVolumeCPCSimulation,
} from "./utils";
import { exportDashboardToPDF } from "./PdfReport";

export default function KeywordResearch() {
  const [query, setQuery] = useState("");
  const [dataset, setDataset] = useState<Dataset>({ data: [], metrics: emptyMetrics() });
  const [previousMetrics, setPreviousMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [showTrend, setShowTrend] = useState(true);

  // AI Insight state
  const [insights, setInsights] = useState<Array<KeywordItem & { reasons?: string[] }>>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [sortByAI, setSortByAI] = useState(false);

  // Volume + CPC simulator
  const [volSim, setVolSim] = useState(50); // 0..100
  const [cpcSim, setCpcSim] = useState(50); // 0..100
  const [estClicks, setEstClicks] = useState(0);

  // Immutable baseline so sliders don’t compound
  const [baseBlocks, setBaseBlocks] = useState<KeywordSourceBlock[]>([]);

  // 🌈 trend color mood (blue = stable, green = improving, red = declining)
  const [trendColor, setTrendColor] = useState<string>("#3b82f6");

  const rootRef = useRef<HTMLDivElement>(null);

  // Preload seed from URL (?q=)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) {
      setQuery(q);
      handleGenerate(q);
    }
  }, []);

  // Persist “sort by AI” toggle
  useEffect(() => {
    const stored = localStorage.getItem("sortByAI");
    if (stored === "true") setSortByAI(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sortByAI", sortByAI ? "true" : "false");
  }, [sortByAI]);

  // Derive trend color from health delta vs previous run
  useEffect(() => {
    if (!previousMetrics) return;
    const delta = dataset.metrics.health - previousMetrics.health;
    if (Math.abs(delta) < 1) setTrendColor("#3b82f6"); // blue stable
    else if (delta > 0) setTrendColor("#22c55e"); // green improving
    else setTrendColor("#ef4444"); // red declining
  }, [dataset.metrics.health, previousMetrics]);

  // ---------- Explainability ----------
  function explainPick(k: KeywordItem): string[] {
    const reasons: string[] = [];

    // Difficulty
    if (k.difficulty <= 25) reasons.push("Very low difficulty — quick win potential");
    else if (k.difficulty <= 40) reasons.push("Manageable difficulty — realistic to rank");

    // Volume
    if ((k.volume ?? 0) >= 70) reasons.push("Strong search volume signal");
    else if ((k.volume ?? 0) >= 50) reasons.push("Decent search interest");

    // CPC (monetizability)
    if ((k.cpc ?? 0) >= 70) reasons.push("High CPC — monetizable traffic");
    else if ((k.cpc ?? 0) >= 50) reasons.push("Above-average CPC — revenue opportunity");

    // Intent
    if (k.intent === "Transactional" || k.intent === "Commercial") {
      reasons.push(`Buyer intent leaning ${k.intent.toLowerCase()}`);
    }

    // Trend
    if (k.trendPct > 0) reasons.push(`Positive trend (${k.trendPct}% ↑)`);

    // cap to best 2–3 reasons
    return reasons.slice(0, 3);
  }

  // ---------- Actions ----------
  function handleGenerate(q?: string) {
    const seed = (q ?? query).trim() || "keyword";
    const result = generateMockData(seed);

    setPreviousMetrics(dataset.metrics);
    setBaseBlocks(result.data);

    // Apply current simulation immediately
    const sim = applyVolumeCPCSimulation(result.data, volSim, cpcSim);
    const metrics = computeMetrics(sim.blocks);

    // Keep AI scores fresh for current state
    const { top3, scores } = runAIInsight(sim.blocks);
    const scoredBlocks: KeywordSourceBlock[] = sim.blocks.map((b) => ({
      ...b,
      items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));

    setDataset({ data: scoredBlocks, metrics });
    setInsights(top3.map((t) => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(top3[0]?.id ?? null);
    setEstClicks(sim.estClicks);
    setLastUpdated(Date.now());
  }

  function handleCopyAll() {
    const flat = dataset.data.flatMap((b) => b.items.map((k) => k.phrase)).join("\n");
    navigator.clipboard.writeText(flat);
  }

  function handleExportCSV() {
    const csv = toCSV(dataset.data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    navigator.clipboard.writeText(shareURLFromSeed(query || "keyword"));
  }

  async function handleExportPDF() {
    if (!rootRef.current) return;
    await exportDashboardToPDF(rootRef.current, "keyword-dashboard.pdf");
  }

  // Re-run AI on current dataset (manual click)
  function handleAIInsight() {
    const { top3, scores } = runAIInsight(dataset.data);
    const scoredBlocks: KeywordSourceBlock[] = dataset.data.map((b) => ({
      ...b,
      items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));
    setDataset({ data: scoredBlocks, metrics: computeMetrics(scoredBlocks) });
    setInsights(top3.map((t) => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(top3[0]?.id ?? null);
    document.getElementById("insights-panel")?.scrollIntoView({ behavior: "smooth" });
    setLastUpdated(Date.now());
  }

  // Apply simulator live (sliders)
  function applySim(vol: number, cpc: number) {
    if (!baseBlocks.length) return;

    const sim = applyVolumeCPCSimulation(baseBlocks, vol, cpc);
    const metrics = computeMetrics(sim.blocks);

    // keep AI scores & picks fresh as sliders move
    const { top3, scores } = runAIInsight(sim.blocks);
    const scoredBlocks: KeywordSourceBlock[] = sim.blocks.map((b) => ({
      ...b,
      items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));

    setDataset({ data: scoredBlocks, metrics });
    setInsights(top3.map((t) => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(top3[0]?.id ?? null);
    setEstClicks(sim.estClicks);
    setLastUpdated(Date.now());
  }

  function onVolChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolSim(v);
    applySim(v, cpcSim);
  }

  function onCpcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setCpcSim(v);
    applySim(volSim, v);
  }

  // Optional sort by AI score
  const sortedBlocks: KeywordSourceBlock[] = sortByAI
    ? dataset.data.map((b) => ({
        ...b,
        items: [...b.items].sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0)),
      }))
    : dataset.data;

  const { metrics } = dataset;

  // ---------- Page background gradient (mood-synced) ----------
  const bgStyle: React.CSSProperties = {
    background: `
      radial-gradient(1200px 700px at 10% -10%, ${trendColor}12, transparent 60%),
      radial-gradient(1200px 700px at 110% 110%, ${trendColor}10, transparent 60%),
      linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)
    `,
    transition: "background 700ms ease",
  };

  // ---------- Helpers for AI panel chips ----------
  const chip = (label: string, tone: "sky" | "emerald" | "amber" | "indigo") => {
    const toneMap: Record<typeof tone, string> = {
      sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
      emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
      amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
      indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    } as any;
    return (
      <span className={`text-[11px] px-2 py-0.5 rounded-full ${toneMap[tone]} whitespace-nowrap`}>
        {label}
      </span>
    );
  };

  return (
    <div className="relative min-h-[100vh]">
      {/* Fixed background wash (mood synced) */}
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none" style={bgStyle} />

      <div ref={rootRef} className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            🔎 Keyword Research (AI Dashboard)
          </h1>

          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? handleGenerate() : null)}
              placeholder="e.g. ai tools for students"
              className="h-10 w-64 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-white/5 px-3"
            />
            <button
              className="h-10 px-4 rounded-xl bg-blue-600 text-white font-medium hover:scale-[1.03] transition-transform"
              onClick={() => handleGenerate()}
            >
              Generate
            </button>
            <button
              type="button"
              className="h-10 px-3 rounded-xl bg-emerald-600 text-white hover:scale-[1.03] transition-transform"
              onClick={handleAIInsight}
              aria-controls="insights-panel"
            >
              🤖 AI Insight
            </button>
            <button className="h-10 px-3 rounded-xl bg-neutral-800 text-white" onClick={handleCopyAll}>
              Copy All
            </button>
            <button className="h-10 px-3 rounded-xl bg-purple-600 text-white" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="h-10 px-3 rounded-xl bg-amber-600 text-white" onClick={handleExportPDF}>
              Export PDF
            </button>
            <button className="h-10 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-700" onClick={handleShare}>
              Share Link
            </button>
          </div>
        </div>

        {/* Summary (with Est. Monthly Clicks tile) */}
        <SummaryBar
          metrics={metrics}
          previous={previousMetrics}
          lastUpdated={lastUpdated}
          showTrend={showTrend}
          estClicks={estClicks}
        />

        {/* Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
            />
            Show trend deltas
          </label>

          <label className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-emerald-600"
              checked={sortByAI}
              onChange={(e) => setSortByAI(e.target.checked)}
            />
            Sort / Highlight by AI Score
          </label>
        </div>

        {/* Volume + CPC Simulator */}
        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Volume + CPC Simulator</div>
            <div className="text-xs text-neutral-500">Adjust sliders → AI Picks &amp; KSI update live</div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Volume */}
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span>Assumed Avg Volume (scales all rows)</span>
                <strong>{volSim}</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volSim}
                onChange={onVolChange}
                className="w-full accent-sky-600"
              />
            </div>

            {/* CPC */}
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span>Assumed Avg CPC (scales all rows)</span>
                <strong>{cpcSim}</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={cpcSim}
                onChange={onCpcChange}
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          {/* KPI */}
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-sm">
              <span>🟢 Est. Monthly Clicks</span>
              <strong className="text-emerald-700 dark:text-emerald-300">
                {estClicks.toLocaleString()}
              </strong>
              <span className="text-xs text-neutral-500">toy model: Σ(vol × (1–diff%))</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <MetricsCharts metrics={metrics} blocks={sortedBlocks} />

        {/* AI Insight Top-3 — card style with “Why this pick?” */}
        <aside
          id="insights-panel"
          className="rounded-2xl border p-4 transition-all duration-500"
          style={{
            borderColor: trendColor + "66",
            background:
              trendColor === "#22c55e"
                ? "linear-gradient(145deg, rgba(240,253,244,0.85) 0%, rgba(220,252,231,0.5) 100%)"
                : trendColor === "#ef4444"
                ? "linear-gradient(145deg, rgba(254,242,242,0.85) 0%, rgba(254,226,226,0.5) 100%)"
                : "linear-gradient(145deg, rgba(239,246,255,0.85) 0%, rgba(219,234,254,0.5) 100%)",
            boxShadow: `0 6px 24px ${trendColor}1f`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg" style={{ color: trendColor }}>
              AI Insight — Easiest Wins
            </h3>
            <span className="text-xs font-medium" style={{ color: trendColor }}>
              Click again after changing data/filters
            </span>
          </div>

          <ul className="space-y-3">
            {insights.map((x, i) => (
              <li
                key={x.id}
                className="rounded-xl border bg-white/70 dark:bg-white/10 p-3 transition-all duration-300 hover:shadow-md"
                style={{ borderColor: trendColor + "4d" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ backgroundColor: trendColor + "22", color: trendColor }}
                      >
                        {i + 1}
                      </span>
                      <div className="truncate font-medium">{x.phrase}</div>
                    </div>

                    {/* chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {chip(x.intent, x.intent === "Transactional"
                        ? "emerald"
                        : x.intent === "Commercial"
                        ? "amber"
                        : x.intent === "Informational"
                        ? "indigo"
                        : "sky")}
                      {chip(`diff ${x.difficulty}`, "sky")}
                      {typeof x.volume === "number" && chip(`vol ${x.volume}`, "emerald")}
                      {typeof x.cpc === "number" && chip(`cpc ${x.cpc}`, "amber")}
                    </div>

                    {/* Why this pick */}
                    {x.reasons && x.reasons.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                          Why this pick?
                        </div>
                        <ul className="mt-1 ml-4 list-disc text-xs text-neutral-600 dark:text-neutral-300 space-y-0.5">
                          {x.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold" style={{ color: trendColor }}>
                      {x.ai}
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {!insights.length && (
              <li className="text-sm text-neutral-600 dark:text-neutral-300">
                Click “AI Insight” to score and see Top-3 easiest keywords.
              </li>
            )}
          </ul>
        </aside>

        {/* Keyword Lists */}
        <div id="kw-lists" className="pt-2">
          <KeywordList blocks={sortedBlocks} highlightId={highlightId} />
        </div>
      </div>
    </div>
  );
}

function emptyMetrics(): Metrics {
  return {
    total: 0,
    avgDifficulty: 0,
    byIntent: {
      Navigational: 0,
      Transactional: 0,
      Informational: 0,
      Commercial: 0,
    },
    health: 0,
  };
}

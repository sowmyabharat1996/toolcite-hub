"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import SummaryBar from "./SummaryBar";
import MetricsCharts from "./MetricsCharts";
import KeywordList from "./KeywordList";
import {
  Dataset,
  KeywordSourceBlock,
  Metrics,
  generateMockData,
  computeMetrics,
  toCSV,
  shareURLFromSeed,
  runAIInsight,
} from "./utils";
import { exportDashboardToPDF } from "./PdfReport";

function useGlowTrigger(deps: any[]) {
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    setGlow(true);
    const id = setTimeout(() => setGlow(false), 800);
    return () => clearTimeout(id);
  }, deps);
  return glow;
}

export default function KeywordResearch() {
  const [query, setQuery] = useState("");
  const [dataset, setDataset] = useState<Dataset>({ data: [], metrics: emptyMetrics() });
  const [previousMetrics, setPreviousMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [showTrend, setShowTrend] = useState(true);

  const [aiTopIds, setAiTopIds] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<any[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [sortByAI, setSortByAI] = useState(false);
  const [trendColor, setTrendColor] = useState("#3b82f6"); // mood color (blue default)

  const rootRef = useRef<HTMLDivElement>(null);
  const glow = useGlowTrigger([dataset.metrics.health]);

  // preload from ?q=
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) {
      setQuery(q);
      handleGenerate(q);
    }
  }, []);

  // load sort preference
  useEffect(() => {
    const stored = localStorage.getItem("sortByAI");
    if (stored === "true") setSortByAI(true);
  }, []);

  // persist toggle state
  useEffect(() => {
    localStorage.setItem("sortByAI", sortByAI ? "true" : "false");
  }, [sortByAI]);

  // 🌈 derive “mood color” by comparing previous vs current health
  useEffect(() => {
    if (!previousMetrics) return;
    const delta = dataset.metrics.health - previousMetrics.health;
    if (Math.abs(delta) < 1) setTrendColor("#3b82f6"); // blue = stable
    else if (delta > 0) setTrendColor("#22c55e"); // green = improving
    else setTrendColor("#ef4444"); // red = declining
  }, [dataset.metrics.health, previousMetrics]);

  // ------------- core actions ------------------
  function handleGenerate(q?: string) {
    const seed = (q ?? query).trim() || "keyword";
    const result = generateMockData(seed);
    setPreviousMetrics(dataset.metrics);
    setDataset(result);
    setLastUpdated(Date.now());
    setHighlightId(null);
    setAiTopIds(new Set());
    setInsights([]);
  }

  function handleCopyAll() {
    const flat = dataset.data.flatMap(b => b.items.map(k => k.phrase)).join("\n");
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

  function handleAIInsight() {
    const { top3, scores } = runAIInsight(dataset.data);
    const newBlocks: KeywordSourceBlock[] = dataset.data.map(b => ({
      ...b,
      items: b.items.map(k => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));
    setDataset({ data: newBlocks, metrics: computeMetrics(newBlocks) });
    setInsights(top3);
    setAiTopIds(new Set(top3.map(t => t.id)));
    setHighlightId(top3[0]?.id ?? null);
    document.getElementById("insights-panel")?.scrollIntoView({ behavior: "smooth" });
  }

  // sort items by AI
  const sortedBlocks: KeywordSourceBlock[] = sortByAI
    ? dataset.data.map(b => ({
        ...b,
        items: [...b.items].sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0)),
      }))
    : dataset.data;

  const { metrics } = dataset;

  // -------------------- render ---------------------
  return (
    <div ref={rootRef} className="space-y-6 transition-all duration-500 ease-in-out">
      {/* Title + Controls */}
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
          <button
            className="h-10 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-700"
            onClick={handleShare}
          >
            Share Link
          </button>
        </div>
      </div>

      {/* Summary */}
      <SummaryBar
        metrics={metrics}
        previous={previousMetrics}
        lastUpdated={lastUpdated}
        showTrend={showTrend}
      />

      {/* Controls row */}
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

      {/* Charts section */}
      <div
        className={`transition-all duration-700 ${
          glow ? "shadow-[0_0_25px_rgba(16,185,129,0.45)] rounded-2xl" : ""
        }`}
      >
        <MetricsCharts metrics={metrics} blocks={sortedBlocks} />
      </div>

      {/* AI Insight Top 3 Panel */}
      <aside
        id="insights-panel"
        className="rounded-2xl border p-4 transition-all duration-500 hover:shadow-lg"
        style={{
          borderColor: trendColor + "66",
          background:
            trendColor === "#22c55e"
              ? "linear-gradient(145deg, rgba(240,253,244,0.8) 0%, rgba(220,252,231,0.5) 100%)"
              : trendColor === "#ef4444"
              ? "linear-gradient(145deg, rgba(254,242,242,0.8) 0%, rgba(254,226,226,0.5) 100%)"
              : "linear-gradient(145deg, rgba(239,246,255,0.8) 0%, rgba(219,234,254,0.5) 100%)",
          boxShadow: `0 0 18px ${trendColor}40`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className="font-semibold text-lg"
            style={{ color: trendColor }}
          >
            AI Insight — Easiest Wins
          </h3>
          <span
            className="text-xs font-medium"
            style={{ color: trendColor }}
          >
            Click again after changing data/filters
          </span>
        </div>
        <ul className="space-y-2">
          {insights.map((x, i) => (
            <li
              key={x.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: trendColor + "0F",
                borderLeft: `3px solid ${trendColor}`,
              }}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {i + 1}. {x.phrase}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300">
                  diff {x.difficulty} • {x.intent} • vol {x.volume ?? "—"} • cpc {x.cpc ?? "—"}
                </div>
              </div>
              <span className="text-sm font-semibold" style={{ color: trendColor }}>
                {x.ai}
              </span>
            </li>
          ))}
          {!insights.length && (
            <li className="text-sm text-neutral-600 dark:text-neutral-300">
              Click “AI Insight” to score and see Top 3 easiest keywords.
            </li>
          )}
        </ul>
      </aside>

      {/* Keyword list grid */}
      <div id="kw-lists" className="pt-2">
        <KeywordList
          blocks={sortedBlocks}
          highlightId={highlightId}
          aiTopIds={aiTopIds}
          sortByAI={sortByAI}
        />
      </div>
    </div>
  );
}

// Empty metric template
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

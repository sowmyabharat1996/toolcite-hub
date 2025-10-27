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
  generateMockData,
  computeMetrics,
  toCSV,
  shareURLFromSeed,
  runAIInsight,
} from "./utils";
import { exportDashboardToPDF } from "./PdfReport";

export default function KeywordResearch() {
  const [query, setQuery] = useState("");
  const [dataset, setDataset] = useState<Dataset>({ data: [], metrics: emptyMetrics() });
  const [previousMetrics, setPreviousMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [showTrend, setShowTrend] = useState(true);

  // AI Insight state
  const [aiTopIds, setAiTopIds] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<any[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [sortByAI, setSortByAI] = useState(false); // NEW toggle

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) {
      setQuery(q);
      handleGenerate(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // AI Insight
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

  // Sorting logic — reorder items inside each block
  const sortedBlocks: KeywordSourceBlock[] = sortByAI
    ? dataset.data.map(b => ({
        ...b,
        items: [...b.items].sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0)),
      }))
    : dataset.data;

  const { metrics } = dataset;

  return (
    <div ref={rootRef} className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-semibold">
          🔎 Keyword Research (Basic)
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
            className="h-10 px-4 rounded-xl bg-blue-600 text-white font-medium"
            onClick={() => handleGenerate()}
          >
            Generate
          </button>
          <button
            type="button"
            className="h-10 px-3 rounded-xl bg-emerald-600 text-white"
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

      {/* Sticky Summary */}
      <SummaryBar
        metrics={metrics}
        previous={previousMetrics}
        lastUpdated={lastUpdated}
        showTrend={showTrend}
      />

      {/* Options row */}
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

        {/* NEW Sort toggle */}
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

      {/* Charts */}
      <MetricsCharts metrics={metrics} blocks={sortedBlocks} />

      {/* AI Insights Panel */}
      <aside
        id="insights-panel"
        className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/20 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
            AI Insight — Easiest Wins
          </h3>
          <span className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
            Click again after changing data/filters to refresh picks
          </span>
        </div>
        <ul className="mt-2 space-y-2">
          {insights.map((x, i) => (
            <li key={x.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {i + 1}. {x.phrase}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300">
                  diff {x.difficulty} • {x.intent} • vol {x.volume ?? "—"} • cpc {x.cpc ?? "—"}
                </div>
              </div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                {x.ai}
              </span>
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

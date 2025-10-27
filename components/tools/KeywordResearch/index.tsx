// components/tools/KeywordResearch/index.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  pickEasiestKeyword,
} from "./utils";
import { exportDashboardToPDF } from "./PdfReport";

export default function KeywordResearch() {
  const [query, setQuery] = useState("");
  // Store the whole dataset (this fixes the type error you saw)
  const [dataset, setDataset] = useState<Dataset>({ data: [], metrics: emptyMetrics() });
  const [previousMetrics, setPreviousMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [showTrend, setShowTrend] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // preload from URL ?q=
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
    // set previous for delta calc
    setPreviousMetrics(dataset.metrics);
    setDataset(result);
    setLastUpdated(Date.now());
    setHighlightId(null);
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

  // AI Insight button — find easiest keyword & highlight
  function handleAIInsight() {
    const best = pickEasiestKeyword(dataset.data);
    if (!best) return;
    setHighlightId(best.id);
    // scroll a bit to the lists
    document.getElementById("kw-lists")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const metrics = dataset.metrics;
  const blocks = dataset.data;

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
          <button className="h-10 px-4 rounded-xl bg-blue-600 text-white font-medium"
            onClick={() => handleGenerate()}>
            Generate
          </button>
          <button className="h-10 px-3 rounded-xl bg-emerald-600 text-white" onClick={handleAIInsight}>
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
          <button className="h-10 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-700"
            onClick={handleShare}>
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

      {/* Small controls under summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
            />
            Show trend deltas
          </label>
        </div>
      </div>

      {/* Charts */}
<MetricsCharts metrics={metrics} blocks={blocks} />

      {/* Keyword Lists */}
      <div id="kw-lists" className="pt-2">
        <KeywordList blocks={blocks} highlightId={highlightId} />
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

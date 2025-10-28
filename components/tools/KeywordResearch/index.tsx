// components/tools/KeywordResearch/index.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";

// MetricsCharts must be a default export from ./MetricsCharts
import MetricsCharts from "./MetricsCharts";
import SummaryBar from "./SummaryBar";
import KeywordList from "./KeywordList";
import { exportDashboardToPDF } from "./PdfReport";
import { exportDashboardToPNG } from "./PngReport";

// If your utils.ts does not export KeywordSourceBlock yet, keep this permissive alias.
// Later you can swap to:  type KeywordSourceBlock = import("./utils").KeywordSourceBlock;
type KeywordSourceBlock = any;

type Metrics = {
  total: number;
  avgDifficulty: number;
  navigational: number;
  transactional: number;
  informational: number;
  commercial: number;
  emc: number;
  health?: number;
};

export default function KeywordResearchPage() {
  // Top-bar state
  const [query, setQuery] = useState("car");
  const [brand, setBrand] = useState("ToolCite Hub");
  const [includeCover, setIncludeCover] = useState(true);
  const [autoLandscapePDF, setAutoLandscapePDF] = useState(true);
  const [shareNote, setShareNote] = useState<null | string>(null);

  // Filters / sliders
  const [minDiff, setMinDiff] = useState(0);
  const [maxDiff, setMaxDiff] = useState(100);

  // Root wrapper for export
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Placeholder metrics (replace with your real selectors)
  const metrics = useMemo<Metrics>(
    () => ({
      total: 29,
      avgDifficulty: 42,
      navigational: 13,
      transactional: 5,
      informational: 6,
      commercial: 5,
      emc: 828,
      health: 61,
    }),
    []
  );

  const previous: Metrics | null = null;

  const showingCount = useMemo(() => {
    // Replace with filtered length when wired
    return metrics.total - (minDiff === 0 && maxDiff === 100 ? 0 : 0);
  }, [metrics.total, minDiff, maxDiff]);

  const blocks = useMemo<KeywordSourceBlock[]>(() => ([] as KeywordSourceBlock[]), []);

  // Actions
  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    url.searchParams.set("ai", "1");
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareNote("Link copied!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url.toString();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setShareNote("Link copied!");
    } finally {
      setTimeout(() => setShareNote(null), 1200);
    }
  };

  const handleExportPDF = async () => {
    if (!rootRef.current) return;

    const cover =
      includeCover
        ? {
            title: `${brand} — Keyword Research (AI Dashboard)`,
            subtitle: `Seed: ${query} • ${new Date().toLocaleString()}`,
            bullets: [
              `KSI: ${Math.round(Math.sqrt(metrics.emc / Math.max(1, metrics.avgDifficulty)))}`,
              `Avg Difficulty: ${metrics.avgDifficulty}`,
              `Total Keywords: ${metrics.total}`,
              `Est. Monthly Clicks: ${metrics.emc}`,
              `Band: ${minDiff}–${maxDiff}`,
            ],
            watermark: "CONFIDENTIAL • INTERNAL",
          }
        : false;

    await exportDashboardToPDF(rootRef.current, {
      filename: "keyword-dashboard.pdf",
      brand,
      cover,
      autoLandscape: autoLandscapePDF,
      margin: 32,
    });
  };

  const handleExportPNG = async () => {
    if (!rootRef.current) return;
    await exportDashboardToPNG(rootRef.current, {
      filename: "keyword-dashboard.png",
      scale: Math.min(window.devicePixelRatio ?? 1.5, 2),
      quality: 0.92,
      bg: "#ffffff",
    });
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4">
      {/* Title + Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl md:text-3xl font-bold">
            Keyword Research <span className="opacity-60">— AI Dashboard</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="enter a seed keyword"
            className="h-9 rounded-lg border px-3 text-sm w-[180px] md:w-[220px]"
          />
          <button
            className="h-9 rounded-lg border px-3 text-sm bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => {
              /* hook your real Generate logic here */
            }}
          >
            Generate
          </button>

          {/* Export buttons */}
          <button
            className="h-9 rounded-lg border px-3 text-sm bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleExportPDF}
          >
            Export PDF
          </button>
          <button
            className="h-9 rounded-lg border px-3 text-sm bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={handleExportPNG}
          >
            Export PNG
          </button>

          {/* Share */}
          <button
            className="h-9 rounded-lg border px-3 text-sm bg-neutral-900 text-white hover:bg-black"
            onClick={handleShare}
            title="Copy shareable link"
          >
            Share Link
          </button>
          {shareNote && (
            <span className="text-xs text-emerald-600">{shareNote}</span>
          )}
        </div>
      </div>

      {/* Export options row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeCover}
            onChange={(e) => setIncludeCover(e.target.checked)}
          />
          Include Cover
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoLandscapePDF}
            onChange={(e) => setAutoLandscapePDF(e.target.checked)}
          />
          Auto Landscape
        </label>

        <div className="inline-flex items-center gap-2 text-sm">
          <span>Brand:</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-8 rounded-lg border px-2 text-sm w-[170px]"
            placeholder="Brand name"
          />
        </div>
      </div>

      {/* EXPORTABLE CONTENT */}
      <div ref={rootRef} className="space-y-6">
        {/* Summary / KPIs */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="Metrics & Health"
          aria-label="Metrics & Health"
        >
          <SummaryBar
            metrics={metrics as any}
            previous={previous as any}
            lastUpdated={Date.now()}
            showTrend={true}
            estClicks={metrics.emc}
            extraNote={`Band: ${minDiff}–${maxDiff} • Showing ${showingCount} of ${metrics.total}`}
          />
        </section>

        {/* Simulators (keep your real sliders inside) */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="Volume + CPC Simulator"
          aria-label="Volume + CPC Simulator"
        >
          <div className="rounded-2xl border p-4 bg-white/70 dark:bg-white/5">
            <div className="text-sm font-medium mb-2">Difficulty Filter</div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Min Difficulty</span>
                  <span>{minDiff}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minDiff}
                  onChange={(e) => setMinDiff(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Max Difficulty</span>
                  <span>{maxDiff}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={maxDiff}
                  onChange={(e) => setMaxDiff(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
              Band: <b>{minDiff}–{maxDiff}</b>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="Keywords by Intent & Avg Difficulty"
          aria-label="Keywords by Intent & Avg Difficulty"
        >
          
          <MetricsCharts metrics={metrics as any} blocks={blocks as any} />
        </section>

        {/* AI Insight (placeholder area) */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="AI Insight — Easiest Wins"
          aria-label="AI Insight — Easiest Wins"
        >
          <div className="rounded-2xl border p-4 bg-white/70 dark:bg-white/5">
            <div className="text-lg font-semibold mb-2">
              AI Insight — Easiest Wins
            </div>
            <div className="text-sm text-neutral-500">
              Click the “AI Insight” button in your top bar to populate this
              list after filters/slider changes.
            </div>
          </div>
        </section>

        {/* Source Cards */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="Source Cards"
          aria-label="Source Cards"
        >
          <KeywordList blocks={blocks} />
        </section>
      </div>
    </div>
  );
}

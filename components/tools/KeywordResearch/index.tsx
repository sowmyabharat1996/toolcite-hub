"use client";

import React, { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Recharts must be client-only to avoid SSR crash
const MetricsCharts = dynamic(() => import("./MetricsCharts"), { ssr: false });

import SummaryBar from "./SummaryBar";
import KeywordList from "./KeywordList";
import { exportDashboardToPDF } from "./PdfReport";
import { exportDashboardToPNG } from "./PngReport";

// ✅ Use the exact types from utils
import type {
  Metrics as KRMetrics,
  KeywordSourceBlock,
  Source,
} from "./utils";

export default function KeywordResearchPage() {
  // Top bar state
  const [query, setQuery] = useState("car");
  const [brand, setBrand] = useState("ToolCite Hub");
  const [includeCover, setIncludeCover] = useState(true);
  const [autoLandscapePDF, setAutoLandscapePDF] = useState(true);
  const [shareNote, setShareNote] = useState<null | string>(null);

  // Filters
  const [minDiff, setMinDiff] = useState(0);
  const [maxDiff, setMaxDiff] = useState(100);

  // Root for exports
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Demo metrics compatible with utils.Metrics
  const metrics = useMemo<KRMetrics>(
    () => ({
      total: 29,
      avgDifficulty: 42,
      byIntent: {
        Navigational: 13,
        Transactional: 5,
        Informational: 6,
        Commercial: 5,
      },
      health: 61, // treat this as your KSI
    }),
    []
  );

  // Simple placeholder until you wire the simulator
  const estClicks = 578;

  const previous: KRMetrics | null = null;

  // Demo blocks typed exactly as KeywordSourceBlock (source is a Source union)
  const blocks = useMemo<KeywordSourceBlock[]>(
    () => [
      { source: "Google" as Source, items: [] },
      { source: "YouTube" as Source, items: [] },
      { source: "Bing" as Source, items: [] },
      { source: "Amazon" as Source, items: [] },
    ],
    []
  );

  const showingCount = useMemo(
    () => metrics.total - (minDiff === 0 && maxDiff === 100 ? 0 : 0),
    [metrics.total, minDiff, maxDiff]
  );

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
              // ✅ KSI comes from metrics.health in your utils
              `KSI: ${metrics.health}`,
              `Avg Difficulty: ${metrics.avgDifficulty}`,
              `Total Keywords: ${metrics.total}`,
              `Est. Monthly Clicks: ${estClicks}`,
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
            onClick={() => { /* hook your Generate logic */ }}
          >
            Generate
          </button>

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

          <button
            className="h-9 rounded-lg border px-3 text-sm bg-neutral-900 text-white hover:bg-black"
            onClick={handleShare}
            title="Copy shareable link"
          >
            Share Link
          </button>
          {shareNote && <span className="text-xs text-emerald-600">{shareNote}</span>}
        </div>
      </div>

      {/* Export options */}
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
            // ✅ pass the separate estClicks number (no metrics.emc)
            estClicks={estClicks}
            extraNote={`Band: ${minDiff}–${maxDiff} • Showing ${showingCount} of ${metrics.total}`}
          />
        </section>

        {/* Simulators / Filters */}
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
                  <span>Min Difficulty</span><span>{minDiff}</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={minDiff}
                  onChange={(e) => setMinDiff(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Max Difficulty</span><span>{maxDiff}</span>
                </div>
                <input
                  type="range" min={0} max={100}
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

        {/* Charts (client-only) */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="Keywords by Intent & Avg Difficulty"
          aria-label="Keywords by Intent & Avg Difficulty"
        >
          <MetricsCharts metrics={metrics} blocks={blocks} />
        </section>

        {/* AI Insight placeholder */}
        <section
          className="export-section"
          data-export="section"
          data-export-title="AI Insight — Easiest Wins"
          aria-label="AI Insight — Easiest Wins"
        >
          <div className="rounded-2xl border p-4 bg-white/70 dark:bg-white/5">
            <div className="text-lg font-semibold mb-2">AI Insight — Easiest Wins</div>
            <div className="text-sm text-neutral-500">
              Click the “AI Insight” button in your top bar to populate this list.
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
          <KeywordList blocks={blocks as any} />
        </section>
      </div>
    </div>
  );
}

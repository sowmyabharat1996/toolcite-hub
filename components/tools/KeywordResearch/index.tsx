// components/tools/KeywordResearch/index.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import SummaryBar from "./SummaryBar";
import MetricsCharts from "./MetricsCharts";
import KeywordList from "./KeywordList";
import {
  Dataset, KeywordSourceBlock, Metrics,
  generateMockData, computeMetrics, toCSV, shareURLFromSeed,
  runAIInsight, applyVolumeCPCSimulation, downloadBlob, KeywordItem, explainPick
} from "./utils";
import { exportDashboardToPDF } from "./PdfReport";

export default function KeywordResearch() {
  const [query, setQuery] = useState("");
  const [dataset, setDataset] = useState<Dataset>({ data: [], metrics: emptyMetrics() });
  const [previousMetrics, setPreviousMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [showTrend, setShowTrend] = useState(true);

  const [insights, setInsights] = useState<Array<KeywordItem & { reasons?: string[] }>>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [sortByAI, setSortByAI] = useState(false);

  const [volSim, setVolSim] = useState(50);
  const [cpcSim, setCpcSim] = useState(50);
  const [estClicks, setEstClicks] = useState(0);

  const [baseBlocks, setBaseBlocks] = useState<KeywordSourceBlock[]>([]);
  const [trendColor, setTrendColor] = useState<string>("#3b82f6");

  const rootRef = useRef<HTMLDivElement>(null);

  // seed from URL
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) { setQuery(q); handleGenerate(q); }
  }, []);

  // sort toggle persistence
  useEffect(() => {
    const stored = localStorage.getItem("sortByAI");
    if (stored === "true") setSortByAI(true);
  }, []);
  useEffect(() => { localStorage.setItem("sortByAI", sortByAI ? "true" : "false"); }, [sortByAI]);

  // mood color
  useEffect(() => {
    if (!previousMetrics) return;
    const delta = dataset.metrics.health - previousMetrics.health;
    if (Math.abs(delta) < 1) setTrendColor("#3b82f6");
    else if (delta > 0) setTrendColor("#22c55e");
    else setTrendColor("#ef4444");
  }, [dataset.metrics.health, previousMetrics]);

  function handleGenerate(q?: string) {
    const seed = (q ?? query).trim() || "keyword";
    const result = generateMockData(seed);
    setPreviousMetrics(dataset.metrics);
    setBaseBlocks(result.data);

    const sim = applyVolumeCPCSimulation(result.data, volSim, cpcSim);
    const metrics = computeMetrics(sim.blocks);
    const { top3, scores } = runAIInsight(sim.blocks);
    const scoredBlocks = sim.blocks.map((b) => ({
      ...b, items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
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
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "keywords.csv");
  }

  function handleShare() { navigator.clipboard.writeText(shareURLFromSeed(query || "keyword")); }

  async function handleExportPDF() {
    if (!rootRef.current) return;
    await exportDashboardToPDF(rootRef.current, "keyword-dashboard.pdf");
  }

  function handleAIInsight() {
    const { top3, scores } = runAIInsight(dataset.data);
    const scoredBlocks = dataset.data.map((b) => ({
      ...b, items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));
    setDataset({ data: scoredBlocks, metrics: computeMetrics(scoredBlocks) });
    setInsights(top3.map((t) => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(top3[0]?.id ?? null);
    document.getElementById("insights-panel")?.scrollIntoView({ behavior: "smooth" });
    setLastUpdated(Date.now());
  }

  function applySim(vol: number, cpc: number) {
    if (!baseBlocks.length) return;
    const sim = applyVolumeCPCSimulation(baseBlocks, vol, cpc);
    const metrics = computeMetrics(sim.blocks);
    const { top3, scores } = runAIInsight(sim.blocks);
    const scoredBlocks = sim.blocks.map((b) => ({
      ...b, items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));
    setDataset({ data: scoredBlocks, metrics });
    setInsights(top3.map((t) => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(top3[0]?.id ?? null);
    setEstClicks(sim.estClicks);
    setLastUpdated(Date.now());
  }
  const onVol = (e: React.ChangeEvent<HTMLInputElement>) => { const v = +e.target.value; setVolSim(v); applySim(v, cpcSim); };
  const onCpc = (e: React.ChangeEvent<HTMLInputElement>) => { const v = +e.target.value; setCpcSim(v); applySim(volSim, v); };

  const sortedBlocks = sortByAI
    ? dataset.data.map((b) => ({ ...b, items: [...b.items].sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0)) }))
    : dataset.data;

  const moodBG: React.CSSProperties = {
    background: `
      radial-gradient(1200px 700px at 10% -10%, ${trendColor}12, transparent 60%),
      radial-gradient(1200px 700px at 110% 110%, ${trendColor}10, transparent 60%)
    `,
    transition: "background 700ms ease",
  };

  const { metrics } = dataset;

  return (
    <div className="relative min-h-[100vh] overflow-visible">
      {/* Subtle page wash, plus export-mode CSS fixes */}
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none" style={moodBG} />
      <style jsx global>{`
        /* Prevent sticky from creating huge white gaps during export */
        [data-export-paused="1"] .sticky { position: static !important; top: auto !important; }
        /* Make sure nested wrappers don't clip portaled tooltips */
        #__next, body, html { overflow: visible !important; }
      `}</style>

      <div ref={rootRef} className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 overflow-visible">
        {/* Header & controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">🔎 Keyword Research (AI Dashboard)</h1>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? handleGenerate() : null)}
              placeholder="e.g. ai tools for students"
              className="h-10 w-64 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-white/5 px-3"
            />
            <button className="h-10 px-4 rounded-xl bg-blue-600 text-white font-medium" onClick={() => handleGenerate()}>
              Generate
            </button>
            <button className="h-10 px-3 rounded-xl bg-emerald-600 text-white" onClick={handleAIInsight}>🤖 AI Insight</button>
            <button className="h-10 px-3 rounded-xl bg-neutral-800 text-white" onClick={handleCopyAll}>Copy All</button>
            <button className="h-10 px-3 rounded-xl bg-purple-600 text-white" onClick={handleExportCSV}>Export CSV</button>
            <button className="h-10 px-3 rounded-xl bg-amber-600 text-white" onClick={handleExportPDF}>Export PDF</button>
            <button className="h-10 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-700" onClick={handleShare}>Share Link</button>
          </div>
        </div>

        {/* Summary */}
        <div data-export="section">
          <SummaryBar metrics={metrics} previous={previousMetrics} lastUpdated={lastUpdated} showTrend={showTrend} estClicks={estClicks} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
            <input type="checkbox" className="accent-blue-600" checked={showTrend} onChange={(e) => setShowTrend(e.target.checked)} />
            Show trend deltas
          </label>
          <label className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
            <input type="checkbox" className="accent-emerald-600" checked={sortByAI} onChange={(e) => setSortByAI(e.target.checked)} />
            Sort / Highlight by AI Score
          </label>
        </div>

        {/* Simulator */}
        <div data-export="section" className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-4 overflow-visible">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Volume + CPC Simulator</div>
            <div className="text-xs text-neutral-500">Adjust sliders → AI Picks &amp; KSI update live</div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span>Assumed Avg Volume (scales all rows)</span><strong>{volSim}</strong>
              </div>
              <input type="range" min={0} max={100} value={volSim} onChange={onVol} className="w-full accent-sky-600" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span>Assumed Avg CPC (scales all rows)</span><strong>{cpcSim}</strong>
              </div>
              <input type="range" min={0} max={100} value={cpcSim} onChange={onCpc} className="w-full accent-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-sm">
              <span>🟢 Est. Monthly Clicks</span>
              <strong className="text-emerald-700 dark:text-emerald-300">{estClicks.toLocaleString()}</strong>
              <span className="text-xs text-neutral-500">toy model: Σ(vol × (1–diff%))</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div data-export="section">
          <MetricsCharts metrics={metrics} blocks={sortedBlocks} />
        </div>

        {/* AI Insight panel */}
        <aside data-export="section" id="insights-panel" className="rounded-2xl border p-4 overflow-visible"
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
            <h3 className="font-semibold text-lg" style={{ color: trendColor }}>AI Insight — Easiest Wins</h3>
            <span className="text-xs font-medium" style={{ color: trendColor }}>Click again after changing data/filters</span>
          </div>
          <ul className="space-y-3">
            {insights.map((x, i) => (
              <li key={x.id} className="rounded-xl border bg-white/70 dark:bg-white/10 p-3" style={{ borderColor: trendColor + "4d" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                            style={{ backgroundColor: trendColor + "22", color: trendColor }}>{i + 1}</span>
                      <div className="truncate font-medium">{x.phrase}</div>
                    </div>
                    <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
                      diff {x.difficulty} • {x.intent} • vol {x.volume ?? "—"} • cpc {x.cpc ?? "—"}
                    </div>
                    {x.reasons && x.reasons.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Why this pick?</div>
                        <ul className="mt-1 ml-4 list-disc text-xs text-neutral-600 dark:text-neutral-300 space-y-0.5">
                          {x.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold" style={{ color: trendColor }}>{x.ai}</div>
                  </div>
                </div>
              </li>
            ))}
            {!insights.length && <li className="text-sm text-neutral-600 dark:text-neutral-300">Click “AI Insight” to score and see Top-3 easiest keywords.</li>}
          </ul>
        </aside>

        {/* Keyword Lists */}
        <div data-export="section" id="kw-lists" className="pt-2 overflow-visible">
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
    byIntent: { Navigational: 0, Transactional: 0, Informational: 0, Commercial: 0 },
    health: 0,
  };
}

// components/tools/KeywordResearch/index.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SummaryBar from "./SummaryBar";
import MetricsCharts from "./MetricsCharts";
import KeywordList from "./KeywordList";
import {
  Dataset, KeywordSourceBlock, Metrics, KeywordItem,
  generateMockData, toCSV, shareURLFromSeed, downloadBlob,
  recomputeAll, explainPick, runAIInsight, computeMetricsAdvanced
} from "./utils";
import { exportDashboardToPDF } from "./PdfReport";

type SessionSnapshot = {
  id: string;
  ts: number;
  seed: string;
  volSim: number;
  cpcSim: number;
  minDiff: number;
  maxDiff: number;
  textFilter: string;
  chips: string[];
  metrics: Metrics;
  estClicks: number;
  top3: Array<KeywordItem & { reasons?: string[] }>;
  base: KeywordSourceBlock[];
};

const SESS_KEY = "kr:sessions:v3";
const MAX_SESSIONS = 5;

function loadSessions(): SessionSnapshot[] {
  try { return JSON.parse(localStorage.getItem(SESS_KEY) || "[]"); } catch { return []; }
}
function saveSessions(list: SessionSnapshot[]) {
  try { localStorage.setItem(SESS_KEY, JSON.stringify(list.slice(0, MAX_SESSIONS))); } catch {}
}
function upsertSession(s: SessionSnapshot) {
  const list = loadSessions().filter(x => x.id !== s.id);
  saveSessions([s, ...list].slice(0, MAX_SESSIONS));
}
function makeId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function formatTime(ts: number) {
  const d = new Date(ts); const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CHIP_CATALOG = ["best","vs","review","price","guide","cheap","free","tool"] as const;

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

  // Difficulty filter
  const [minDiff, setMinDiff] = useState<number>(() => Number(localStorage.getItem("dfMin") ?? 0));
  const [maxDiff, setMaxDiff] = useState<number>(() => Number(localStorage.getItem("dfMax") ?? 100));
  const [totalBefore, setTotalBefore] = useState(0);
  const [totalAfter, setTotalAfter] = useState(0);

  // Search in results + chips
  const [textFilter, setTextFilter] = useState("");
  const [chips, setChips] = useState<string[]>([]);

  const [baseBlocks, setBaseBlocks] = useState<KeywordSourceBlock[]>([]);
  const [trendColor, setTrendColor] = useState<string>("#3b82f6");

  // History / compare
  const [history, setHistory] = useState<SessionSnapshot[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compareWith, setCompareWith] = useState<SessionSnapshot | null>(null);

  // Share copied flag
  const [copied, setCopied] = useState(false);

  // Refs
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const debounceTextRef = useRef<number | null>(null);
  const historyBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);

  // Init
  useEffect(() => {
    setHistory(loadSessions());
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q") || "";
    const df = sp.get("df");
    if (df) {
      const [a,b] = df.split("-").map(n => Math.max(0, Math.min(100, Number(n))));
      if (!Number.isNaN(a) && !Number.isNaN(b)) { setMinDiff(Math.min(a, b)); setMaxDiff(Math.max(a, b)); }
    }
    const v = sp.get("vol"), c = sp.get("cpc"), ai = sp.get("ai");
    if (v) setVolSim(Math.max(0, Math.min(100, Number(v))));
    if (c) setCpcSim(Math.max(0, Math.min(100, Number(c))));
    if (ai === "1") setSortByAI(true);
    const qf = sp.get("qf"); if (qf) setTextFilter(qf);
    const ch = sp.get("chips"); if (ch) setChips(ch.split(".").filter(Boolean));

    if (q) { setQuery(q); handleGenerate(q, { initial: true }); }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sortByAI");
    if (stored === "true") setSortByAI(true);
  }, []);
  useEffect(() => { localStorage.setItem("sortByAI", sortByAI ? "true" : "false"); }, [sortByAI]);
  useEffect(() => { localStorage.setItem("dfMin", String(minDiff)); localStorage.setItem("dfMax", String(maxDiff)); }, [minDiff, maxDiff]);

  // Position dropdown
  useEffect(() => {
    function compute() {
      if (!historyOpen || !historyBtnRef.current) return;
      const r = historyBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 8, left: r.right - 340, width: 340 });
    }
    compute();
    if (!historyOpen) return;
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, { passive: true });
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
    };
  }, [historyOpen]);

  // Mood color update
  useEffect(() => {
    if (!previousMetrics) return;
    const delta = dataset.metrics.health - previousMetrics.health;
    if (Math.abs(delta) < 1) setTrendColor("#3b82f6");
    else if (delta > 0) setTrendColor("#22c55e");
    else setTrendColor("#ef4444");
  }, [dataset.metrics.health, previousMetrics]);

  // Snapshot for history
  function snapshotCurrent(seedForSave?: string): SessionSnapshot | null {
    if (!baseBlocks.length) return null;
    return {
      id: makeId(), ts: Date.now(),
      seed: seedForSave ?? (query.trim() || "keyword"),
      volSim, cpcSim, minDiff, maxDiff, textFilter, chips,
      metrics: dataset.metrics, estClicks, top3: insights, base: baseBlocks,
    };
  }

  // Pipeline
  function applyPipeline(v: number, c: number, d0: number, d1: number, tf: string, ch: string[]) {
    if (!baseBlocks.length) return;
    const next = recomputeAll(baseBlocks, v, c, d0, d1, tf, ch);
    setDataset({ data: next.blocks, metrics: next.metrics });
    setInsights(next.top3.map(t => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(next.top3[0]?.id ?? null);
    setEstClicks(next.estClicks);
    setTotalBefore(next.totalBefore);
    setTotalAfter(next.totalAfter);
    setLastUpdated(Date.now());
  }

  function schedule(v: number, c: number, d0: number, d1: number, tf: string, ch: string[]) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      applyPipeline(v, c, d0, d1, tf, ch);
      debounceRef.current = null;
    }, 120);
  }

  // Generate
  function handleGenerate(q?: string, opts?: { initial?: boolean }) {
    const seed = (q ?? query).trim() || "keyword";
    const result = generateMockData(seed);
    setPreviousMetrics(dataset.metrics);
    setBaseBlocks(result.data);

    const next = recomputeAll(result.data, volSim, cpcSim, minDiff, maxDiff, textFilter, chips);
    setDataset({ data: next.blocks, metrics: next.metrics });
    setInsights(next.top3.map(t => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(next.top3[0]?.id ?? null);
    setEstClicks(next.estClicks);
    setTotalBefore(next.totalBefore);
    setTotalAfter(next.totalAfter);
    setLastUpdated(Date.now());

    if (!opts?.initial) {
      const snap: SessionSnapshot = {
        id: makeId(), ts: Date.now(), seed, volSim, cpcSim, minDiff, maxDiff,
        textFilter, chips, metrics: next.metrics, estClicks: next.estClicks, top3: next.top3, base: result.data,
      };
      upsertSession(snap);
      setHistory(loadSessions());
    }
  }

  // Restore
  function restoreSession(s: SessionSnapshot) {
    setQuery(s.seed);
    setVolSim(s.volSim);
    setCpcSim(s.cpcSim);
    setMinDiff(s.minDiff);
    setMaxDiff(s.maxDiff);
    setTextFilter(s.textFilter);
    setChips(s.chips);
    setBaseBlocks(s.base);
    applyPipeline(s.volSim, s.cpcSim, s.minDiff, s.maxDiff, s.textFilter, s.chips);
  }

  // Sliders
  const onVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value; setVolSim(v);
    schedule(v, cpcSim, minDiff, maxDiff, textFilter, chips);
  };
  const onCpc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value; setCpcSim(v);
    schedule(volSim, v, minDiff, maxDiff, textFilter, chips);
  };
  const onMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value; const nv = Math.min(v, maxDiff);
    setMinDiff(nv); schedule(volSim, cpcSim, nv, maxDiff, textFilter, chips);
  };
  const onMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value; const nv = Math.max(v, minDiff);
    setMaxDiff(nv); schedule(volSim, cpcSim, minDiff, nv, textFilter, chips);
  };

  // Text filter (debounced)
  const onText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTextFilter(v);
    if (debounceTextRef.current) clearTimeout(debounceTextRef.current);
    debounceTextRef.current = window.setTimeout(() => {
      applyPipeline(volSim, cpcSim, minDiff, maxDiff, v, chips);
    }, 150);
  };

  // Chips
  function toggleChip(tag: string) {
    const exists = chips.includes(tag);
    const next = exists ? chips.filter(c => c !== tag) : [...chips, tag];
    setChips(next);
    schedule(volSim, cpcSim, minDiff, maxDiff, textFilter, next);
  }

  // Clear Filters (PATCH #1 & #2)
  function clearAllFilters() {
    const v = volSim, c = cpcSim;
    setTextFilter("");
    setChips([]);
    setMinDiff(0);
    setMaxDiff(100);
    applyPipeline(v, c, 0, 100, "", []);
  }

  // Actions
  function handleCopyAll() {
    const flat = dataset.data.flatMap((b) => b.items.map((k) => k.phrase)).join("\n");
    navigator.clipboard.writeText(flat);
  }
  function handleExportCSV() {
    const csv = toCSV(dataset.data);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "keywords.csv");
  }
  async function handleShare() {
    const url = shareURLFromSeed(query || "keyword", {
      df: [minDiff, maxDiff],
      vol: volSim,
      cpc: cpcSim,
      sortAI: sortByAI,
      text: textFilter,
      chips,
    });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }
  async function handleExportPDF() {
    if (!rootRef.current) return;
    await exportDashboardToPDF(rootRef.current, "keyword-dashboard.pdf");
  }
  function handleSaveSession() {
    const snap = snapshotCurrent();
    if (!snap) return;
    upsertSession(snap);
    setHistory(loadSessions());
  }

  // Compare
  function startCompare(s: SessionSnapshot) {
    setCompareWith(s);
    setHistoryOpen(false);
    setTimeout(() => { compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 0);
  }

  // AI Insight (PATCH #3 disables when empty via button prop)
  function handleAIInsight() {
    if (!dataset.data.length || totalAfter === 0) return;
    const { top3, scores } = runAIInsight(dataset.data);
    const scoredBlocks = dataset.data.map((b) => ({
      ...b, items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
    }));
    setDataset({ data: scoredBlocks, metrics: computeMetricsAdvanced(scoredBlocks) });
    setInsights(top3.map((t) => ({ ...t, reasons: explainPick(t) })));
    setHighlightId(top3[0]?.id ?? null);
    document.getElementById("insights-panel")?.scrollIntoView({ behavior: "smooth" });
    setLastUpdated(Date.now());
  }

  // Sorted
  const sortedBlocks = sortByAI
    ? dataset.data.map((b) => ({ ...b, items: [...b.items].sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0)) }))
    : dataset.data;

  const moodBG: React.CSSProperties = {
    background: `radial-gradient(1200px 700px at 10% -10%, ${trendColor}12, transparent 60%), radial-gradient(1200px 700px at 110% 110%, ${trendColor}10, transparent 60%)`,
    transition: "background 700ms ease",
  };

  return (
    <div className="relative min-h-[100vh] overflow-visible">
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none" style={moodBG} />
      <style jsx global>{`
        [data-export-paused="1"] .sticky { position: static !important; top: auto !important; }
        #__next, body, html { overflow: visible !important; }
      `}</style>

      <div ref={rootRef} className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 overflow-visible">
        {/* Header */}
        <div className="flex flex-wrap gap-2 items-center [isolation:isolate]">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">🔎 Keyword Research (AI Dashboard)</h1>
          <div className="flex flex-wrap gap-2 items-center">
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
            <button className="h-10 px-3 rounded-xl bg-emerald-600 text-white" onClick={handleSaveSession}>Save Session</button>

            {/* History */}
            <div className="relative">
              <button
                ref={historyBtnRef}
                className="h-10 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-700"
                onClick={() => setHistoryOpen(v => !v)}
              >
                History ▾
              </button>
              {historyOpen && historyBtnRef.current && createPortal(
                <div
                  className="fixed z-[99999] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-2 space-y-1 pointer-events-auto"
                  style={{
                    top: historyBtnRef.current.getBoundingClientRect().bottom + 8,
                    left: Math.max(8, historyBtnRef.current.getBoundingClientRect().right - 340),
                    width: 340
                  }}
                  role="menu"
                >
                  {history.length === 0 && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-300 p-2">No sessions yet. Click <b>Generate</b> or <b>Save Session</b>.</div>
                  )}
                  {history.map((s) => (
                    <div key={s.id} className="rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <div className="text-sm font-medium truncate">{s.seed}</div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span>{formatTime(s.ts)}</span>
                        <span>• Vol {s.volSim}</span>
                        <span>• CPC {s.cpcSim}</span>
                        <span>• KSI {s.metrics.health}</span>
                        <span>• EMC {s.estClicks}</span>
                        <span>• DF {s.minDiff}-{s.maxDiff}</span>
                        {(s.textFilter || s.chips.length) && <span>• Filter</span>}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs" onClick={() => { restoreSession(s); setHistoryOpen(false); }}>
                          Restore
                        </button>
                        <button className="px-2 py-1 rounded-md bg-amber-600 text-white text-xs" onClick={() => { setHistoryOpen(false); startCompare(s); }}>
                          Compare
                        </button>
                      </div>
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>

            <button className="h-10 px-3 rounded-xl bg-neutral-800 text-white" onClick={handleCopyAll}>Copy All</button>
            <button className="h-10 px-3 rounded-xl bg-purple-600 text-white" onClick={handleExportCSV}>Export CSV</button>
            <button className="h-10 px-3 rounded-xl bg-amber-600 text-white" onClick={handleExportPDF}>Export PDF</button>
            <button className="h-10 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-700" onClick={handleShare}>
              {copied ? "✅ Copied" : "Share Link"}
            </button>
            {/* PATCH #3: disabled when totalAfter === 0 */}
            <button
              className="h-10 px-3 rounded-xl bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAIInsight}
              disabled={totalAfter === 0}
              title={totalAfter === 0 ? "No keywords in view — widen band or clear filters" : "Score & pick easiest keywords"}
            >
              🤖 AI Insight
            </button>
          </div>
        </div>

        {/* Summary */}
        <div data-export="section">
          <SummaryBar metrics={dataset.metrics} previous={previousMetrics} lastUpdated={lastUpdated} showTrend={showTrend} estClicks={estClicks} />
        </div>

        {/* Compare panel */}
        {compareWith && (
          <div ref={compareRef} className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/10 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">
                Compare with: <span className="font-medium">{compareWith.seed}</span>{" "}
                <span className="text-xs text-neutral-500">({formatTime(compareWith.ts)})</span>
              </div>
              <button className="text-xs px-2 py-1 rounded-md bg-sky-600 text-white" onClick={() => setCompareWith(null)}>Clear</button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              {[
                { label: "EMC", cur: estClicks, old: compareWith.estClicks, fmt: (n:number)=>n.toLocaleString() },
                { label: "KSI", cur: dataset.metrics.health, old: compareWith.metrics.health, fmt: (n:number)=>n },
                { label: "Avg Difficulty", cur: dataset.metrics.avgDifficulty, old: compareWith.metrics.avgDifficulty, fmt: (n:number)=>n },
                { label: "Total Keywords", cur: totalAfter, old: compareWith.metrics.total, fmt: (n:number)=>n },
              ].map((k) => {
                const delta = k.cur - (k.old as number);
                const good = (k.label === "Avg Difficulty") ? delta < 0 : delta > 0;
                const color = delta === 0 ? "text-neutral-600" : good ? "text-emerald-600" : "text-rose-600";
                const sign = delta > 0 ? "+" : "";
                return (
                  <div key={k.label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-3">
                    <div className="text-xs text-neutral-500">{k.label}</div>
                    <div className="mt-1 text-lg font-semibold">{k.fmt(k.cur)}</div>
                    <div className={`text-xs ${color}`}>{sign}{delta === 0 ? "0" : k.fmt(delta as any)} vs history</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggles */}
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

        {/* Simulator + Difficulty + Search & Chips */}
        <div data-export="section" className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-4 overflow-visible">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Volume + CPC Simulator</div>
            {/* PATCH #4: graceful when empty */}
            <div className="text-xs text-neutral-500">KSI now: <b>{totalAfter === 0 ? "—" : dataset.metrics.health}</b></div>
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

          {/* Difficulty Filter */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">
                Difficulty Filter <span className="ml-2 rounded-md px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800">Band: {minDiff}–{maxDiff}</span>
              </div>
              <div className="text-xs text-neutral-500">Showing {totalAfter} of {totalBefore} keywords</div>
            </div>
            <div className="mt-2 relative h-3 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg,#22c55e 0%,#f59e0b 60%,#ef4444 100%)" }}>
              <div className="absolute top-0 bottom-0 bg-white/30 border border-white/60" style={{ left: `${minDiff}%`, width: `${Math.max(0, maxDiff - minDiff)}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                  <span>Min Difficulty</span><strong>{minDiff}</strong>
                </div>
                <input type="range" min={0} max={100} value={minDiff} onChange={onMin} className="w-full accent-emerald-600" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                  <span>Max Difficulty</span><strong>{maxDiff}</strong>
                </div>
                <input type="range" min={0} max={100} value={maxDiff} onChange={onMax} className="w-full accent-rose-600" />
              </div>
            </div>
          </div>

          {/* Search in results + Chips + PATCH #2 Clear button */}
          <div className="mt-6">
            <div className="text-sm font-semibold">Search in results</div>

            <div className="mt-2 flex items-center justify-between">
              <input
                value={textFilter}
                onChange={onText}
                placeholder="Filter inside current results, e.g. 'best', '2025', 'review'"
                className="h-10 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-white/5 px-3"
              />
              <button
                onClick={clearAllFilters}
                className="ml-2 shrink-0 h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
                title="Reset text/chips and difficulty band to defaults"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {CHIP_CATALOG.map((tag) => {
                const active = chips.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleChip(tag)}
                    className={
                      "px-3 py-1 rounded-full text-xs border " +
                      (active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20"
                        : "border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-200")
                    }
                  >
                    {active ? "✓ " : ""}{tag}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">Filters affect AI Top-3, charts, and KSI.</div>
          </div>

          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-sm">
              <span>🟢 Est. Monthly Clicks</span>
              <strong className="text-emerald-700 dark:text-emerald-300">{estClicks.toLocaleString()}</strong>
              <span className="text-xs text-neutral-500">proxy: Σ(vol × CTR(difficulty))</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div data-export="section">
          <MetricsCharts metrics={dataset.metrics} blocks={sortedBlocks} />
        </div>

        {/* AI Insight */}
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
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: trendColor + "22", color: trendColor }}>{i + 1}</span>
                      <div className="truncate font-medium">{x.phrase}</div>
                    </div>
                    <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">diff {x.difficulty} • {x.intent} • vol {x.volume ?? "—"} • cpc {x.cpc ?? "—"}</div>
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
            {!insights.length && (
              <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-white/10 p-4 text-sm text-neutral-600 dark:text-neutral-300">
                No keywords match this filter/band. Clear filters or widen the difficulty range.
              </li>
            )}
          </ul>
        </aside>

        {/* Keyword Lists */}
        <div data-export="section" id="kw-lists" className="pt-2 overflow-visible">
          {totalAfter === 0 ? (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-6 text-sm text-neutral-600 dark:text-neutral-300">
              No results to display for current filters. Try clearing text/chips or widening the difficulty band.
            </div>
          ) : (
            <KeywordList blocks={sortedBlocks} highlightId={highlightId} />
          )}
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

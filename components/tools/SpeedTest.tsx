"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Result = {
  url: string;
  timestamp: string;
  dns: number;
  connect: number;
  ttfb: number;
  domLoad: number;
  totalLoad: number;
  fetchTime: number;
};

export default function SpeedTest() {
  // ---------- base state ----------
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resultA, setResultA] = useState<Result | null>(null);
  const [resultB, setResultB] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  // offline banner
  const [online, setOnline] = useState(true);

  // guard for SSR
  const isClient = typeof window !== "undefined";

  // ---------- load history + decode URL on mount ----------
  useEffect(() => {
    if (!isClient) return;

    // load history (safe)
    const saved = window.localStorage.getItem("speedTestHistory");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // ignore
      }
    }

    // read URL params
    const sp = new URLSearchParams(window.location.search);
    const a = sp.get("a");
    const b = sp.get("b");
    const cmp = sp.get("compare");

    if (a) setUrlA(a);
    if (b) {
      setUrlB(b);
      setCompareMode(true);
    }
    if (cmp === "1") setCompareMode(true);

    // online/offline listeners
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(window.navigator.onLine);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [isClient]);

  // ---------- write URL when user edits ----------
  useEffect(() => {
    if (!isClient) return;
    const sp = new URLSearchParams(window.location.search);
    if (urlA) sp.set("a", urlA);
    else sp.delete("a");

    if (urlB) sp.set("b", urlB);
    else sp.delete("b");

    if (compareMode) sp.set("compare", "1");
    else sp.delete("compare");

    const next = window.location.pathname + "?" + sp.toString();
    window.history.replaceState(null, "", next);
  }, [isClient, urlA, urlB, compareMode]);

  // ---------- helpers ----------
  function saveHistory(newResult: Result) {
    const updated = [newResult, ...(history || [])].slice(0, 5);
    setHistory(updated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("speedTestHistory", JSON.stringify(updated));
    }
  }

  async function runTestFor(url: string): Promise<Result | null> {
    try {
      let testUrl = url.trim();
      if (!/^https?:\/\//i.test(testUrl)) testUrl = "https://" + testUrl;

      // clear previous timings to reduce noise
      if (typeof performance !== "undefined") {
        performance.clearResourceTimings?.();
      }

      const t0 = performance.now();
      await fetch(testUrl, { mode: "no-cors" });
      const t1 = performance.now();

      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const res = performance.getEntriesByName(testUrl)[0] as
        | PerformanceResourceTiming
        | undefined;

      const dns =
        res?.domainLookupEnd && res?.domainLookupStart
          ? res.domainLookupEnd - res.domainLookupStart
          : nav
          ? nav.domainLookupEnd - nav.domainLookupStart
          : 0;

      const connect =
        res?.connectEnd && res?.connectStart
          ? res.connectEnd - res.connectStart
          : nav
          ? nav.connectEnd - nav.connectStart
          : 0;

      const ttfb =
        res?.responseStart && res?.requestStart
          ? res.responseStart - res.requestStart
          : nav
          ? nav.responseStart - nav.requestStart
          : (t1 - t0) / 4;

      const domLoad =
        nav?.domContentLoadedEventEnd && nav?.startTime !== undefined
          ? nav.domContentLoadedEventEnd - nav.startTime
          : 0;

      const totalLoad =
        nav?.loadEventEnd && nav?.startTime !== undefined
          ? nav.loadEventEnd - nav.startTime
          : t1 - t0;

      return {
        url: testUrl,
        timestamp: new Date().toLocaleTimeString(),
        dns,
        connect,
        ttfb,
        domLoad,
        totalLoad,
        fetchTime: t1 - t0,
      };
    } catch {
      return null;
    }
  }

  async function runTest() {
    if (!urlA) {
      setError("Please enter a valid URL.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultA(null);
    setResultB(null);

    const resA = await runTestFor(urlA);
    if (resA) {
      setResultA(resA);
      saveHistory(resA);
    } else {
      setError("Could not test that URL from your browser.");
    }

    setLoading(false);
  }

  async function runCompareTest() {
    if (!urlA || !urlB) {
      setError("Please enter both URLs to compare.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultA(null);
    setResultB(null);

    const [resA, resB] = await Promise.all([runTestFor(urlA), runTestFor(urlB)]);

    setResultA(resA);
    setResultB(resB);

    if (!resA && !resB) setError("Could not test these URLs from your browser.");

    if (resA) saveHistory(resA);
    if (resB) saveHistory(resB);

    setLoading(false);
  }

  function formatMs(ms: number | undefined) {
    if (!ms || ms < 0) return "–";
    return `${ms.toFixed(0)} ms`;
  }

  // share current state
  async function shareCurrent() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Website Speed Test", url });
        return;
      }
    } catch {
      // fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard.");
    } catch {
      alert("Unable to share. Copy the URL from the address bar.");
    }
  }

  // export JSON
  function exportJSON() {
    const payload = {
      generatedAt: new Date().toISOString(),
      mode: compareMode ? "compare" : "single",
      resultA,
      resultB,
      history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const dl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dl;
    a.download = "website-speed-test.json";
    a.click();
    URL.revokeObjectURL(dl);
  }

  const connection =
    (typeof navigator !== "undefined" && (navigator as any).connection) || {};

  const compareData =
    resultA && resultB
      ? [
          { metric: "DNS Lookup", siteA: resultA.dns, siteB: resultB.dns },
          { metric: "TTFB", siteA: resultA.ttfb, siteB: resultB.ttfb },
          { metric: "DOM Load", siteA: resultA.domLoad, siteB: resultB.domLoad },
          { metric: "Total Load", siteA: resultA.totalLoad, siteB: resultB.totalLoad },
          { metric: "Fetch Time", siteA: resultA.fetchTime, siteB: resultB.fetchTime },
        ]
      : [];

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* offline banner */}
      {!online && (
        <div className="mb-3 rounded-md bg-yellow-100 text-yellow-900 text-xs px-3 py-2">
          Offline: tests may fail for remote sites; your local history is still saved.
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">
        Website Speed Test – Free Online Tool
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Analyze website load performance, TTFB, and connection metrics — all measured
        locally in your browser.
      </p>

      {/* Compare Mode Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={() => setCompareMode((v) => !v)}
            aria-label="Enable compare mode"
          />
          <span className="text-sm font-medium">🔄 Enable Compare Mode</span>
        </label>
      </div>

      {/* Inputs */}
      <div
        className={`grid gap-3 ${
          compareMode ? "sm:grid-cols-2" : "sm:grid-cols-1"
        } mb-4`}
      >
        <input
          type="text"
          placeholder="https://example.com"
          aria-label="Primary website URL"
          value={urlA}
          onChange={(e) => setUrlA(e.target.value)}
          className="px-4 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
        />
        {compareMode && (
          <input
            type="text"
            placeholder="https://compare.com"
            aria-label="Compare website URL"
            value={urlB}
            onChange={(e) => setUrlB(e.target.value)}
            className="px-4 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
          />
        )}
      </div>

      {/* action buttons */}
      <div className="flex flex-wrap gap-3 mb-3">
        <button
          onClick={compareMode ? runCompareTest : runTest}
          disabled={loading || !urlA || (compareMode && !urlB)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : compareMode ? "Run Comparison" : "Run Test"}
        </button>

        {(resultA || resultB) && (
          <>
            <button
              onClick={exportJSON}
              className="px-4 py-2 bg-white/80 dark:bg-neutral-900 border rounded-md text-sm hover:bg-white"
            >
              Export JSON
            </button>
            <button
              onClick={shareCurrent}
              className="px-4 py-2 bg-white/80 dark:bg-neutral-900 border rounded-md text-sm hover:bg-white"
            >
              Share Link
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 mt-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}

      {/* Results */}
      {compareMode ? (
        (resultA || resultB) && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {[resultA, resultB].map((r, i) =>
                r ? (
                  <div
                    key={i}
                    className="rounded-xl border p-4 bg-white/70 dark:bg-neutral-900/60"
                  >
                    <h2 className="text-lg font-semibold mb-2">{r.url}</h2>
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr>
                          <td className="py-1 text-gray-600">TTFB:</td>
                          <td>{formatMs(r.ttfb)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">DOM Loaded:</td>
                          <td>{formatMs(r.domLoad)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Total Load:</td>
                          <td>{formatMs(r.totalLoad)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Fetch Time:</td>
                          <td>{formatMs(r.fetchTime)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div key={i} className="text-gray-500 italic">
                    No data for Site {i === 0 ? "A" : "B"}
                  </div>
                )
              )}
            </div>

            {/* Comparison Summary */}
            {resultA && resultB && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Comparison Summary</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {[
                      ["DNS Lookup", resultA.dns, resultB.dns],
                      ["TTFB", resultA.ttfb, resultB.ttfb],
                      ["DOM Loaded", resultA.domLoad, resultB.domLoad],
                      ["Total Load", resultA.totalLoad, resultB.totalLoad],
                      ["Fetch Time", resultA.fetchTime, resultB.fetchTime],
                    ].map(([label, a, b], i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2 text-gray-600">{label}:</td>
                        <td className="py-2 text-right">
                          {(() => {
                            if (!a || !b) return "—";
                            if (a === b)
                              return <span className="text-gray-500">Same speed</span>;
                            return a < b ? (
                              <span className="text-green-600 font-semibold">
                                Site A faster
                              </span>
                            ) : (
                              <span className="text-red-500 font-semibold">
                                Site B faster
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Comparison Chart */}
            {resultA && resultB && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">
                  Visual Comparison (A vs B)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareData}>
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="siteA"
                      fill="#3b82f6"
                      name={`Site A (${resultA.url})`}
                    />
                    <Bar
                      dataKey="siteB"
                      fill="#f97316"
                      name={`Site B (${resultB.url})`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )
      ) : (
        resultA && (
          <div className="mt-8 rounded-xl border p-4 bg-white/70 dark:bg-neutral-900/60">
            <h2 className="text-lg font-semibold mb-2">{resultA.url}</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">TTFB:</td>
                  <td>{formatMs(resultA.ttfb)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">DOM Loaded:</td>
                  <td>{formatMs(resultA.domLoad)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Total Load:</td>
                  <td>{formatMs(resultA.totalLoad)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Fetch Time:</td>
                  <td>{formatMs(resultA.fetchTime)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      )}

      {/* History Chart */}
      {history.length > 0 ? (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Recent Performance Summary</h3>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("speedTestHistory");
                }
                setHistory([]);
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear History
            </button>
          </div>

          {/* quick replay buttons */}
          <ul className="mt-2 flex gap-2 flex-wrap text-xs">
            {history.map((h, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    setUrlA(h.url);
                    setResultA(h);
                    setCompareMode(false);
                  }}
                  className="px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  {h.timestamp} · {h.url.replace(/^https?:\/\//, "")}
                </button>
              </li>
            ))}
          </ul>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={history}>
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalLoad" fill="#3b82f6" name="Total Load (ms)" />
              <Bar dataKey="domLoad" fill="#10b981" name="DOM Load (ms)" />
              <Bar dataKey="ttfb" fill="#f59e0b" name="TTFB (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-10 text-xs text-gray-400">
          Run at least one test to see recent performance history.
        </p>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Network: {connection.effectiveType || "unknown"} • Downlink:{" "}
        {connection.downlink ? connection.downlink + " Mbps" : "N/A"}
      </div>
    </div>
  );
}

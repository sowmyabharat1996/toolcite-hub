"use client";

import React, { useEffect, useState } from "react";
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

const HISTORY_KEY = "tc_speedtest_history_v1";

// safe browser check
const isBrowser = typeof window !== "undefined";

export default function SpeedTest() {
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState<Result | null>(null);
  const [resultB, setResultB] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(isBrowser ? navigator.onLine : true);

  // load from URL + localStorage on mount
  useEffect(() => {
    if (!isBrowser) return;

    // 1) restore from query params
    const sp = new URLSearchParams(window.location.search);
    const a = sp.get("a") || "";
    const b = sp.get("b") || "";
    const cmp = sp.get("compare") === "1";

    if (a) setUrlA(a);
    if (b) setUrlB(b);
    if (cmp) setCompareMode(true);

    // 2) restore history
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore
    }

    // 3) online/offline listeners
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // sync to URL (a, b, compare)
  useEffect(() => {
    if (!isBrowser) return;
    const sp = new URLSearchParams(window.location.search);
    if (urlA) sp.set("a", urlA);
    else sp.delete("a");
    if (urlB) sp.set("b", urlB);
    else sp.delete("b");
    if (compareMode) sp.set("compare", "1");
    else sp.delete("compare");

    const next = window.location.pathname + "?" + sp.toString();
    window.history.replaceState(null, "", next);
  }, [urlA, urlB, compareMode]);

  function saveHistory(newResult: Result) {
    if (!isBrowser) return;
    const updated = [newResult, ...history].slice(0, 6);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  async function runTestFor(url: string): Promise<Result | null> {
    if (!isBrowser) return null;
    try {
      let testUrl = url.trim();
      if (!/^https?:\/\//i.test(testUrl)) testUrl = "https://" + testUrl;

      const t0 = performance.now();
      // NOTE: no-cors because we just want timing, not content
      await fetch(testUrl, { mode: "no-cors" });
      const t1 = performance.now();

      // read the latest navigation entry (may be 0 on some browsers)
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

      const dns = nav ? nav.domainLookupEnd - nav.domainLookupStart : 0;
      const connect = nav ? nav.connectEnd - nav.connectStart : 0;
      const ttfb = nav
        ? nav.responseStart - nav.requestStart
        : (t1 - t0) / 4;
      const domLoad = nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
      const totalLoad = nav ? nav.loadEventEnd - nav.startTime : t1 - t0;

      return {
        url: testUrl,
        timestamp: new Date().toLocaleTimeString(),
        dns: Math.max(0, dns),
        connect: Math.max(0, connect),
        ttfb: Math.max(0, ttfb),
        domLoad: Math.max(0, domLoad),
        totalLoad: Math.max(0, totalLoad),
        fetchTime: Math.max(0, t1 - t0),
      };
    } catch (e) {
      return null;
    }
  }

  async function runSingle() {
    if (!urlA) {
      setError("Please enter a valid URL.");
      return;
    }
    if (!online) {
      setError("You are offline. Connect to the internet to run a test.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultA(null);
    setResultB(null);

    const resA = await runTestFor(urlA);
    if (!resA) {
      setError("Could not measure this site (CORS / blocked / very slow). Try another URL.");
    } else {
      setResultA(resA);
      saveHistory(resA);
    }
    setLoading(false);
  }

  async function runCompare() {
    if (!urlA || !urlB) {
      setError("Please enter both URLs to compare.");
      return;
    }
    if (!online) {
      setError("You are offline. Connect to the internet to run a test.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultA(null);
    setResultB(null);

    const [resA, resB] = await Promise.all([runTestFor(urlA), runTestFor(urlB)]);
    if (!resA && !resB) {
      setError("Could not measure either site. They may block cross-origin requests.");
    }
    if (resA) {
      setResultA(resA);
      saveHistory(resA);
    }
    if (resB) {
      setResultB(resB);
      saveHistory(resB);
    }
    setLoading(false);
  }

  function formatMs(ms: number | undefined) {
    if (!ms || ms < 0) return "–";
    return `${ms.toFixed(0)} ms`;
  }

  const connection = (isBrowser ? (navigator as any)?.connection : {}) || {};

  const compareData =
    resultA && resultB
      ? [
          { metric: "DNS", siteA: resultA.dns, siteB: resultB.dns },
          { metric: "TTFB", siteA: resultA.ttfb, siteB: resultB.ttfb },
          { metric: "DOM Load", siteA: resultA.domLoad, siteB: resultB.domLoad },
          { metric: "Total Load", siteA: resultA.totalLoad, siteB: resultB.totalLoad },
          { metric: "Fetch Time", siteA: resultA.fetchTime, siteB: resultB.fetchTime },
        ]
      : [];

  // export current run as JSON
  function exportJSON() {
    const payload = {
      compared: compareMode,
      a: resultA,
      b: resultB,
      testedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "speed-test.json";
    link.click();
  }

  // share link
  async function shareLink() {
    if (!isBrowser) return;
    const href = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Website Speed Test – ToolCite",
          text: "Compare site load performance in-browser.",
          url: href,
        });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(href);
      alert("Link copied to clipboard.");
    } catch {
      alert("Copy failed. You can copy the URL from the address bar.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* a11y live region for errors */}
      <div aria-live="polite" className="sr-only">
        {error ? `Error: ${error}` : ""}
      </div>

      {/* offline banner */}
      {!online && (
        <div className="mb-3 rounded-md bg-yellow-100 text-yellow-900 px-3 py-2 text-sm">
          You are offline — tests will not run, but your settings are saved.
        </div>
      )}

      <div className="rounded-2xl bg-white/80 dark:bg-neutral-950/40 border border-slate-200/60 dark:border-neutral-800 shadow-sm p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
          <span role="img" aria-label="lightning">
            ⚡
          </span>{" "}
          Website Speed Test – Free Online Tool
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Analyze website load performance, TTFB, and connection metrics — all measured locally in your browser.
        </p>

        {/* compare toggle */}
        <div className="flex items-center gap-3 mb-4">
          <label htmlFor="compare-toggle" className="flex items-center gap-2 cursor-pointer">
            <input
              id="compare-toggle"
              type="checkbox"
              checked={compareMode}
              onChange={() => setCompareMode((v) => !v)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">Enable Compare Mode</span>
          </label>
        </div>

        {/* inputs row */}
        <div
          className={`grid gap-3 mb-4 ${
            compareMode ? "md:grid-cols-2" : "md:grid-cols-1"
          }`}
        >
          <input
            id="url-a"
            type="text"
            placeholder="https://example.com"
            aria-label="Test URL A"
            value={urlA}
            onChange={(e) => setUrlA(e.target.value)}
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-neutral-700 dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {compareMode && (
            <input
              id="url-b"
              type="text"
              placeholder="https://compare.com"
              aria-label="Test URL B"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              className="px-4 py-2 rounded-md border border-slate-200 dark:border-neutral-700 dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={compareMode ? runCompare : runSingle}
            disabled={
              loading ||
              !urlA ||
              (compareMode && !urlB) ||
              !online
            }
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : compareMode ? "Run Comparison" : "Run Test"}
          </button>
          <button
            onClick={exportJSON}
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900"
          >
            Export JSON
          </button>
          <button
            onClick={shareLink}
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900"
          >
            Share Link
          </button>
        </div>

        {/* error */}
        {error && (
          <div className="mb-4 rounded-md bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* results */}
        {compareMode ? (
          (resultA || resultB) && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {[resultA, resultB].map((r, i) =>
                  r ? (
                    <div key={i} className="rounded-xl border bg-white/80 dark:bg-neutral-900/40 dark:border-neutral-800 p-4">
                      <h2 className="text-lg font-semibold mb-2">{r.url}</h2>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className="py-1 text-slate-500 dark:text-slate-400">TTFB:</td>
                            <td>{formatMs(r.ttfb)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-500 dark:text-slate-400">DOM Loaded:</td>
                            <td>{formatMs(r.domLoad)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-500 dark:text-slate-400">Total Load:</td>
                            <td>{formatMs(r.totalLoad)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-500 dark:text-slate-400">Fetch Time:</td>
                            <td>{formatMs(r.fetchTime)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div key={i} className="text-slate-400 text-sm italic flex items-center">
                      No data for Site {i === 0 ? "A" : "B"}
                    </div>
                  )
                )}
              </div>

              {resultA && resultB && (
                <>
                  <div className="mt-6 border-t dark:border-neutral-800 pt-4">
                    <h3 className="text-base font-semibold mb-3">Comparison Summary</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {[
                          ["DNS Lookup", resultA.dns, resultB.dns],
                          ["TTFB", resultA.ttfb, resultB.ttfb],
                          ["DOM Loaded", resultA.domLoad, resultB.domLoad],
                          ["Total Load", resultA.totalLoad, resultB.totalLoad],
                          ["Fetch Time", resultA.fetchTime, resultB.fetchTime],
                        ].map(([label, a, b], idx) => (
                          <tr key={idx} className="border-t dark:border-neutral-800">
                            <td className="py-2 text-slate-500 dark:text-slate-400">{label}:</td>
                            <td className="py-2 text-right">
                              {(() => {
                                if (!a || !b) return "—";
                                if (a === b) return <span className="text-slate-400">Same speed</span>;
                                return a < b ? (
                                  <span className="text-green-600 dark:text-green-400 font-semibold">Site A faster</span>
                                ) : (
                                  <span className="text-red-500 dark:text-red-400 font-semibold">Site B faster</span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base font-semibold mb-3">Visual Comparison (A vs B)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={compareData}>
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="siteA" fill="#3b82f6" name={`Site A (${resultA.url})`} />
                        <Bar dataKey="siteB" fill="#f97316" name={`Site B (${resultB.url})`} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          )
        ) : (
          resultA && (
            <div className="mt-4 rounded-xl border bg-white/80 dark:bg-neutral-900/40 dark:border-neutral-800 p-4">
              <h2 className="text-lg font-semibold mb-2">{resultA.url}</h2>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-slate-500 dark:text-slate-400">TTFB:</td>
                    <td>{formatMs(resultA.ttfb)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-500 dark:text-slate-400">DOM Loaded:</td>
                    <td>{formatMs(resultA.domLoad)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-500 dark:text-slate-400">Total Load:</td>
                    <td>{formatMs(resultA.totalLoad)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-500 dark:text-slate-400">Fetch Time:</td>
                    <td>{formatMs(resultA.fetchTime)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )}

        {/* history */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">Recent Performance Summary</h3>
              <button
                onClick={() => {
                  if (!isBrowser) return;
                  localStorage.removeItem(HISTORY_KEY);
                  setHistory([]);
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Clear history
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={history}>
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalLoad" fill="#3b82f6" name="Total Load (ms)" />
                <Bar dataKey="domLoad" fill="#10b981" name="DOM Load (ms)" />
                <Bar dataKey="ttfb" fill="#f97316" name="TTFB (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Network: {connection.effectiveType || "unknown"} • Downlink:{" "}
          {connection.downlink ? connection.downlink + " Mbps" : "N/A"}
        </div>
      </div>
    </div>
  );
}

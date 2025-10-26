"use client";

import React, { useState } from "react";

export default function SpeedTest() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSpeedTest() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      let testUrl = url.trim();
      if (!/^https?:\/\//i.test(testUrl)) {
        testUrl = "https://" + testUrl;
      }

      const t0 = performance.now();
      const res = await fetch(testUrl, { mode: "no-cors" });
      const t1 = performance.now();

      const timing = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

      setResult({
        url: testUrl,
        timeTaken: (t1 - t0).toFixed(2),
        dns: timing?.domainLookupEnd - timing?.domainLookupStart,
        connect: timing?.connectEnd - timing?.connectStart,
        ttfb: timing?.responseStart - timing?.requestStart,
        domLoad: timing?.domContentLoadedEventEnd - timing?.startTime,
        totalLoad: timing?.loadEventEnd - timing?.startTime,
      });
    } catch (err: any) {
      console.error(err);
      setError("Could not fetch this URL. Some sites block performance testing.");
    } finally {
      setLoading(false);
    }
  }

  function formatMs(ms: number | undefined) {
    if (!ms || ms < 0) return "–";
    return `${ms.toFixed(0)} ms`;
  }

  const connection = (navigator as any)?.connection || {};

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Website Speed Test Tool</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Enter a website URL to measure load performance and network timing. All tests run in your
        browser — nothing is uploaded or stored.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow px-4 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
        />
        <button
          onClick={runSpeedTest}
          disabled={loading || !url}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Run Test"}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border p-4 bg-white/70 dark:bg-neutral-900/60">
          <h2 className="text-lg font-semibold mb-2">Results for {result.url}</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr><td className="py-1 text-gray-600">DNS Lookup:</td><td>{formatMs(result.dns)}</td></tr>
              <tr><td className="py-1 text-gray-600">Connection Time:</td><td>{formatMs(result.connect)}</td></tr>
              <tr><td className="py-1 text-gray-600">Time To First Byte (TTFB):</td><td>{formatMs(result.ttfb)}</td></tr>
              <tr><td className="py-1 text-gray-600">DOM Loaded:</td><td>{formatMs(result.domLoad)}</td></tr>
              <tr><td className="py-1 text-gray-600">Total Load Time:</td><td>{formatMs(result.totalLoad)}</td></tr>
              <tr><td className="py-1 text-gray-600">Fetch Request Time:</td><td>{result.timeTaken} ms</td></tr>
            </tbody>
          </table>

          <div className="mt-4 text-xs text-gray-500">
            Network: {connection.effectiveType || "unknown"} • Downlink:{" "}
            {connection.downlink ? connection.downlink + " Mbps" : "N/A"}
          </div>
        </div>
      )}
    </div>
  );
}

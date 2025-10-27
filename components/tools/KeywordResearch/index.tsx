"use client";
import React, { useState, useEffect, useMemo } from "react";
import { generateMockData, computeMetrics, calcHealthScore } from "./utils";
import SummaryBar from "./SummaryBar";
import MetricsCharts from "./MetricsCharts";
import KeywordList from "./KeywordList";

export default function KeywordResearch() {
  const [seed, setSeed] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [grouping, setGrouping] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [compareIndex, setCompareIndex] = useState<number | null>(null);

  const runAnalysis = async () => {
    if (!seed.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = generateMockData(seed);
    setData(result);
    const newSession = { seed, result, time: new Date().toISOString() };
    setHistory((h) => [newSession, ...h.slice(0, 4)]);
    setLoading(false);
  };

  const metrics = useMemo(() => computeMetrics(data), [data]);
  const health = useMemo(() => calcHealthScore(metrics), [metrics]);

  // Auto-compare to previous run if selected
  const comparison =
    compareIndex !== null && history[compareIndex]
      ? computeMetrics(history[compareIndex].result)
      : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-center mb-3">
        🔍 Keyword Research (Pro Dashboard)
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Simulated SEO analytics — difficulty, intent, health & performance insights.
      </p>

      {/* Input + Controls */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Enter seed keyword"
          className="w-72 border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-400"
        />
        <button
          onClick={runAnalysis}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Analyzing..." : "Generate"}
        </button>

        {data.length > 0 && (
          <>
            <input
              type="text"
              placeholder="Search keyword..."
              className="border border-gray-300 rounded-md px-3 py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={`px-4 py-2 rounded-md ${
                grouping
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setGrouping(!grouping)}
            >
              {grouping ? "Ungroup" : "Group by Modifier"}
            </button>
            {history.length > 1 && (
              <select
                className="border border-gray-300 rounded-md px-3 py-2"
                onChange={(e) =>
                  setCompareIndex(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              >
                <option value="">Compare previous run...</option>
                {history.slice(1).map((h, i) => (
                  <option key={i} value={i + 1}>
                    {h.seed} — {new Date(h.time).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* Summary Bar */}
      {data.length > 0 && (
        <SummaryBar metrics={metrics} health={health} comparison={comparison} />
      )}

      {/* Charts */}
      {data.length > 0 && <MetricsCharts metrics={metrics} />}

      {/* Keyword List */}
      {data.length > 0 && (
        <KeywordList
          data={data}
          search={search}
          grouping={grouping}
          comparison={comparison}
        />
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Metrics, KeywordSourceBlock } from "./utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

type IntentStr = "Navigational" | "Transactional" | "Informational" | "Commercial";

export default function MetricsCharts({
  metrics,
  blocks,
}: {
  metrics: Metrics;
  blocks: KeywordSourceBlock[];
}) {
  // Track previous health to compute delta safely (no stale reads)
  const prevHealthRef = useRef<number>(metrics.health);
  const [trendColor, setTrendColor] = useState<string>("#3b82f6"); // blue default

  useEffect(() => {
    const prev = prevHealthRef.current;
    const delta = metrics.health - prev;
    if (Math.abs(delta) < 1) setTrendColor("#3b82f6"); // stable
    else if (delta > 0) setTrendColor("#22c55e"); // improving
    else setTrendColor("#ef4444"); // declining
    prevHealthRef.current = metrics.health;
  }, [metrics.health]);

  // Mood-aware palette (typed)
  const palette: Record<IntentStr, string> = useMemo(() => {
    if (trendColor === "#22c55e") {
      // GREEN mood
      return {
        Navigational: "#34d399",
        Transactional: "#10b981",
        Informational: "#059669",
        Commercial: "#6ee7b7",
      };
    }
    if (trendColor === "#ef4444") {
      // RED mood
      return {
        Navigational: "#f87171",
        Transactional: "#dc2626",
        Informational: "#b91c1c",
        Commercial: "#fecaca",
      };
    }
    // BLUE / stable mood
    return {
      Navigational: "#60a5fa",
      Transactional: "#3b82f6",
      Informational: "#2563eb",
      Commercial: "#93c5fd",
    };
  }, [trendColor]);

  const barFill = useMemo(() => {
    if (trendColor === "#22c55e") return "#34d399";
    if (trendColor === "#ef4444") return "#f87171";
    return "#60a5fa";
  }, [trendColor]);

  // Pie data by intent (typed)
  const pieData: { name: IntentStr; value: number }[] = useMemo(
    () => [
      { name: "Navigational", value: metrics.byIntent.Navigational },
      { name: "Transactional", value: metrics.byIntent.Transactional },
      { name: "Informational", value: metrics.byIntent.Informational },
      { name: "Commercial", value: metrics.byIntent.Commercial },
    ],
    [metrics.byIntent]
  );

  // Bar data: average difficulty by source
  const barData = useMemo(() => {
    return blocks.map((b) => {
      const avg =
        b.items.length === 0
          ? 0
          : Math.round(b.items.reduce((s, k) => s + k.difficulty, 0) / b.items.length);
      return { source: b.source, avgDifficulty: avg };
    });
  }, [blocks]);

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700"
      style={{ boxShadow: `0 0 22px ${trendColor}22`, borderRadius: 16 }}
    >
      {/* Pie: Intent Distribution */}
      <div
        className="rounded-2xl border p-4 transition-all duration-700 bg-white/70 dark:bg-white/5"
        style={{
          borderColor: trendColor + "55",
          background:
            trendColor === "#22c55e"
              ? "linear-gradient(145deg, rgba(240,253,244,0.6) 0%, rgba(220,252,231,0.4) 100%)"
              : trendColor === "#ef4444"
              ? "linear-gradient(145deg, rgba(254,242,242,0.6) 0%, rgba(254,226,226,0.4) 100%)"
              : "linear-gradient(145deg, rgba(239,246,255,0.6) 0%, rgba(219,234,254,0.4) 100%)",
          borderWidth: 1,
        }}
      >
        <div className="mb-2 text-sm font-semibold flex items-center gap-2" style={{ color: trendColor }}>
          Keywords by Intent
          <span className="text-xs opacity-75">(colors reflect performance mood)</span>
        </div>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(v: any) => [`${v}`, "Count"]}
                contentStyle={{
                  background: "#fff",
                  border: `1px solid ${trendColor}55`,
                  borderRadius: 8,
                }}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                stroke="#ffffff"
                isAnimationActive
                animationDuration={900}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={palette[entry.name]}
                    style={{ filter: `drop-shadow(0 0 6px ${trendColor}44)` }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {pieData.map((p) => (
            <div key={p.name} className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: palette[p.name] }} />
              <span className="text-neutral-600 dark:text-neutral-300">
                {p.name}: <strong>{p.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar: Avg Difficulty by Source */}
      <div
        className="rounded-2xl border p-4 transition-all duration-700 bg-white/70 dark:bg-white/5"
        style={{
          borderColor: trendColor + "55",
          background:
            trendColor === "#22c55e"
              ? "linear-gradient(145deg, rgba(236,253,245,0.6) 0%, rgba(209,250,229,0.4) 100%)"
              : trendColor === "#ef4444"
              ? "linear-gradient(145deg, rgba(254,242,242,0.6) 0%, rgba(254,226,226,0.4) 100%)"
              : "linear-gradient(145deg, rgba(239,246,255,0.6) 0%, rgba(219,234,254,0.4) 100%)",
          borderWidth: 1,
        }}
      >
        <div className="mb-2 text-sm font-semibold flex items-center gap-2" style={{ color: trendColor }}>
          Avg Difficulty by Source
          <span className="text-xs opacity-75">(fills respond to performance mood)</span>
        </div>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="source" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(v: any) => [`${v}`, "Avg Difficulty"]}
                contentStyle={{
                  background: "#fff",
                  border: `1px solid ${trendColor}55`,
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="avgDifficulty" fill={barFill} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

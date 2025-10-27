// components/tools/KeywordResearch/MetricsCharts.tsx
"use client";
import React, { useMemo } from "react";
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
const INTENT_COLORS: Record<string, string> = {
  Navigational: "#38bdf8",     // sky-400
  Transactional: "#10b981",    // emerald-500
  Informational: "#6366f1",    // indigo-500
  Commercial: "#f59e0b",       // amber-500
};
const BAR_COLOR = "#60a5fa"; // blue-400
export default function MetricsCharts({
  metrics,
  blocks,
}: {
  metrics: Metrics;
  blocks: KeywordSourceBlock[];
}) {
  // Pie data by intent
  const pieData = useMemo(
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
          : Math.round(
              b.items.reduce((s, k) => s + k.difficulty, 0) / b.items.length
            );
      return { source: b.source, avgDifficulty: avg };
    });
  }, [blocks]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie: intents */}
      <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          Keywords by Intent
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip formatter={(v: any) => [`${v}`, "Count"]} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                stroke="#ffffff"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={INTENT_COLORS[entry.name]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {pieData.map((p) => (
            <div key={p.name} className="inline-flex items-center gap-2">
          <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: INTENT_COLORS[p.name] }}
              />
              <span className="text-neutral-600 dark:text-neutral-300">
                {p.name}: <strong>{p.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Bar: avg difficulty by source */}
      <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          Avg Difficulty by Source
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="source" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v: any) => [`${v}`, "Avg Difficulty"]} />
              <Bar dataKey="avgDifficulty" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


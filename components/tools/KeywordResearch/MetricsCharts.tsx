"use client";
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

export default function MetricsCharts({ metrics }: any) {
  const lineData = Object.entries(metrics.sourceAverages || {}).map(([src, val]) => ({
    source: src,
    difficulty: val,
  }));

  const pieData = Object.entries(metrics.count).map(([intent, count]) => ({
    name: intent,
    value: count,
  }));

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-10">
      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="font-semibold mb-2 text-gray-700">Difficulty by Source</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <XAxis dataKey="source" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="difficulty"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="font-semibold mb-2 text-gray-700">Intent Distribution</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

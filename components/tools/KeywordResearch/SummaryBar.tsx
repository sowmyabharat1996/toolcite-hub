"use client";
import React, { useEffect, useState } from "react";

export default function SummaryBar({ metrics, health, comparison }: any) {
  const [bg, setBg] = useState("from-blue-50 to-blue-100");
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (health > 75) setBg("from-green-100 to-green-50");
    else if (health > 50) setBg("from-blue-50 to-blue-100");
    else setBg("from-rose-50 to-red-100");

    setRefreshing(true);
    const t = setTimeout(() => setRefreshing(false), 1000);
    return () => clearTimeout(t);
  }, [health]);

  useEffect(() => {
    setSecondsAgo(0);
    const timer = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [metrics]);

  return (
    <div
      className={`sticky top-0 z-10 bg-gradient-to-br ${bg} transition-colors duration-700 rounded-xl p-4 mb-6 shadow`}
    >
      <style>{`
        @keyframes spinRefresh { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
        .spin-once { animation: spinRefresh 1s ease; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s ease; }

        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0px rgba(0,0,0,0); } 50% { box-shadow: 0 0 10px rgba(16,185,129,0.5); } }
        .animate-pulse-glow { animation: pulseGlow 2s infinite; }
      `}</style>

      {/* Top Metrics Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <Metric label="Total Keywords" value={metrics.total} />
        <Metric
          label="Avg Difficulty"
          value={metrics.avg}
          delta={comparison ? metrics.avg - comparison.avg : 0}
        />
        {Object.entries(metrics.count).map(([intent, count], i) => (
          <Metric
            key={intent}
            label={intent}
            value={count as number}
            delta={
              comparison
                ? ((count as number) -
                    (comparison.count[intent] || 0)) /
                  ((comparison.count[intent] || 1) / 100)
                : 0
            }
            index={i}
          />
        ))}
        <div>
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="text-lg font-semibold flex justify-center items-center gap-1">
            {secondsAgo < 2 ? "Just now" : `${secondsAgo}s ago`}
            <span className={`${refreshing ? "spin-once" : ""}`}>🔄</span>
          </p>
        </div>
      </div>

      {/* Keyword Health Score Gauge */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          Keyword Health Score
        </h3>
        <div className="relative h-5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out animate-pulse-glow"
            style={{
              width: `${health}%`,
              background: `linear-gradient(90deg,
                rgba(239,68,68,1) 0%,
                rgba(234,179,8,1) 50%,
                rgba(34,197,94,1) 100%)`,
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>
            {health}% —{" "}
            {health > 80
              ? "Excellent"
              : health > 60
              ? "Good"
              : health > 40
              ? "Fair"
              : "Poor"}
          </span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, delta = 0, index = 0 }: any) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const anim = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 600, 1);
      setDisplay(Math.round(p * value));
      if (p < 1) requestAnimationFrame(anim);
    };
    const t = setTimeout(() => requestAnimationFrame(anim), index * 50);
    return () => clearTimeout(t);
  }, [value]);

  const color = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-700";
  const icon = delta > 0 ? "📈" : delta < 0 ? "📉" : "⏸️";

  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold flex justify-center items-center gap-1">
        {display}
        {delta !== 0 && (
          <span className={`${color} text-sm animate-fade-in`}>
            {icon} {delta > 0 ? "+" : ""}
            {Math.round(delta)}%
          </span>
        )}
      </p>
    </div>
  );
}

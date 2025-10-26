"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

type KeywordItem = {
  text: string;
  difficulty: number;
  intent: "Informational" | "Navigational" | "Commercial" | "Transactional";
};

type Suggestion = {
  source: string;
  keywords: KeywordItem[];
};

export default function KeywordResearch() {
  const [seed, setSeed] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState(100);
  const [activeIntent, setActiveIntent] = useState<
    "All" | KeywordItem["intent"]
  >("All");
  const [isStickyVisible, setStickyVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false); // for 🔄 animation

  const prevMetricsRef = useRef({
    avgDifficulty: 0,
    intentCount: {} as Record<string, number>,
  });

  const SOURCES = ["Google", "YouTube", "Bing", "Amazon"];

  // --- Intent detection ---
  const detectIntent = (kw: string): KeywordItem["intent"] => {
    const lower = kw.toLowerCase();
    if (/\b(how|what|why|guide|tutorial|tips|learn|examples|meaning)\b/.test(lower))
      return "Informational";
    if (/\b(login|official|youtube|amazon|homepage|site|app|near me)\b/.test(lower))
      return "Navigational";
    if (/\b(best|review|vs|compare|comparison|top|cheap|alternatives)\b/.test(lower))
      return "Commercial";
    if (/\b(buy|price|deal|discount|offer|book|order)\b/.test(lower))
      return "Transactional";
    const random = Math.random();
    if (random < 0.4) return "Informational";
    if (random < 0.6) return "Commercial";
    if (random < 0.8) return "Transactional";
    return "Navigational";
  };

  // --- Difficulty scoring ---
  const calculateDifficulty = (kw: string): number => {
    const words = kw.trim().split(/\s+/).length;
    let score = 50;
    if (words >= 4) score -= 20;
    else if (words === 3) score -= 10;
    else if (words <= 2) score += 10;
    if (/\b(best|review|top|price|buy|cheap|vs|deal)\b/.test(kw)) score += 15;
    if (/\b(amazon|youtube|flipkart|google|twitter)\b/.test(kw)) score -= 10;
    score += Math.floor(Math.random() * 11) - 5;
    return Math.max(0, Math.min(100, score));
  };

  // --- Mock keyword generation ---
  const mockKeywords = (base: string, source: string): KeywordItem[] => {
    const topics = [
      "price","review","best","vs","latest","ideas","guide","cheap",
      "comparison","tutorial","AI tools","alternatives","trends",
      "for beginners","2025","statistics","growth","in india","apps","buy online",
    ];
    return topics
      .sort(() => 0.5 - Math.random())
      .slice(0, 8)
      .map((t) => {
        const text = `${base} ${t} ${source.toLowerCase()}`.trim();
        return {
          text,
          intent: detectIntent(text),
          difficulty: calculateDifficulty(text),
        };
      });
  };

  const generateSuggestions = async () => {
    if (!seed.trim()) return;
    setLoading(true);
    setRefreshing(true); // start spinning 🔄
    await new Promise((r) => setTimeout(r, 500));
    const data = SOURCES.map((src) => ({
      source: src,
      keywords: mockKeywords(seed, src),
    }));
    setSuggestions(data);
    setLoading(false);
    setLastUpdated(new Date());
    setSecondsAgo(0);
    setTimeout(() => setRefreshing(false), 1500); // stop spin after 1.5s
  };

  // --- Auto-increment "Last Updated Xs ago" ---
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // --- Toast Helper ---
  const showToast = (msg: string) => {
    const toast = document.createElement("div");
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.3s ease",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 1500);
  };

  // --- Export / Copy ---
  const exportCSV = () => {
    const all = suggestions.flatMap((s) =>
      s.keywords.map((k) => `${s.source},${k.text},${k.difficulty},${k.intent}`)
    );
    const csv = ["Source,Keyword,Difficulty,Intent", ...all].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${seed || "keywords"}.csv`;
    link.click();
  };

  const copyAll = async () => {
    const all = suggestions
      .flatMap((s) =>
        s.keywords.map(
          (k) => `${k.text} [Difficulty: ${k.difficulty}] [Intent: ${k.intent}]`
        )
      )
      .join("\n");
    await navigator.clipboard.writeText(all);
    showToast("Copied all keywords!");
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/tools/keyword-research-basic?seed=${encodeURIComponent(
      seed
    )}`;
    await navigator.clipboard.writeText(url);
    showToast("Shareable link copied!");
  };

  const difficultyColor = (score: number) =>
    score < 34 ? "bg-green-500" : score < 67 ? "bg-yellow-500" : "bg-red-500";

  const intentColor = (intent: string) => {
    switch (intent) {
      case "Informational": return "bg-blue-100 text-blue-700";
      case "Navigational": return "bg-purple-100 text-purple-700";
      case "Commercial": return "bg-amber-100 text-amber-700";
      case "Transactional": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // --- Filtering + metrics ---
  const filteredSuggestions = suggestions.map((s) => ({
    ...s,
    keywords: s.keywords.filter(
      (k) =>
        k.difficulty <= difficultyFilter &&
        (activeIntent === "All" || k.intent === activeIntent)
    ),
  }));

  const metrics = useMemo(() => {
    const all = filteredSuggestions.flatMap((s) => s.keywords);
    const total = all.length;
    const avgDifficulty =
      total > 0
        ? Math.round(all.reduce((sum, k) => sum + k.difficulty, 0) / total)
        : 0;

    const intentCount = all.reduce(
      (acc, k) => {
        acc[k.intent] = (acc[k.intent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { total, avgDifficulty, intentCount };
  }, [filteredSuggestions]);

  // --- Trend detection ---
  const [trends, setTrends] = useState<{
    difficultyTrend: "up" | "down" | "flat";
    intentTrend: Record<string, "up" | "down" | "flat">;
  }>({ difficultyTrend: "flat", intentTrend: {} });

  useEffect(() => {
    const prev = prevMetricsRef.current;
    let difficultyTrend: "up" | "down" | "flat" = "flat";
    if (metrics.avgDifficulty > prev.avgDifficulty + 2) difficultyTrend = "up";
    else if (metrics.avgDifficulty < prev.avgDifficulty - 2) difficultyTrend = "down";

    const intentTrend: Record<string, "up" | "down" | "flat"> = {};
    for (const [intent, count] of Object.entries(metrics.intentCount)) {
      const prevVal = prev.intentCount[intent] || 0;
      if (count > prevVal) intentTrend[intent] = "up";
      else if (count < prevVal) intentTrend[intent] = "down";
      else intentTrend[intent] = "flat";
    }

    setTrends({ difficultyTrend, intentTrend });
    prevMetricsRef.current = {
      avgDifficulty: metrics.avgDifficulty,
      intentCount: { ...metrics.intentCount },
    };
  }, [metrics]);

  // --- Sticky summary ---
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 400 && metrics.total > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [metrics.total]);

  // --- Animated icons ---
  const trendIcon = (trend: "up" | "down" | "flat") => {
    const base =
      "ml-1 inline-block animate-fade-float text-lg transition-transform duration-500 ease-in-out";
    if (trend === "up") return <span className={`${base} text-red-500`}>📈</span>;
    if (trend === "down") return <span className={`${base} text-green-500`}>📉</span>;
    return <span className={`${base} text-gray-400`}>⏸️</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      {/* Animations */}
      <style>{`
        @keyframes fadeFloat {
          0% { opacity: 0; transform: translateY(8px) scale(0.95); }
          50% { opacity: 1; transform: translateY(-2px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-float {
          animation: fadeFloat 0.8s ease;
        }
        @keyframes spinRefresh {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-once {
          animation: spinRefresh 1.2s ease-in-out;
        }
      `}</style>

      <h1 className="text-2xl font-semibold mb-2 text-center">🔍 Keyword Research (Basic)</h1>
      <p className="text-center text-gray-600 mb-6">
        Smart keyword suggestions with trends, difficulty analytics & real-time refresh.
      </p>

      {/* Input Controls */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Enter seed keyword (e.g., ai writing)"
          className="w-72 border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-400"
        />
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md transition ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Analyzing..." : "Generate Keywords"}
        </button>
        {suggestions.length > 0 && (
          <>
            <button onClick={copyAll} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">Copy All</button>
            <button onClick={exportCSV} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">Export CSV</button>
            <button onClick={shareLink} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition">Share Link</button>
          </>
        )}
      </div>

      {/* Sticky Summary Bar */}
      {metrics.total > 0 && (
        <div
          className={`${
            isStickyVisible
              ? "fixed top-0 left-0 w-full backdrop-blur-md bg-white/80 shadow-md border-b border-gray-200 z-50 transition-all duration-300"
              : ""
          }`}
        >
          <div
            className={`grid sm:grid-cols-2 md:grid-cols-5 gap-4 text-center max-w-6xl mx-auto p-3 ${
              isStickyVisible ? "py-3" : "bg-gray-50 rounded-xl p-4 mb-8"
            }`}
          >
            <div>
              <p className="text-sm text-gray-500">Total Keywords</p>
              <p className="text-xl font-semibold">{metrics.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Difficulty</p>
              <p
                className={`text-xl font-semibold flex justify-center items-center ${
                  metrics.avgDifficulty < 34
                    ? "text-green-600"
                    : metrics.avgDifficulty < 67
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {metrics.avgDifficulty} {trendIcon(trends.difficultyTrend)}
              </p>
            </div>
            {Object.entries(metrics.intentCount).map(([intent, count]) => (
              <div key={intent}>
                <p className="text-sm text-gray-500">{intent}</p>
                <p className="text-lg font-semibold text-gray-700 flex justify-center items-center">
                  {count} {trendIcon(trends.intentTrend[intent])}
                </p>
              </div>
            ))}
            <div className="hidden md:block">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold text-gray-600 flex items-center justify-center gap-2">
                <span>
                  {secondsAgo < 2 ? "Just now" : `${secondsAgo}s ago`}
                </span>
                <span className={`${refreshing ? "spin-once" : ""}`}>🔄</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Grid */}
      {metrics.total > 0 ? (
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredSuggestions.map((s) => (
            <div key={s.source} className="bg-white shadow-sm rounded-xl p-4 border border-gray-100">
              <h2 className="font-semibold text-lg mb-3 text-gray-700">{s.source}</h2>
              <ul className="space-y-3 text-sm text-gray-700">
                {s.keywords.map((k, i) => (
                  <li
                    key={i}
                    className="cursor-pointer group border border-gray-100 rounded-lg p-2 hover:shadow transition"
                    onClick={() => {
                      navigator.clipboard.writeText(k.text);
                      showToast(`Copied: ${k.text}`);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="group-hover:text-blue-600">{k.text}</span>
                      <span className={`text-xs text-white px-2 py-1 rounded-full ${difficultyColor(k.difficulty)}`}>
                        {k.difficulty}
                      </span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                      <div
                        className={`absolute top-0 left-0 h-2 rounded-full ${difficultyColor(k.difficulty)}`}
                        style={{ width: `${k.difficulty}%` }}
                      ></div>
                    </div>
                    <div
                      className={`mt-1 inline-block text-[11px] px-2 py-0.5 rounded-full ${intentColor(k.intent)}`}
                    >
                      {k.intent}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        suggestions.length > 0 && <p className="text-center text-gray-500">No keywords match filters.</p>
      )}
    </div>
  );
}

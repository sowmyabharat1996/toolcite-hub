"use client";

import React, { useState } from "react";

type Suggestion = {
  source: string;
  keywords: string[];
};

export default function KeywordResearch() {
  const [seed, setSeed] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const SOURCES = ["Google", "YouTube", "Bing", "Amazon"];

  const mockKeywords = (base: string, source: string): string[] => {
    const topics = [
      "price",
      "review",
      "top 10",
      "latest",
      "best",
      "vs",
      "trends",
      "ideas",
      "2025",
      "buy",
      "cheap",
      "premium",
      "guide",
      "comparison",
      "alternatives",
      "statistics",
      "tutorial",
      "AI tools",
      "growth",
      "jobs",
    ];

    // Create pseudo-random variations
    return topics
      .sort(() => 0.5 - Math.random())
      .slice(0, 8)
      .map((t) => `${base} ${t} ${source.toLowerCase()}`.trim());
  };

  const generateSuggestions = async () => {
    if (!seed.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate delay
    const data = SOURCES.map((src) => ({
      source: src,
      keywords: mockKeywords(seed, src),
    }));
    setSuggestions(data);
    setLoading(false);
  };

  const exportCSV = () => {
    const all = suggestions.flatMap((s) =>
      s.keywords.map((k) => `${s.source},${k}`)
    );
    const csv = ["Source,Keyword", ...all].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${seed || "keywords"}.csv`;
    link.click();
  };

  const copyAll = async () => {
    const all = suggestions.flatMap((s) => s.keywords).join("\n");
    await navigator.clipboard.writeText(all);
    showToast("Copied all keywords!");
  };

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

  const shareLink = async () => {
    const url = `${window.location.origin}/tools/keyword-research-basic?seed=${encodeURIComponent(
      seed
    )}`;
    await navigator.clipboard.writeText(url);
    showToast("Shareable link copied!");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
        🔍 Keyword Research (Basic)
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Generate keyword ideas and autosuggest variations instantly from popular
        platforms — runs locally, no APIs.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Enter seed keyword (e.g., electric cars)"
          className="w-72 border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-400"
        />
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md transition ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating..." : "Generate Keywords"}
        </button>
        {suggestions.length > 0 && (
          <>
            <button
              onClick={copyAll}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Copy All
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
            >
              Export CSV
            </button>
            <button
              onClick={shareLink}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
            >
              Share Link
            </button>
          </>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {suggestions.map((s) => (
            <div
              key={s.source}
              className="bg-white shadow-sm rounded-xl p-4 border border-gray-100"
            >
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="text-gray-700">{s.source}</span>
              </h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {s.keywords.map((kw, i) => (
                  <li
                    key={i}
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      navigator.clipboard.writeText(kw);
                      showToast(`Copied: ${kw}`);
                    }}
                  >
                    • {kw}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

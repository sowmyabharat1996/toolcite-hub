"use client";
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import SummaryBar from "./SummaryBar";
import KeywordList from "./KeywordList";
import { generateMockKeywords } from "./utils";

export default function KeywordResearch() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    avg: 0,
    count: { Navigational: 0, Transactional: 0, Informational: 0, Commercial: 0 },
  });
  const [comparison, setComparison] = useState<any | null>(null);
  const [health, setHealth] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  function generateKeywords() {
    if (!query.trim()) return;
    setComparison(metrics);
    const result = generateMockKeywords(query);
    setData(result.data);
    setMetrics(result.metrics);
    setHealth(result.health);
    setAiInsight(null);
  }

  function copyAll() {
    const all = data.flatMap((s) => s.keywords.map((k: any) => k.text)).join("\n");
    navigator.clipboard.writeText(all);
    alert("Copied all keywords!");
  }

  function exportCSV() {
    const rows = data.flatMap((s) =>
      s.keywords.map((k: any) => ({
        Source: s.source,
        Keyword: k.text,
        Difficulty: k.difficulty,
        Intent: k.intent,
      }))
    );
    const csv = [
      "Source,Keyword,Difficulty,Intent",
      ...rows.map(
        (r) => `${r.Source},"${r.Keyword}",${r.Difficulty},${r.Intent}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${query || "keywords"}.csv`;
    a.click();
  }

  function shareLink() {
    const link = `${window.location.origin}/tools/keyword-research-basic?q=${encodeURIComponent(query)}`;
    navigator.clipboard.writeText(link);
    alert("Shareable link copied!");
  }

  // 🧠 AI insight
  function analyzeAIInsight() {
    if (!data || !data.length) {
      setAiInsight("Please generate keywords first.");
      return;
    }
    const allKeywords = data.flatMap((s: any) => s.keywords);
    const easiest = allKeywords.reduce((a, b) =>
      a.difficulty < b.difficulty ? a : b
    );
    setAiInsight(
      `Easiest keyword to rank: “${easiest.text}” (Difficulty ${easiest.difficulty}). Try targeting this first.`
    );
  }

  // 📄 PDF Export
  async function exportPDF() {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = { width: pageWidth - 20 };
    const imgHeight = (canvas.height * imgProps.width) / canvas.width;

    // Header
    pdf.setFontSize(16);
    pdf.text("ToolCite Keyword Research Report", 10, 15);
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 10, 22);

    pdf.addImage(imgData, "PNG", 10, 28, imgProps.width, imgHeight);

    pdf.save(`${query || "keyword-report"}.pdf`);
  }

  return (
    <div className="p-6" ref={reportRef}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s ease forwards; }
      `}</style>

      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        🔍 Keyword Research (Basic)
      </h1>
      <p className="text-gray-600 mb-4">
        Smart keyword suggestions with trends, difficulty analytics & real-time refresh.
      </p>

      {/* Control buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a seed keyword..."
          className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
        />
        <button
          onClick={generateKeywords}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Generate
        </button>
        <button
          onClick={copyAll}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Copy All
        </button>
        <button
          onClick={exportCSV}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={shareLink}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Share Link
        </button>
        <button
          onClick={analyzeAIInsight}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🧠 AI Insight
        </button>
        <button
          onClick={exportPDF}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          📄 Export PDF
        </button>
      </div>

      <SummaryBar metrics={metrics} health={health} comparison={comparison} />

      {aiInsight && (
        <div className="mt-4 mb-6 animate-fade-in bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4 text-indigo-800 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-2xl">🧠</span>
            <p className="text-sm font-medium leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      )}

      {data.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map((source: any) => (
            <KeywordList key={source.source} {...source} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm mt-10 text-center">
          Enter a keyword above and click Generate to begin.
        </p>
      )}
    </div>
  );
}

"use client";
import React from "react";
import { KeywordSourceBlock, KeywordItem } from "./utils";

export default function KeywordList({
  blocks,
  highlightId,
  aiTopIds = new Set<string>(),
  sortByAI = false,
}: {
  blocks: KeywordSourceBlock[];
  highlightId?: string | null;
  aiTopIds?: Set<string>;
  sortByAI?: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {blocks.map((block) => (
        <div
          key={block.source}
          className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/70 dark:bg-white/5"
        >
          <div className="text-lg font-semibold mb-2">{block.source}</div>
          <div className="space-y-2">
            {block.items.map((k) => (
              <Card
                key={k.id}
                k={k}
                highlight={k.id === highlightId}
                isAIPick={aiTopIds.has(k.id)}
                sortByAI={sortByAI}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({
  k,
  highlight,
  isAIPick,
  sortByAI,
}: {
  k: KeywordItem;
  highlight: boolean;
  isAIPick: boolean;
  sortByAI: boolean;
}) {
  const glow = sortByAI && isAIPick;

  return (
    <div
      className={`rounded-xl p-3 border transition-shadow duration-300 ${
        highlight || glow
          ? "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]"
          : "border-neutral-200/70 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {k.phrase}
        </div>
        <div className="flex items-center gap-2">
          {isAIPick && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              AI pick {typeof k.ai === "number" ? `• ${k.ai}` : ""}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              k.intent === "Transactional"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : k.intent === "Commercial"
                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                : k.intent === "Informational"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
                : "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
            }`}
          >
            {k.intent}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Difficulty</span>
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">
            {k.difficulty}
          </span>
        </div>
        <div className="mt-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${k.difficulty}%` }}
          />
        </div>
        <div className="mt-1 text-xs flex items-center justify-between">
          <span className={k.trendPct >= 0 ? "text-green-600" : "text-rose-600"}>
            {k.trendPct >= 0 ? "📈" : "📉"} {Math.abs(k.trendPct)}%
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            vol {k.volume ?? "—"} • cpc {k.cpc ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

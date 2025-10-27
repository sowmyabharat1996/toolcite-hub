// components/tools/KeywordResearch/KeywordList.tsx
"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { KeywordSourceBlock, KeywordItem, explainPick } from "./utils";

export default function KeywordList({
  blocks, highlightId,
}: { blocks: KeywordSourceBlock[]; highlightId?: string | null }) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {blocks.map((block) => (
        <div key={block.source} className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/70 dark:bg-white/5">
          <div className="text-lg font-semibold mb-2">{block.source}</div>
          <div className="space-y-2">
            {block.items.map((k) => <Card key={k.id} k={k} highlight={k.id === highlightId} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ k, highlight }: { k: KeywordItem; highlight: boolean }) {
  const reasons = explainPick(k);
  const [hovered, setHovered] = useState(false);
  const [placeAbove, setPlaceAbove] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!hovered || typeof window === "undefined") return;
    const card = cardRef.current; const tip = tipRef.current;
    if (!card || !tip) return;
    const compute = () => {
      const rect = card.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      const tipH = tr.height || tip.scrollHeight || 0;
      const tipW = tr.width || tip.scrollWidth || 0;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = vh - rect.bottom, spaceAbove = rect.top;
      const spaceRight = vw - rect.right, spaceLeft = rect.left;
      setPlaceAbove(spaceBelow < tipH + 12 && spaceAbove > spaceBelow);
      setAlignRight(spaceRight < tipW * 0.6 && spaceLeft > spaceRight);
    };
    const raf = requestAnimationFrame(compute);
    const onResize = () => compute();
    const onScroll = () => compute();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onScroll); };
  }, [hovered]);

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-xl p-3 border transition-shadow duration-300 ${highlight
          ? "border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"
          : "border-neutral-200/70 dark:border-neutral-800"}`}
      aria-label={reasons.length ? `Why this pick? ${reasons.join("; ")}` : undefined}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      tabIndex={0} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}
      onClick={() => setHovered(v => !v)} // tap toggles on mobile
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{k.phrase}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          k.intent === "Transactional" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          : k.intent === "Commercial" ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
          : k.intent === "Informational" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
          : "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"}`}>
          {k.intent}
        </span>
      </div>

      {/* Metrics */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Difficulty</span>
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">{k.difficulty}</span>
        </div>
        <div className="mt-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700" style={{ width: `${k.difficulty}%` }} />
        </div>
        <div className="mt-1 text-xs flex items-center gap-2">
          <span className={k.trendPct >= 0 ? "text-green-600" : "text-rose-600"}>
            {k.trendPct >= 0 ? "📈" : "📉"} {Math.abs(k.trendPct)}%
          </span>
          {typeof k.volume === "number" && <span className="text-neutral-500">vol {k.volume}</span>}
          {typeof k.cpc === "number" && <span className="text-neutral-500">cpc {k.cpc}</span>}
          {typeof k.ai === "number" && <span className="ml-auto text-neutral-800 dark:text-neutral-100 font-semibold">AI {k.ai}</span>}
        </div>
      </div>

      {/* Tooltip */}
      {reasons.length > 0 && (
        <div
          ref={tipRef}
          className={`pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-20
                     ${placeAbove ? "bottom-full mb-2" : "top-full mt-2"} ${alignRight ? "right-3" : "left-3"}`}
          style={{ maxWidth: 360 }}
        >
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/95 shadow-xl p-3">
            <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">Why this pick?</div>
            <ul className="mt-1 list-disc pl-4 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5">
              {reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

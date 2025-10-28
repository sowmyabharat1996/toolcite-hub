"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
import { createPortal } from "react-dom";
import { KeywordSourceBlock, KeywordItem, explainPick } from "./utils";

export default function KeywordList({
  blocks,
  highlightId,
}: {
  blocks: KeywordSourceBlock[];
  highlightId?: string | null;
}) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-visible">
      {blocks.map((block) => (
        <section
          key={block.source}
          className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/70 dark:bg-white/5 overflow-visible"
          aria-labelledby={`h-${block.source}`}
        >
          <h2 id={`h-${block.source}`} className="text-lg font-semibold mb-2">{block.source}</h2>
          <div className="space-y-2 overflow-visible">
            {block.items.map((k) => (
              <Card key={k.id} k={k} highlight={k.id === highlightId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function Card({ k, highlight }: { k: KeywordItem; highlight: boolean }) {
  const reasons = useMemo(() => explainPick(k), [k]);
  const [open, setOpen] = useState(false);

  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [width, setWidth] = useState(280);
  const [placeAbove, setPlaceAbove] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const card = cardRef.current;
      const tip = tipRef.current;
      if (!card || !tip) return;
      const r = card.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;

      const w = Math.min(360, Math.max(260, Math.round(tr.width || r.width)));
      setWidth(w);

      const needFlip = vh - r.bottom < tr.height + 12 && r.top > vh - r.bottom;
      setPlaceAbove(needFlip);

      let l = r.left + 12;
      let pinRight = false;
      if (l + w + 12 > vw) {
        pinRight = true;
        l = Math.max(12, r.right - w - 12);
      }
      setAlignRight(pinRight);

      const t = needFlip ? r.top - tr.height - 8 : r.bottom + 8;
      setTop(Math.max(8, t));
      setLeft(Math.max(8, l));
    };

    const raf = requestAnimationFrame(compute);
    const onResize = () => compute();
    const onScroll = () => compute();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  return (
    <>
      <div
        ref={cardRef}
        className={`group relative rounded-xl p-3 border transition-shadow duration-300
          ${highlight ? "border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" : "border-neutral-200/70 dark:border-neutral-800"}
          focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900`}
        aria-label={reasons.length ? `Why this pick? ${reasons.join("; ")}` : undefined}
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); }
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{k.phrase}</div>
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
            aria-label={`Intent ${k.intent}`}
          >
            {k.intent}
          </span>
        </div>

        {/* Metrics */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Difficulty</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-200">{k.difficulty}</span>
          </div>
          <div className="mt-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={k.difficulty} aria-label="Difficulty">
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
      </div>

      {/* Tooltip */}
      {reasons.length > 0 && open && (
        <BodyPortal>
          <div
            ref={tipRef}
            style={{ position: "fixed", top, left, width, zIndex: 10000, pointerEvents: "none" }}
            role="tooltip"
            aria-live="polite"
          >
            <span
              aria-hidden
              className={`absolute h-3 w-3 rotate-45 border border-neutral-200 dark:border-neutral-700
                ${placeAbove ? "bottom-0 translate-y-1" : "-top-1"}
                ${alignRight ? "right-6" : "left-6"}
                bg-white dark:bg-neutral-900`}
            />
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/95 shadow-xl p-3 relative">
              <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">Why this pick?</div>
              <ul className="mt-1 list-disc pl-4 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5">
                {reasons.map((r, i) => (<li key={i}>{r}</li>))}
              </ul>
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}

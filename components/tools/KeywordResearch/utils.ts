// components/tools/KeywordResearch/utils.ts
export type Intent = "Navigational" | "Transactional" | "Informational" | "Commercial";
export type Source = "Google" | "YouTube" | "Bing" | "Amazon";

export type KeywordItem = {
  id: string;
  phrase: string;
  difficulty: number; // 0-100
  intent: Intent;
  source: Source;
  trendPct: number; // -15..+15
  volume?: number;  // 0-100 (sim)
  cpc?: number;     // 0-100 (sim)
  ai?: number;      // 0-100 (AI score)
};

export type KeywordSourceBlock = { source: Source; items: KeywordItem[] };

export type Metrics = {
  total: number;
  avgDifficulty: number;
  byIntent: Record<Intent, number>;
  health: number; // 0-100 derived (higher is better)
};

export type Dataset = { data: KeywordSourceBlock[]; metrics: Metrics };

// ---------- helpers ----------
const INTENTS: Intent[] = ["Navigational", "Transactional", "Informational", "Commercial"];
const SOURCES: Source[] = ["Google", "YouTube", "Bing", "Amazon"];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function slugNum(seed: string) {
  return seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) || 7;
}

// ---------------- Metrics (advanced) -----------------
export function computeMetrics(blocks: KeywordSourceBlock[]): Metrics {
  const all = blocks.flatMap((b) => b.items);
  const total = all.length;
  const avgDifficulty = total ? Math.round(all.reduce((s, k) => s + k.difficulty, 0) / total) : 0;
  const byIntent: Record<Intent, number> = {
    Navigational: 0, Transactional: 0, Informational: 0, Commercial: 0,
  };
  all.forEach((k) => { byIntent[k.intent]++; });
  const health = Math.max(0, Math.min(100, Math.round(100 - avgDifficulty)));
  return { total, avgDifficulty, byIntent, health };
}

/** Compute a slightly richer KSI that reacts to vol/CPC as "opportunity". */
export function computeMetricsAdvanced(blocks: KeywordSourceBlock[]): Metrics {
  const base = computeMetrics(blocks);
  const all = blocks.flatMap(b => b.items);
  if (!all.length) return { ...base, health: 0 };
  const avgVol = all.reduce((s, k) => s + (k.volume ?? 0), 0) / all.length;
  const avgCpc = all.reduce((s, k) => s + (k.cpc ?? 0), 0) / all.length;
  const ease = 1 - base.avgDifficulty / 100;        // 0..1
  const opportunity = 0.7 * (avgVol / 100) + 0.3 * (avgCpc / 100); // 0..1
  const ksi = Math.round(100 * (0.65 * ease + 0.35 * opportunity));
  return { ...base, health: Math.max(0, Math.min(100, ksi)) };
}

// --------------- Mock data -------------------------
export function generateMockData(seed: string): Dataset {
  const rand = mulberry32(slugNum(seed || "toolcite"));
  function randomIntent(): Intent { return INTENTS[Math.floor(rand() * INTENTS.length)]; }
  function kw(phrase: string, source: Source): KeywordItem {
    const difficulty = Math.round(rand() * 70 + 10);           // 10..80
    const trendPct = Math.round((rand() * 30 - 15) * 10) / 10; // -15..+15
    const volume = Math.round(rand() * 100);
    const cpc = Math.round(rand() * 100);
    return {
      id: `${source}-${phrase}-${Math.floor(rand() * 1e9)}`,
      phrase, difficulty, intent: randomIntent(), source, trendPct, volume, cpc,
    };
  }
  const blocks: KeywordSourceBlock[] = SOURCES.map((src) => {
    const base = seed || src.toLowerCase();
    const count = 6 + Math.floor(rand() * 4);
    const items: KeywordItem[] = Array.from({ length: count }, (_, i) => kw(`${base} ${i + 1}`, src));
    return { source: src, items };
  });
  return { data: blocks, metrics: computeMetrics(blocks) };
}

// --------------- CSV + download --------------------
export function toCSV(blocks: KeywordSourceBlock[]) {
  const header = ["Source", "Keyword", "Intent", "Difficulty", "Trend %", "Volume", "CPC", "AI"];
  const rows = blocks.flatMap((b) =>
    b.items.map((k) => [
      b.source, k.phrase, k.intent, String(k.difficulty), `${k.trendPct}`,
      k.volume ?? "", k.cpc ?? "", k.ai ?? "",
    ])
  );
  return [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --------------- Share URL -------------------------
type ShareOpts = {
  df?: [number, number];
  vol?: number;
  cpc?: number;
  sortAI?: boolean;
  text?: string;
  chips?: string[];
};
export function shareURLFromSeed(seed: string, opts: ShareOpts = {}) {
  const url = new URL(typeof window !== "undefined" ? window.location.href : "https://toolcite.com/tools");
  url.searchParams.set("q", seed);
  if (opts.df) url.searchParams.set("df", `${opts.df[0]}-${opts.df[1]}`);
  if (typeof opts.vol === "number") url.searchParams.set("vol", String(opts.vol));
  if (typeof opts.cpc === "number") url.searchParams.set("cpc", String(opts.cpc));
  if (opts.sortAI) url.searchParams.set("ai", "1"); else url.searchParams.delete("ai");
  if (opts.text && opts.text.trim()) url.searchParams.set("qf", opts.text.trim());
  if (opts.chips && opts.chips.length) url.searchParams.set("chips", opts.chips.join("."));
  return url.toString();
}

// ---------- AI Insight ----------
const INTENT_WEIGHT: Record<Intent, number> = {
  Transactional: 1.0, Commercial: 0.9, Informational: 0.6, Navigational: 0.5,
};
export function aiScore(k: KeywordItem): number {
  const vol = k.volume ?? 40;
  const cpcBoost = Math.min((k.cpc ?? 0) / 100, 0.3);
  const reach = vol / 100 + cpcBoost;         // 0..1.3
  const ease = 1 - k.difficulty / 100;        // 0..1
  const iw = INTENT_WEIGHT[k.intent] ?? 0.6;
  return Math.round(100 * (0.55 * ease + 0.35 * reach + 0.10 * iw));
}
export function runAIInsight(blocks: KeywordSourceBlock[]) {
  const all = blocks.flatMap((b) => b.items);
  const scores: Record<string, number> = {};
  all.forEach((k) => (scores[k.id] = aiScore(k)));
  const top3 = [...all].map((k) => ({ ...k, ai: scores[k.id] }))
                       .sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0))
                       .slice(0, 3);
  return { top3, scores };
}

// ---------- Simulation (Volume & CPC) ----------
function clamp01x100(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }
export function applyVolumeCPCSimulation(
  base: KeywordSourceBlock[],
  volSim: number,
  cpcSim: number
): { blocks: KeywordSourceBlock[]; estClicks: number } {
  const factorVol = (volSim || 0) / 50; // 0..2
  const factorCpc = (cpcSim || 0) / 50; // 0..2
  let estClicks = 0;
  const blocks = base.map((b) => ({
    ...b,
    items: b.items.map((k) => {
      const vol0 = k.volume ?? 50;
      const cpc0 = k.cpc ?? 50;
      const volume = clamp01x100(vol0 * factorVol);
      const cpc = clamp01x100(cpc0 * factorCpc);
      const scored: KeywordItem = { ...k, volume, cpc, ai: aiScore({ ...k, volume, cpc }) };
      estClicks += volume * (1 - k.difficulty / 100);
      return scored;
    }),
  }));
  return { blocks, estClicks: Math.round(estClicks) };
}

// ---------- Filters (Step 4) ----------
export function applyDifficultyFilter(blocks: KeywordSourceBlock[], minDiff: number, maxDiff: number) {
  return blocks.map(b => ({ ...b, items: b.items.filter(k => k.difficulty >= minDiff && k.difficulty <= maxDiff) }));
}

export function applyTextFilter(
  blocks: KeywordSourceBlock[],
  text: string,
  chips: string[]
) {
  const t = (text || "").trim().toLowerCase();
  const activeChips = new Set(chips.map(c => c.toLowerCase()));
  return blocks.map(b => ({
    ...b,
    items: b.items.filter(k => {
      const p = k.phrase.toLowerCase();
      const passText = t ? p.includes(t) : true;
      const passChip = activeChips.size ? [...activeChips].some(c => p.includes(c)) : true;
      return passText && passChip;
    })
  }));
}

// ---------- Master recompute pipeline ----------
export function recomputeAll(
  base: KeywordSourceBlock[],
  volSim: number,
  cpcSim: number,
  minDiff: number,
  maxDiff: number,
  textFilter?: string,
  chipFilter?: string[]
) {
  const sim = applyVolumeCPCSimulation(base, volSim, cpcSim);
  const afterDiff = applyDifficultyFilter(sim.blocks, minDiff, maxDiff);
  const afterText = applyTextFilter(afterDiff, textFilter || "", chipFilter || []);
  const totalBefore = sim.blocks.flatMap(b => b.items).length;
  const totalAfter = afterText.flatMap(b => b.items).length;

  const { top3, scores } = runAIInsight(afterText);
  const scoredBlocks = afterText.map((b) => ({
    ...b, items: b.items.map((k) => ({ ...k, ai: scores[k.id] ?? k.ai })),
  }));
  const metrics = computeMetricsAdvanced(scoredBlocks);
  return { blocks: scoredBlocks, metrics, estClicks: sim.estClicks, top3, totalBefore, totalAfter };
}

// ---------- Shared explanation ----------
export function explainPick(k: KeywordItem): string[] {
  const reasons: string[] = [];
  if (k.difficulty <= 25) reasons.push("Very low difficulty — quick win potential");
  else if (k.difficulty <= 40) reasons.push("Manageable difficulty — realistic to rank");
  if ((k.volume ?? 0) >= 70) reasons.push("Strong search volume signal");
  else if ((k.volume ?? 0) >= 50) reasons.push("Decent search interest");
  if ((k.cpc ?? 0) >= 70) reasons.push("High CPC — monetizable traffic");
  else if ((k.cpc ?? 0) >= 50) reasons.push("Above-average CPC — revenue opportunity");
  if (k.intent === "Transactional" || k.intent === "Commercial") reasons.push(`Buyer intent leaning ${k.intent.toLowerCase()}`);
  if (k.trendPct > 0) reasons.push(`Positive trend (${k.trendPct}% ↑)`);
  return reasons.slice(0, 3);
}

// Legacy helper if you still use it anywhere
export function pickEasiestKeyword(blocks: KeywordSourceBlock[]) {
  const all = blocks.flatMap((b) => b.items);
  if (!all.length) return null;
  return all.reduce((min, k) => (k.difficulty < min.difficulty ? k : min), all[0]);
}

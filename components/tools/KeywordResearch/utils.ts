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

export function shareURLFromSeed(seed: string) {
  const url = new URL(typeof window !== "undefined" ? window.location.href : "https://toolcite.com/tools");
  url.searchParams.set("q", seed);
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

// ---------- Shared explanation for "Why this pick?" ----------
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

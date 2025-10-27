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
  volume?: number;  // 0-100 (sim scale)
  cpc?: number;     // 0-100 (sim scale)
  ai?: number;      // 0-100 (AI score)
};

export type KeywordSourceBlock = {
  source: Source;
  items: KeywordItem[];
};

export type Metrics = {
  total: number;
  avgDifficulty: number;
  byIntent: Record<Intent, number>;
  health: number; // 0-100 derived (higher is better)
};

export type Dataset = {
  data: KeywordSourceBlock[];
  metrics: Metrics;
};

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
    Navigational: 0,
    Transactional: 0,
    Informational: 0,
    Commercial: 0,
  };
  all.forEach((k) => {
    byIntent[k.intent]++;
  });

  // simple “health”: invert difficulty
  const health = Math.max(0, Math.min(100, Math.round(100 - avgDifficulty)));
  return { total, avgDifficulty, byIntent, health };
}

export function generateMockData(seed: string): Dataset {
  const rand = mulberry32(slugNum(seed || "toolcite"));

  function randomIntent(): Intent {
    return INTENTS[Math.floor(rand() * INTENTS.length)];
  }

  function kw(phrase: string, source: Source): KeywordItem {
    const difficulty = Math.round(rand() * 70 + 10); // 10..80
    const trendPct = Math.round((rand() * 30 - 15) * 10) / 10; // -15..+15
    const volume = Math.round(rand() * 100);
    const cpc = Math.round(rand() * 100);
    return {
      id: `${source}-${phrase}-${Math.floor(rand() * 1e9)}`,
      phrase,
      difficulty,
      intent: randomIntent(),
      source,
      trendPct,
      volume,
      cpc,
      ai: undefined,
    };
  }

  const blocks: KeywordSourceBlock[] = SOURCES.map((src) => {
    const base = seed || src.toLowerCase();
    const count = 6 + Math.floor(rand() * 4); // 6–9 items per source
    const items: KeywordItem[] = Array.from({ length: count }, (_, i) =>
      kw(`${base} ${i + 1}`, src)
    );
    return { source: src, items };
  });

  return { data: blocks, metrics: computeMetrics(blocks) };
}

export function toCSV(blocks: KeywordSourceBlock[]) {
  const header = ["Source", "Keyword", "Intent", "Difficulty", "Trend %", "Volume", "CPC", "AI"];
  const rows = blocks.flatMap((b) =>
    b.items.map((k) => [
      b.source,
      k.phrase,
      k.intent,
      String(k.difficulty),
      `${k.trendPct}`,
      k.volume ?? "",
      k.cpc ?? "",
      k.ai ?? "",
    ])
  );
  return [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function shareURLFromSeed(seed: string) {
  const url = new URL(
    typeof window !== "undefined" ? window.location.href : "https://toolcite.com/tools"
  );
  url.searchParams.set("q", seed);
  return url.toString();
}

// ---------- AI Insight ----------

const INTENT_WEIGHT: Record<Intent, number> = {
  Transactional: 1.0,
  Commercial: 0.9,
  Informational: 0.6,
  Navigational: 0.5,
};

export function aiScore(k: KeywordItem): number {
  const vol = k.volume ?? 40;
  const cpcBoost = Math.min((k.cpc ?? 0) / 100, 0.3); // small premium
  const reach = vol / 100 + cpcBoost; // 0..1.3
  const ease = 1 - k.difficulty / 100; // 0..1
  const iw = INTENT_WEIGHT[k.intent] ?? 0.6;
  return Math.round(100 * (0.55 * ease + 0.35 * reach + 0.1 * iw));
}

export function runAIInsight(blocks: KeywordSourceBlock[]) {
  const all = blocks.flatMap((b) => b.items);
  const scores: Record<string, number> = {};
  all.forEach((k) => (scores[k.id] = aiScore(k)));
  const top3 = [...all]
    .map((k) => ({ ...k, ai: scores[k.id] }))
    .sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0))
    .slice(0, 3);
  return { top3, scores };
}

// ---------- Simulation (Volume & CPC) ----------

function clamp01x100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Apply simulator:
 * - volSim / cpcSim are 0..100 sliders. We scale baseline values by factor.
 * - factorVol = volSim / 50 (0..2), factorCpc = cpcSim / 50 (0..2)
 * - recompute AI score for each item
 * - return adjusted blocks and estimated monthly clicks
 */
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
      const vol = clamp01x100(vol0 * factorVol);
      const cpc = clamp01x100(cpc0 * factorCpc);
      const scored: KeywordItem = { ...k, volume: vol, cpc, ai: aiScore({ ...k, volume: vol, cpc }) };
      estClicks += vol * (1 - k.difficulty / 100); // toy model
      return scored;
    }),
  }));

  estClicks = Math.round(estClicks); // simple integer KPI
  return { blocks, estClicks };
}

// pick the easiest keyword (lowest difficulty) – still used in basic mode
export function pickEasiestKeyword(blocks: KeywordSourceBlock[]): KeywordItem | null {
  const all = blocks.flatMap((b) => b.items);
  if (!all.length) return null;
  return all.reduce((min, k) => (k.difficulty < min.difficulty ? k : min), all[0]);
}

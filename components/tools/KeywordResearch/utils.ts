// components/tools/KeywordResearch/utils.ts
export type Intent = "Navigational" | "Transactional" | "Informational" | "Commercial";

export type Source = "Google" | "YouTube" | "Bing" | "Amazon";

export type KeywordItem = {
  id: string;
  phrase: string;
  difficulty: number; // 0-100
  intent: Intent;
  source: Source;
  trendPct: number;   // -15 to +15 simulated percentage change
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

// tiny seeded RNG so "same seed → same data"
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
  const all = blocks.flatMap(b => b.items);
  const total = all.length;
  const avgDifficulty = total ? Math.round(all.reduce((s, k) => s + k.difficulty, 0) / total) : 0;
  const byIntent: Record<Intent, number> = {
    Navigational: 0,
    Transactional: 0,
    Informational: 0,
    Commercial: 0,
  };
  all.forEach(k => { byIntent[k.intent]++; });

  // simple “health”: invert difficulty & weight lower diff more
  const health = Math.max(0, Math.min(100, Math.round(100 - avgDifficulty)));

  return { total, avgDifficulty, byIntent, health };
}

export function generateMockData(seed: string): Dataset {
  const rand = mulberry32(slugNum(seed || "toolcite"));

  function randomIntent(): Intent {
    return INTENTS[Math.floor(rand() * INTENTS.length)];
  }

  function kw(phrase: string, source: Source): KeywordItem {
    const difficulty = Math.round(rand() * 70 + 10);      // 10..80
    const trendPct = Math.round((rand() * 30 - 15) * 10) / 10; // -15..+15
    return {
      id: `${source}-${phrase}-${Math.floor(rand() * 1e6)}`,
      phrase,
      difficulty,
      intent: randomIntent(),
      source,
      trendPct,
    };
  }

  const blocks: KeywordSourceBlock[] = SOURCES.map((src) => {
    const base = seed || src.toLowerCase();
    // create 6–9 items per source
    const count = 6 + Math.floor(rand() * 4);
    const items: KeywordItem[] = Array.from({ length: count }, (_, i) =>
      kw(`${base} ${i + 1}`, src)
    );
    return { source: src, items };
  });

  return { data: blocks, metrics: computeMetrics(blocks) };
}

export function toCSV(blocks: KeywordSourceBlock[]) {
  const header = ["Source", "Keyword", "Intent", "Difficulty", "Trend %"];
  const rows = blocks.flatMap(b =>
    b.items.map(k => [b.source, k.phrase, k.intent, String(k.difficulty), `${k.trendPct}`])
  );
  return [header, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function shareURLFromSeed(seed: string) {
  const url = new URL(typeof window !== "undefined" ? window.location.href : "https://toolcite.com/tools");
  url.searchParams.set("q", seed);
  return url.toString();
}

// pick the easiest keyword (lowest difficulty) for "AI Insight"
export function pickEasiestKeyword(blocks: KeywordSourceBlock[]): KeywordItem | null {
  const all = blocks.flatMap(b => b.items);
  if (!all.length) return null;
  return all.reduce((min, k) => (k.difficulty < min.difficulty ? k : min), all[0]);
}

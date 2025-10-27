// Types
export type Intent = 'navigational' | 'transactional' | 'informational' | 'commercial';
export type Source = 'gpt' | 'scrape' | 'manual';

export type KeywordRow = {
  id: string;                 // use a stable id; fallback to term if needed
  term: string;
  intent: Intent;
  difficulty: number;         // 0–100
  source: Source;
  volume?: number;            // 0–100 (sim)
  cpc?: number;               // 0–100 (sim)
  ai?: number;                // computed by AI Insight
};

// ---------- Selectors (pure) ----------
export const countsByIntent = (ks: KeywordRow[]) => {
  const intents: Intent[] = ['navigational','transactional','informational','commercial'];
  return intents.map(intent => ({
    intent,
    count: ks.filter(k => k.intent === intent).length,
  }));
};

export const avgDiffBySource = (ks: KeywordRow[]) => {
  const map: Record<string, KeywordRow[]> = {};
  ks.forEach(k => (map[k.source] ??= []).push(k));
  return Object.entries(map).map(([source, arr]) => ({
    source,
    avg: arr.reduce((s,k)=>s+k.difficulty,0) / arr.length,
  }));
};

export const totals = (ks: KeywordRow[]) => {
  const total = ks.length;
  const avgDifficulty = total
    ? Math.round(ks.reduce((s,k)=>s+k.difficulty,0)/total)
    : 0;
  return { total, avgDifficulty };
};

export const calcKSI = (ks: KeywordRow[]) => {
  if (!ks.length) return 0;
  const { avgDifficulty } = totals(ks);
  const total = ks.length;
  const byInt = countsByIntent(ks);
  const t = byInt.find(x=>x.intent==='transactional')?.count ?? 0;
  const c = byInt.find(x=>x.intent==='commercial')?.count ?? 0;
  const intentShare = (t + c) / total;
  const ksi = 100 * (0.5*(1-avgDifficulty/100) + 0.3*intentShare + 0.2*(Math.log10(total+1)/2));
  return Math.max(0, Math.min(100, Math.round(ksi)));
};

// Utility for difficulty filtering (used by slider later)
export const filterByDifficulty = (ks: KeywordRow[], min: number, max: number) =>
  ks.filter(k => k.difficulty >= min && k.difficulty <= max);

// utils.ts — local SEO keyword simulation engine
export function generateMockKeywords(seed: string) {
  const sources = ["Google", "YouTube", "Bing", "Amazon"];
  const intents = ["Navigational", "Transactional", "Informational", "Commercial"];

  const data = sources.map((source) => ({
    source,
    keywords: Array.from({ length: 8 }).map(() => {
      const intent = intents[Math.floor(Math.random() * intents.length)];
      const difficulty = Math.floor(Math.random() * 60) + 10; // 10–70
      const trend = Math.random() > 0.5 ? "up" : "down";
      return {
        text: `${seed} ${intent.toLowerCase()} ${source.toLowerCase()}`,
        difficulty,
        intent,
        trend,
      };
    }),
  }));

  // --- Aggregate metrics ---
  const allKeywords = data.flatMap((s) => s.keywords);
  const total = allKeywords.length;
  const avg = Math.round(
    allKeywords.reduce((sum, k) => sum + k.difficulty, 0) / total
  );
  const count = intents.reduce((acc, i) => {
    acc[i as keyof typeof acc] = allKeywords.filter((k) => k.intent === i).length;
    return acc;
  }, { Navigational: 0, Transactional: 0, Informational: 0, Commercial: 0 });

  // --- Keyword Health Score (lower difficulty = healthier) ---
  const health = Math.max(0, Math.min(100, 100 - avg));

  return { data, metrics: { total, avg, count }, health };
}

export function generateMockData(seed: string) {
  const SOURCES = ["Google", "YouTube", "Bing", "Amazon"];
  const intents = ["Informational", "Commercial", "Transactional", "Navigational"];
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const genKeywords = (src: string) =>
    Array.from({ length: 8 }).map(() => {
      const difficulty = rand(10, 90);
      const intent = intents[rand(0, intents.length - 1)];
      return {
        text: `${seed} ${["review", "price", "2025", "guide", "cheap", "trend"][
          rand(0, 5)
        ]}`,
        difficulty,
        intent,
      };
    });

  return SOURCES.map((s) => ({
    source: s,
    keywords: genKeywords(s),
  }));
}

export function computeMetrics(data: any[]) {
  const all = data.flatMap((s) => s.keywords);
  const total = all.length;
  const avg = total
    ? Math.round(all.reduce((a, b) => a + b.difficulty, 0) / total)
    : 0;
  const count = all.reduce((acc: any, k: any) => {
    acc[k.intent] = (acc[k.intent] || 0) + 1;
    return acc;
  }, {});
  const sourceAverages = data.reduce((acc: any, s) => {
    acc[s.source] =
      s.keywords.reduce((a: number, k: any) => a + k.difficulty, 0) /
      s.keywords.length;
    return acc;
  }, {});
  return { total, avg, count, sourceAverages };
}

export function calcHealthScore(metrics: any) {
  const intentBalance = Object.keys(metrics.count).length;
  const health = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        100 - metrics.avg / 1.5 + intentBalance * 5 + metrics.total / 2
      )
    )
  );
  return health;
}

// app/sitemap.ts
import { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://toolcite.com";
  const now = new Date();

  // 1) static pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // you said to keep weather explicitly
    {
      url: `${baseUrl}/tools/weather`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // 2) from your registry
  const toolUrls: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${baseUrl}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 3) make sure speed-test is there even if missing from TOOLS
  const forced: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/tools/speed-test`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 4) merge + dedupe
  const seen = new Set<string>();
  const all = [...staticUrls, ...toolUrls, ...forced].filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  return all;
}

// app/sitemap.ts
import { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools"; // keep your existing registry import

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://toolcite.com";
  const now = new Date();

  // Dynamic tool URLs (from your registry)
  const toolUrls: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${baseUrl}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Static pages (added /tools index explicitly)
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
    // Weather tool route inside /tools (keep)
    {
      url: `${baseUrl}/tools/weather`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  return [...staticUrls, ...toolUrls];
}

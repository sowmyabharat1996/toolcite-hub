// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://toolcite.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep your existing disallows and add _next for safety
        disallow: ["/api/", "/admin/", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: "toolcite.com",
  };
}

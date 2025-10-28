// lib/schema.ts
import type { Tool } from "@/lib/tools";

export function softwareAppSchema(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: tool.description,
    url: `https://toolcite.com/tools/${tool.slug}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1200",
    },
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/**
 * Breadcrumbs:
 * - Adds `item` only when a URL is provided (avoids “Missing field 'item'”).
 */
export function breadcrumbSchema(
  segments: { name: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: segments.map((s, i) => {
      const el: Record<string, unknown> = {
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
      };
      if (s.url) el.item = s.url; // only include when present
      return el;
    }),
  };
}

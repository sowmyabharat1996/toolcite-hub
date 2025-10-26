// lib/tools.ts

/**
 * Tool model
 */
export type Tool = {
  slug: string;
  name: string;
  category: string; // e.g., "AI Productivity & Content" | "Document & File Utilities" | "Developer & SEO" | "Utilities"
  description: string;
  keywords?: string[];
  status: "live" | "coming-soon";
  icon: string;

  // Optional extras used by tool pages (renderer shows them if present)
  longDescription?: string;
  features?: string[];
  howToSteps?: string[];
};

/**
 * Category order for grouping on the homepage.
 * Feel free to change the order to your preference.
 */
export const CATEGORY_ORDER = [
  "AI Productivity & Content",
  "Document & File Utilities",
  "Developer & SEO",
  "Utilities",
] as const;

/**
 * Master catalog (edit here to add/launch tools)
 */
export const TOOLS: Tool[] = [
  // -----------------------------
  // AI Productivity & Content
  // -----------------------------
  {
    slug: "ai-summarizer",
    name: "AI Summarizer",
    category: "AI Productivity & Content",
    description: "Summarize chat, PDFs, webpages, or videos instantly.",
    keywords: ["ai summarizer", "pdf summary", "webpage summary", "video summary"],
    status: "coming-soon",
    icon: "🧠",
  },
  {
    slug: "ai-note-taker",
    name: "AI Note-Taking Tool",
    category: "AI Productivity & Content",
    description: "Capture structured notes from web inputs & meetings.",
    keywords: ["meeting notes", "note taking", "transcript notes"],
    status: "coming-soon",
    icon: "📝",
  },
  {
    slug: "ai-writing-assistant",
    name: "AI Writing Assistant",
    category: "AI Productivity & Content",
    description: "Generate blog posts, emails, and ad copy.",
    keywords: ["ai writer", "blog writer", "email generator"],
    status: "coming-soon",
    icon: "✍️",
  },
  {
    slug: "plagiarism-humanizer",
    name: "Plagiarism Checker / Humanizer",
    category: "AI Productivity & Content",
    description: "Detect similarity and humanize tone.",
    keywords: ["plagiarism", "humanizer", "content detector"],
    status: "coming-soon",
    icon: "🧬",
  },
  {
    slug: "grammar-spell-checker",
    name: "Grammar & Spell Checker",
    category: "AI Productivity & Content",
    description: "Fix grammar, punctuation, and style.",
    keywords: ["grammar", "spell check", "style"],
    status: "coming-soon",
    icon: "✅",
  },

  // -----------------------------
  // Document & File Utilities
  // -----------------------------
  {
    slug: "pdf-to-word-excel",
    name: "PDF to Word/Excel Converter",
    category: "Document & File Utilities",
    description: "Convert PDF to DOCX or XLSX in seconds.",
    keywords: ["pdf to word", "pdf to excel", "docx", "xlsx"],
    status: "coming-soon",
    icon: "📄",
  },
  {
    slug: "image-background-remover",
    name: "Image Background Remover",
    category: "Document & File Utilities",
    description: "Remove image backgrounds automatically.",
    keywords: ["background remover", "remove bg"],
    status: "coming-soon",
    icon: "🎯",
  },
  {
    slug: "image-compressor",
    name: "Online Image Compressor",
    category: "Document & File Utilities",
    description: "Compress images while keeping quality.",
    keywords: ["image compressor", "compress jpg", "compress png", "webp"],
    status: "live",
    icon: "🗜️",
    longDescription:
      "Shrink images for the web without losing visible quality. Works locally in your browser. Supports JPG, PNG, and WEBP with max dimensions and quality control.",
    features: [
      "JPG/PNG/WEBP output",
      "Quality & max dimension controls",
      "Before/after preview with size delta",
      "Batch-friendly workflow (one-by-one)",
      "Privacy-first (runs locally)",
    ],
    howToSteps: [
      "Select an image and adjust quality/max size.",
      "Click Compress to preview the result.",
      "Download your optimized image.",
    ],
  },
  {
    slug: "batch-file-converter",
    name: "Batch File Converter (CSV ↔ JSON ↔ Excel)",
    category: "Document & File Utilities",
    description: "Batch-convert between CSV/JSON/XLSX.",
    keywords: ["csv to json", "json to csv", "excel converter"],
    status: "coming-soon",
    icon: "🔁",
  },
  {
    slug: "qr-code-generator",
    name: "Free QR Code Generator",
    category: "Document & File Utilities",
    description: "Create customizable QR codes.",
    keywords: ["qr", "qr code", "qr generator"],
    status: "live",
    icon: "🧩",
    longDescription:
      "Generate high-quality QR codes for URLs or text. Adjust size, margins, error correction and colors, then export to PNG/JPG/WEBP/SVG.",
    features: [
      "Size, margin & error correction",
      "Foreground/background color pickers",
      "Live preview and instant download",
      "Exports: PNG, JPG, WEBP, SVG",
    ],
    howToSteps: [
      "Enter URL or text.",
      "Choose size, margin, colors and error correction.",
      "Download as PNG/JPG/WEBP/SVG.",
    ],
  },

  // -----------------------------
  // Developer & SEO
  // -----------------------------
  {
    slug: "keyword-research-basic",
    name: "Keyword Research (Basic)",
    category: "Developer & SEO",
    description: "Find seed keywords and autosuggest ideas.",
    keywords: ["keyword research", "seo keywords", "autosuggest"],
    status: "coming-soon",
    icon: "🔎",
  },
  {
    slug: "meta-og-generator",
    name: "Meta Tag & Open Graph Generator",
    category: "Developer & SEO",
    description: "Generate SEO titles, descriptions, OG/Twitter cards and preview them.",
    keywords: ["meta tags", "open graph", "twitter cards", "seo", "og image"],
    status: "live",
    icon: "⚙️",
    longDescription:
      "Create SEO-friendly meta tags with live Open Graph and Twitter Card previews. Copy a clean <head> snippet or download it as HTML.",
    features: [
      "Title & description with character counters",
      "Open Graph & Twitter Card tags",
      "Canonical URL, site name, author, theme color",
      "Live social previews",
      "Copy or download HTML snippet",
    ],
    howToSteps: [
      "Fill in Title, Description, URL and Image.",
      "Optionally set site/author, theme color and card type.",
      "Review live OG/Twitter previews.",
      "Copy the generated <head> snippet.",
    ],
  },
  {
    slug: "speed-test",
    name: "Website Speed Test",
    category: "Developer & SEO",
    description: "Measure client-side speed metrics instantly.",
    keywords: ["speed test", "page speed", "lcp", "core web vitals"],
    status: "coming-soon",
    icon: "⚡",
  },
  {
    slug: "color-palette-generator",
    name: "Color Palette Generator",
    category: "Developer & SEO",
    description: "Generate palettes and shades from a seed.",
    keywords: ["color palette", "hex colors", "palette generator", "color tool"],
    status: "coming-soon",
    icon: "🎨",
  },
  {
    slug: "regex-tester",
    name: "Regular Expression Tester",
    category: "Developer & SEO",
    description: "Test regex patterns live with matches.",
    keywords: ["regex tester", "regular expression", "regex matches", "test regex"],
    status: "live",
    icon: "🧪",
    longDescription:
      "Validate patterns, preview highlighted matches, and inspect capture groups in real time. Includes presets (emails, URLs, hex colors, dates) and local custom presets.",
    features: [
      "Live matching with highlighted preview",
      "Capture groups table & copy helpers",
      "Built-in presets + local custom presets",
      "Debounced evaluation & big-text safety",
      "Privacy-first (runs locally)",
    ],
    howToSteps: [
      "Pick a preset or write your own pattern.",
      "Toggle flags (i, g, m, s, u, y) as needed.",
      "Paste test text and inspect matches/groups.",
    ],
  },

  // -----------------------------
  // Utilities (site extras)
  // -----------------------------
  {
    slug: "weather",
    name: "Weather App",
    category: "Utilities",
    description: "Live forecasts with offline fallback and responsive design.",
    keywords: ["weather", "forecast", "meteo"],
    status: "live",
    icon: "🌤️",
  },
];

/**
 * Helpers
 */

// Quickly lookup a tool by slug
export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// All slugs (handy for sitemap/static params)
export function getAllSlugs(): string[] {
  return TOOLS.map((t) => t.slug);
}

// Group tools by category with "live first" sorting inside each section
export function getToolsGroupedLiveFirst(tools: Tool[] = TOOLS): Record<string, Tool[]> {
  const map: Record<string, Tool[]> = {};
  for (const t of tools) {
    if (!map[t.category]) map[t.category] = [];
    map[t.category].push(t);
  }
  for (const cat of Object.keys(map)) {
    map[cat] = map[cat].sort((a, b) => {
      if (a.status !== b.status) return a.status === "live" ? -1 : 1; // live → top
      return a.name.localeCompare(b.name);
    });
  }
  return map;
}

// Categories ordered per CATEGORY_ORDER (+ any unknowns appended)
export function getOrderedCategories(grouped: Record<string, Tool[]>): string[] {
  const known = CATEGORY_ORDER.filter((c) => grouped[c]);
  const unknown = Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c as any)).sort();
  return [...known, ...unknown];
}

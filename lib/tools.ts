// lib/tools.ts

export type ToolStatus = "live" | "coming-soon";

export type ToolCategory =
  | "AI Productivity & Content"
  | "Document & File"
  | "Developer & SEO";

export type Tool = {
  slug: string;                 // URL segment: /tools/[slug]
  name: string;                 // Display name
  category: ToolCategory;       // One of the categories above
  description: string;          // Short marketing line (cards/SEO)
  keywords: string[];           // For SEO metadata and discovery
  status: ToolStatus;           // "live" | "coming-soon"
  icon: string;                 // Emoji for visual identity

  // --- Optional content for richer pages/SEO (used where available) ---
  longDescription?: string;     // 1–3 sentence overview for tool page
  features?: string[];          // Bulleted feature list
  howToSteps?: string[];        // Step-by-step usage bullets
};

// Category order for navigation/sections
export const CATEGORY_ORDER: ToolCategory[] = [
  "AI Productivity & Content",
  "Document & File",
  "Developer & SEO",
];

// Master list of tools
export const TOOLS: Tool[] = [
  // ========== AI PRODUCTIVITY & CONTENT ==========
  {
    slug: "ai-summarizer",
    name: "AI Summarizer",
    category: "AI Productivity & Content",
    description: "Summarize chat, PDFs, webpages, or videos instantly.",
    keywords: ["ai summary", "summarizer", "pdf summary", "youtube summary"],
    status: "coming-soon",
    icon: "🧠",
  },
  {
    slug: "ai-note-taker",
    name: "AI Note-Taking Tool",
    category: "AI Productivity & Content",
    description: "Capture structured notes from web inputs & meetings.",
    keywords: ["ai notes", "meeting notes", "web notes"],
    status: "coming-soon",
    icon: "🗒️",
  },
  {
    slug: "ai-writing-assistant",
    name: "AI Writing Assistant",
    category: "AI Productivity & Content",
    description: "Generate blog posts, emails, and ad copy.",
    keywords: ["ai writing", "content generator", "email writer", "ad copy"],
    status: "coming-soon",
    icon: "✍️",
  },
  {
    slug: "plagiarism-humanizer",
    name: "Plagiarism Checker / Humanizer",
    category: "AI Productivity & Content",
    description: "Detect similarity and humanize tone.",
    keywords: ["plagiarism", "detector", "humanizer", "ai detection"],
    status: "coming-soon",
    icon: "🧬",
  },
  {
    slug: "grammar-spell-checker",
    name: "Grammar & Spell Checker",
    category: "AI Productivity & Content",
    description: "Fix grammar, punctuation, and style.",
    keywords: ["grammar checker", "spell check", "proofreading"],
    status: "coming-soon",
    icon: "✅",
  },
  // You preferred Weather in this bucket
  {
    slug: "weather",
    name: "Weather App",
    category: "AI Productivity & Content",
    description:
      "Live forecasts with offline fallback and responsive design.",
    keywords: ["weather", "forecast", "local weather"],
    status: "live",
    icon: "🌤️",
  },

  // ========== DOCUMENT & FILE ==========
  {
    slug: "pdf-to-word-excel",
    name: "PDF to Word/Excel Converter",
    category: "Document & File",
    description: "Convert PDF to DOCX or XLSX in seconds.",
    keywords: ["pdf to word", "pdf to excel", "convert pdf"],
    status: "coming-soon",
    icon: "📄",
  },
  {
    slug: "image-background-remover",
    name: "Image Background Remover",
    category: "Document & File",
    description: "Remove image backgrounds automatically.",
    keywords: ["remove background", "bg remover", "transparent background"],
    status: "coming-soon",
    icon: "🎯",
  },
  {
    slug: "image-compressor",
    name: "Online Image Compressor",
    category: "Document & File",
    description: "Compress images while keeping quality.",
    keywords: [
      "image compressor",
      "compress png",
      "compress jpg",
      "reduce image size",
    ],
    status: "live",
    icon: "🗜️",
  },
  {
    slug: "batch-file-converter",
    name: "Batch File Converter (CSV ↔ JSON ↔ Excel)",
    category: "Document & File",
    description: "Batch-convert between CSV/JSON/XLSX.",
    keywords: ["csv to json", "json to csv", "excel to csv", "batch convert"],
    status: "coming-soon",
    icon: "🔄",
  },
  {
    slug: "qr-code-generator",
    name: "Free QR Code Generator",
    category: "Document & File",
    description: "Create customizable QR codes.",
    keywords: ["qr code generator", "make qr", "download qr", "qr svg"],
    status: "live",
    icon: "🧾",
  },

  // ========== DEVELOPER & SEO ==========
  {
    slug: "keyword-research-basic",
    name: "Keyword Research (Basic)",
    category: "Developer & SEO",
    description: "Find seed keywords and autosuggest ideas.",
    keywords: ["keyword research", "seo keywords", "autosuggest"],
    status: "coming-soon",
    icon: "🔍",
  },
  {
    slug: "meta-og-generator",
    name: "Meta Tag & Open Graph Generator",
    category: "Developer & SEO",
    description: "Generate SEO meta, OG and Twitter cards.",
    keywords: ["meta tags", "open graph", "twitter cards", "seo"],
    status: "coming-soon",
    icon: "⚙️",
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
    keywords: [
      "regex tester",
      "regular expression",
      "regex matches",
      "test regex",
    ],
    status: "live",
    icon: "🧪",

    // Extra SEO/content fields used on the tool page
    longDescription:
      "Use this free online regex tester to quickly validate patterns, preview highlighted matches, and inspect capture groups. Supports common flags (i, g, m, s, u, y), built-in presets (emails, URLs, hex colors, dates) and custom presets with local storage.",
    features: [
      "Live matching with highlighted preview",
      "Capture groups table and copy buttons",
      "Built-in presets + save custom presets",
      "Keyboard shortcuts and debounced evaluation",
      "Privacy-first: runs locally in your browser",
    ],
    howToSteps: [
      "Choose a preset or type your own pattern.",
      "Toggle flags (i, g, m, s, u, y) as needed.",
      "Paste test text and review highlighted matches.",
      "Copy matches or groups as CSV/TSV/lines.",
    ],
  },
];

// ---------- Helpers (pages/sitemap/home can import these) ----------

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(cat: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === cat);
}

// Live-first sort inside categories (keep names alpha inside same status)
export function sortLiveFirst(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === "live" ? -1 : 1;
  });
}

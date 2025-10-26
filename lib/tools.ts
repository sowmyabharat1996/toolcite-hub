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
  description: "Find seed keywords and autosuggest ideas instantly from popular platforms.",
  keywords: ["keyword research", "seo keywords", "autosuggest", "keyword ideas", "content topics"],
  status: "live",
  icon: "🔍",
  longDescription:
    "Generate keyword ideas instantly from simulated Google, YouTube, Bing, and Amazon autosuggest data — all processed locally for privacy. Perfect for quick SEO ideation without any API or login requirements.",
  features: [
    "Instant offline keyword generation based on your seed keyword",
    "Simulated autosuggest results from Google, YouTube, Bing, and Amazon",
    "Copy individual or all keywords to clipboard",
    "Export results as a CSV file",
    "Share a link with your saved keyword seed",
    "100% client-side — no data sent anywhere",
  ],
  howToSteps: [
    "Enter your base or seed keyword (e.g., 'electric cars') in the input box.",
    "Click 'Generate Keywords' to see autosuggest ideas from multiple platforms.",
    "Click on any keyword to copy it instantly.",
    "Use 'Copy All' or 'Export CSV' for bulk download.",
    "Share your keyword seed with others using the 'Share Link' button.",
  ],
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
{ slug: "speed-test", name: "Website Speed Test", category: "Developer & SEO", description: "Analyze website load performance, TTFB, and connection metrics.", keywords: ["website speed test", "page load time", "ttfb test", "performance metrics"], status: "live", icon: "⚡", longDescription: "Quickly measure a website’s load speed, DNS lookup, TTFB, DOM load, and total render time directly in your browser. Runs locally with no external calls.", features: [ "Instant client-side performance test", "TTFB, DOM Load, and Total Load time metrics", "Network info (type, bandwidth, latency)", "Private and offline — no data sent anywhere", ], howToSteps: [ "Enter a website URL (with or without https://).", "Click 'Run Test' to analyze load metrics.", "View DNS, TTFB, DOM Load, and Total Load times.", "Compare different sites for speed optimization.", ], },

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

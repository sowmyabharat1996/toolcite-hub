// lib/tools.ts

export type ToolCategory =
  | "AI Productivity & Content"
  | "Document & File"
  | "Developer & SEO";

export type Tool = {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  keywords: string[];
  status?: "live" | "coming-soon";
  icon?: string; // emoji or short label
};

export const TOOLS: Tool[] = [
  // ───────────────────────────────────────────────────────────────
  // AI Productivity & Content
  // ───────────────────────────────────────────────────────────────
  {
    slug: "ai-summarizer",
    name: "AI Summarizer",
    category: "AI Productivity & Content",
    description: "Summarize chat, PDFs, webpages, or videos instantly.",
    keywords: [
      "ai summarizer",
      "pdf summary",
      "webpage summary",
      "video summary",
      "text summary online",
    ],
    status: "coming-soon",
    icon: "🧠",
  },
  {
    slug: "ai-note-taking",
    name: "AI Note-Taking",
    category: "AI Productivity & Content",
    description: "Capture structured notes from web inputs & meetings.",
    keywords: ["ai notes", "meeting notes", "note taker", "transcript notes"],
    status: "coming-soon",
    icon: "📝",
  },
  {
    slug: "ai-writing-assistant",
    name: "AI Writing Assistant",
    category: "AI Productivity & Content",
    description: "Generate blog posts, emails, and ad copy.",
    keywords: ["ai writer", "copy generator", "blog writing", "email writer"],
    status: "coming-soon",
    icon: "✍️",
  },
  {
    slug: "plagiarism-humanizer",
    name: "Plagiarism Checker / Humanizer",
    category: "AI Productivity & Content",
    description: "Detect similarity and humanize tone.",
    keywords: [
      "plagiarism checker",
      "content humanizer",
      "similarity check",
      "ai detector bypass",
    ],
    status: "coming-soon",
    icon: "🧩",
  },
  {
    slug: "grammar-spell-checker",
    name: "Grammar & Spell Checker",
    category: "AI Productivity & Content",
    description: "Fix grammar, punctuation, and style.",
    keywords: ["grammar check", "spell check", "proofreading", "style checker"],
    status: "coming-soon",
    icon: "✅",
  },
  {
    slug: "weather",
    name: "Weather App",
    category: "AI Productivity & Content",
    description: "Live forecasts with offline fallback and responsive design.",
    keywords: ["weather", "forecast", "local weather", "hourly weather"],
    status: "live",
    icon: "🌤️",
  },

  // ───────────────────────────────────────────────────────────────
  // Document & File Utilities
  // ───────────────────────────────────────────────────────────────
  {
    slug: "pdf-to-word-excel",
    name: "PDF to Word/Excel Converter",
    category: "Document & File",
    description: "Convert PDF to DOCX or XLSX in seconds.",
    keywords: ["pdf to word", "pdf to excel", "convert pdf", "pdf converter"],
    status: "coming-soon",
    icon: "📄",
  },
  {
    slug: "image-background-remover",
    name: "Image Background Remover",
    category: "Document & File",
    description: "Remove image backgrounds automatically.",
    keywords: [
      "remove background",
      "bg remover",
      "background eraser",
      "transparent background",
    ],
    status: "coming-soon",
    icon: "🎯",
  },
  {
    slug: "image-compressor",
    name: "Online Image Compressor",
    category: "Document & File",
    description: "Compress images while keeping quality.",
    keywords: ["image compressor", "reduce image size", "compress png", "compress jpg"],
    status: "coming-soon",
    icon: "🗜️",
  },
  {
    slug: "batch-file-converter",
    name: "Batch File Converter (CSV ↔ JSON ↔ Excel)",
    category: "Document & File",
    description: "Batch-convert between CSV/JSON/XLSX.",
    keywords: ["csv to json", "json to csv", "excel to csv", "batch converter"],
    status: "coming-soon",
    icon: "🔁",
  },
  {
    slug: "qr-code-generator",
    name: "Free QR Code Generator",
    category: "Document & File",
    description: "Create customizable QR codes.",
    keywords: ["qr generator", "make qr", "qr code creator", "download qr"],
    status: "live", // ⬅️ first live utility after Weather
    icon: "🔳",
  },

  // ───────────────────────────────────────────────────────────────
  // Developer & SEO Tools
  // ───────────────────────────────────────────────────────────────
  {
    slug: "keyword-research",
    name: "Keyword Research (Basic)",
    category: "Developer & SEO",
    description: "Find seed keywords and autosuggest ideas.",
    keywords: ["keyword tool", "seo keywords", "keyword ideas", "search volume"],
    status: "coming-soon",
    icon: "🔎",
  },
  {
    slug: "meta-og-generator",
    name: "Meta Tag & Open Graph Generator",
    category: "Developer & SEO",
    description: "Generate SEO meta, OG and Twitter cards.",
    keywords: [
      "meta generator",
      "open graph tags",
      "twitter card",
      "meta title description",
    ],
    status: "coming-soon",
    icon: "🔖",
  },
  {
    slug: "website-speed-test",
    name: "Website Speed Test",
    category: "Developer & SEO",
    description: "Measure client-side speed metrics instantly.",
    keywords: ["speed test", "pagespeed", "web vitals", "performance test"],
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
    status: "coming-soon",
    icon: "🧪",
  },
];

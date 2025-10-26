// lib/tools.ts
export type Tool = {
  slug: string;
  name: string;
  category: "AI Productivity & Content" | "Document & File" | "Developer & SEO";
  description: string;
  keywords: string[];
  status?: "live" | "coming-soon";
  icon?: string;
};

export const TOOLS: Tool[] = [
  { slug:"ai-summarizer", name:"AI Summarizer",
    category:"AI Productivity & Content",
    description:"Summarize chat, PDFs, webpages, or videos instantly.",
    keywords:["ai summarizer","pdf summary","webpage summary","video summary"],
    status:"coming-soon", icon:"🧠" },
  { slug:"ai-note-taking", name:"AI Note-Taking",
    category:"AI Productivity & Content",
    description:"Capture structured notes from web inputs & meetings.",
    keywords:["note tool","meeting notes","ai notes"], status:"coming-soon", icon:"📝" },
  { slug:"ai-writing-assistant", name:"AI Writing Assistant",
    category:"AI Productivity & Content",
    description:"Generate blog posts, emails, and ad copy.",
    keywords:["ai writer","copy generator","blog writing"], status:"coming-soon", icon:"✍️" },
  { slug:"plagiarism-humanizer", name:"Plagiarism Checker / Humanizer",
    category:"AI Productivity & Content",
    description:"Detect similarity and humanize tone.",
    keywords:["plagiarism checker","content humanizer"], status:"coming-soon", icon:"🧩" },
  { slug:"grammar-spell-checker", name:"Grammar & Spell Checker",
    category:"AI Productivity & Content",
    description:"Fix grammar, punctuation, and style.",
    keywords:["grammar check","spell check","proofreading"], status:"coming-soon", icon:"✅" },
{
  slug: "weather",
  name: "Weather App",
  category: "AI Productivity & Content", // (you can switch to "Utilities" later if you create that bucket)
  description: "Live forecasts with offline fallback and responsive design.",
  keywords: ["weather", "forecast", "local weather", "hourly weather"],
  status: "live",
  icon: "🌤️",
},

  { slug:"pdf-to-word-excel", name:"PDF to Word/Excel Converter",
    category:"Document & File",
    description:"Convert PDF to DOCX or XLSX in seconds.",
    keywords:["pdf to word","pdf to excel","convert pdf"], status:"coming-soon", icon:"📄" },
  { slug:"image-background-remover", name:"Image Background Remover",
    category:"Document & File",
    description:"Remove image backgrounds automatically.",
    keywords:["remove background","bg remover"], status:"coming-soon", icon:"🎯" },
  { slug:"image-compressor", name:"Online Image Compressor",
    category:"Document & File",
    description:"Compress images while keeping quality.",
    keywords:["image compressor","reduce image size"], status:"coming-soon", icon:"🗜️" },
  { slug:"batch-file-converter", name:"Batch File Converter (CSV ↔ JSON ↔ Excel)",
    category:"Document & File",
    description:"Batch-convert between CSV/JSON/XLSX.",
    keywords:["csv to json","excel to csv","batch converter"], status:"coming-soon", icon:"🔁" },
  { slug:"qr-code-generator", name:"Free QR Code Generator",
    category:"Document & File",
    description:"Create customizable QR codes.",
    keywords:["qr generator","make qr"], status:"coming-soon", icon:"🔳" },

  { slug:"keyword-research", name:"Keyword Research (Basic)",
    category:"Developer & SEO",
    description:"Find seed keywords and autosuggest ideas.",
    keywords:["keyword tool","seo keywords"], status:"coming-soon", icon:"🔎" },
  { slug:"meta-og-generator", name:"Meta Tag & Open Graph Generator",
    category:"Developer & SEO",
    description:"Generate SEO meta, OG and Twitter cards.",
    keywords:["meta generator","open graph tags"], status:"coming-soon", icon:"🔖" },
  { slug:"website-speed-test", name:"Website Speed Test",
    category:"Developer & SEO",
    description:"Measure client-side speed metrics instantly.",
    keywords:["speed test","pagespeed"], status:"coming-soon", icon:"⚡" },
  { slug:"color-palette-generator", name:"Color Palette Generator",
    category:"Developer & SEO",
    description:"Generate palettes and shades from a seed.",
    keywords:["color palette","hex colors"], status:"coming-soon", icon:"🎨" },
  { slug:"regex-tester", name:"Regular Expression Tester",
    category:"Developer & SEO",
    description:"Test regex patterns live with matches.",
    keywords:["regex tester","regular expression"], status:"coming-soon", icon:"🧪" },
];

"use client";

import React, { useMemo, useState } from "react";

const TITLE_MAX = 60;
const DESC_MAX = 160;
const PREVIEW_FALLBACK_IMAGE = "/og-default.png"; // UI-only fallback

type PresetKey = "tool" | "blog" | "home" | "product";
type SnippetTab = "html" | "next" | "basic" | "social";

const PRESETS: Record<
  PresetKey,
  {
    title: string;
    desc: string;
    url: string;
    siteName: string;
    author: string;
  }
> = {
  tool: {
    title: "Free Online Tool – Fast, Private, In-Browser",
    desc: "Use this free online tool to generate, test, and export SEO-ready data instantly.",
    url: "https://toolcite.com/tools/example",
    siteName: "ToolCite",
    author: "Bharat",
  },
  blog: {
    title: "How to Optimize Meta Tags for Social Sharing",
    desc: "A quick guide to title, description, OG, and Twitter tags that actually render right.",
    url: "https://toolcite.com/blog/meta-tags-guide",
    siteName: "ToolCite Blog",
    author: "Bharat",
  },
  home: {
    title: "ToolCite – 70+ Front-End Tools for Creators",
    desc: "SEO, dev, image, PDF — instantly usable, no login.",
    url: "https://toolcite.com",
    siteName: "ToolCite",
    author: "Bharat",
  },
  product: {
    title: "Product / Landing Page – Convert Visitors Faster",
    desc: "Add clean OG + Twitter tags so your links look premium in chat & social.",
    url: "https://toolcite.com/product/example",
    siteName: "ToolCite",
    author: "Bharat",
  },
};

function clamp(str: string, max: number) {
  return str.length > max ? str.slice(0, max) : str;
}

function escapeAttr(s: string) {
  return String(s).replace(/"/g, "&quot;");
}
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}
function meta(kind: "name" | "property", k: string, v: string) {
  return `<meta ${kind}="${escapeAttr(k)}" content="${escapeAttr(v)}" />`;
}
function ensureAt(s: string) {
  const t = s.trim();
  if (!t) return "";
  return t.startsWith("@") ? t : "@" + t;
}
function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function MetaOgGenerator() {
  const [preset, setPreset] = useState<PresetKey>("tool");

  const [title, setTitle] = useState(PRESETS.tool.title);
  const [desc, setDesc] = useState(PRESETS.tool.desc);
  const [url, setUrl] = useState(PRESETS.tool.url);
  const [siteName, setSiteName] = useState(PRESETS.tool.siteName);
  const [author, setAuthor] = useState(PRESETS.tool.author);
  const [image, setImage] = useState(""); // NOTE: stays empty by default — Option B
  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [twitterCard, setTwitterCard] = useState<"summary" | "summary_large_image">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("@toolcite");
  const [twitterCreator, setTwitterCreator] = useState("@bharat");
  const [activeTab, setActiveTab] = useState<SnippetTab>("html");

  // clamp for previews
  const safeTitle = clamp(title, TITLE_MAX);
  const safeDesc = clamp(desc, DESC_MAX);

  // UI-only preview image
  const previewImage = image.trim() || PREVIEW_FALLBACK_IMAGE;
  // but HTML should only include image when user really entered one
  const shouldEmitImage = image.trim().length > 0;

  function applyPreset(kind: PresetKey) {
    const p = PRESETS[kind];
    setPreset(kind);
    setTitle(p.title);
    setDesc(p.desc);
    setUrl(p.url);
    setSiteName(p.siteName);
    setAuthor(p.author);
    // image stays as user typed — don't overwrite
  }

  const htmlHeadSnippet = useMemo(() => {
    const lines: string[] = [];

    // title + description
    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name", "description", safeDesc));

    // theme color
    if (themeColor) lines.push(meta("name", "theme-color", themeColor));

    // canonical
    if (url.trim()) {
      lines.push(`<link rel="canonical" href="${escapeAttr(url.trim())}" />`);
    }

    // Open Graph
    if (safeTitle) lines.push(meta("property", "og:title", safeTitle));
    if (safeDesc) lines.push(meta("property", "og:description", safeDesc));
    if (url.trim()) lines.push(meta("property", "og:url", url.trim()));
    if (siteName.trim()) lines.push(meta("property", "og:site_name", siteName.trim()));
    lines.push(meta("property", "og:type", "website"));

    // Option B: emit og:image only if user typed one
    if (shouldEmitImage) {
      lines.push(meta("property", "og:image", image.trim()));
      lines.push(meta("property", "og:image:width", "1200"));
      lines.push(meta("property", "og:image:height", "630"));
      lines.push(meta("property", "og:image:alt", safeTitle || "Open Graph image"));
    }

    // Twitter
    lines.push(meta("name", "twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name", "twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name", "twitter:description", safeDesc));
    if (shouldEmitImage && twitterCard === "summary_large_image") {
      lines.push(meta("name", "twitter:image", image.trim()));
    }
    if (twitterSite.trim()) {
      lines.push(meta("name", "twitter:site", ensureAt(twitterSite)));
    }
    if (twitterCreator.trim()) {
      lines.push(meta("name", "twitter:creator", ensureAt(twitterCreator)));
    }

    // author (generic)
    if (author.trim()) {
      lines.push(meta("name", "author", author.trim()));
    }

    return lines.join("\n");
  }, [
    safeTitle,
    safeDesc,
    url,
    siteName,
    image,
    themeColor,
    twitterCard,
    twitterSite,
    twitterCreator,
    author,
    shouldEmitImage,
  ]);

  const nextJsMetadataSnippet = useMemo(() => {
    // this is informational for users; still honour option B
    const imgPart = shouldEmitImage
      ? `images: [{
      url: "${escapeAttr(image.trim())}",
      width: 1200,
      height: 630,
      alt: "${escapeAttr(safeTitle || "Open Graph image")}",
    }]`
      : "";
    return `export const metadata = {
  title: "${escapeAttr(safeTitle || "Meta Tag & Open Graph Generator")}",
  description: "${escapeAttr(safeDesc || "Generate SEO meta tags, Open Graph, Twitter cards, and canonical URLs.")}",
  alternates: { canonical: "${escapeAttr(url.trim() || "https://toolcite.com")}" },
  openGraph: {
    type: "website",
    title: "${escapeAttr(safeTitle || "Meta Tag & Open Graph Generator")}",
    description: "${escapeAttr(safeDesc || "Create social previews and meta tags for your pages quickly.")}",
    url: "${escapeAttr(url.trim() || "https://toolcite.com")}",
    siteName: "${escapeAttr(siteName || "ToolCite")}",
    ${imgPart}
  },
  twitter: {
    card: "${twitterCard}",
    title: "${escapeAttr(safeTitle || "Meta Tag & Open Graph Generator")}",
    description: "${escapeAttr(safeDesc || "Build meta tags for SEO, Facebook, and Twitter. Copy in 1 click.")}",
    ${shouldEmitImage ? `images: ["${escapeAttr(image.trim())}"],` : ""}
    site: "${escapeAttr(ensureAt(twitterSite) || "@site")}",
    creator: "${escapeAttr(ensureAt(twitterCreator) || "@creator")}",
  },
};`;
  }, [
    safeTitle,
    safeDesc,
    url,
    siteName,
    image,
    twitterCard,
    twitterSite,
    twitterCreator,
    shouldEmitImage,
  ]);

  const basicHeadSnippet = useMemo(() => {
    const lines: string[] = [];
    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name", "description", safeDesc));
    if (url.trim()) lines.push(`<link rel="canonical" href="${escapeAttr(url.trim())}" />`);
    return lines.join("\n");
  }, [safeTitle, safeDesc, url]);

  const socialOnlySnippet = useMemo(() => {
    const lines: string[] = [];
    if (safeTitle) lines.push(meta("property", "og:title", safeTitle));
    if (safeDesc) lines.push(meta("property", "og:description", safeDesc));
    if (url.trim()) lines.push(meta("property", "og:url", url.trim()));
    lines.push(meta("property", "og:type", "website"));
    if (siteName.trim()) lines.push(meta("property", "og:site_name", siteName.trim()));
    if (shouldEmitImage) lines.push(meta("property", "og:image", image.trim()));

    lines.push(meta("name", "twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name", "twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name", "twitter:description", safeDesc));
    if (shouldEmitImage && twitterCard === "summary_large_image") {
      lines.push(meta("name", "twitter:image", image.trim()));
    }
    return lines.join("\n");
  }, [safeTitle, safeDesc, url, siteName, twitterCard, image, shouldEmitImage]);

  let snippetToShow = htmlHeadSnippet;
  if (activeTab === "next") snippetToShow = nextJsMetadataSnippet;
  else if (activeTab === "basic") snippetToShow = basicHeadSnippet;
  else if (activeTab === "social") snippetToShow = socialOnlySnippet;

  const titleOver = title.length > TITLE_MAX;
  const descOver = desc.length > DESC_MAX;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-5">
        <h3 className="text-lg font-semibold">Meta &amp; Social Fields</h3>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("tool")}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              preset === "tool"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
            }`}
            aria-pressed={preset === "tool"}
          >
            🛠️ Tool / Feature page
          </button>
          <button
            type="button"
            onClick={() => applyPreset("blog")}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              preset === "blog"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
            }`}
            aria-pressed={preset === "blog"}
          >
            📝 Blog / Article
          </button>
          <button
            type="button"
            onClick={() => applyPreset("home")}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              preset === "home"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
            }`}
            aria-pressed={preset === "home"}
          >
            🏠 Homepage / SaaS
          </button>
          <button
            type="button"
            onClick={() => applyPreset("product")}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              preset === "product"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
            }`}
            aria-pressed={preset === "product"}
          >
            🛒 Product / Landing
          </button>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Page Title</label>
            <span className="text-xs text-gray-500">Recommended ≤ {TITLE_MAX} chars</span>
          </div>
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Awesome Tool — Do X in Seconds"
            aria-describedby="title-counter"
          />
          <div id="title-counter" className="mt-1 text-xs">
            <span className={titleOver ? "text-red-500" : "text-gray-500"}>
              {title.length} / {TITLE_MAX}
            </span>
            {titleOver && <span className="ml-2 text-red-500">Trimmed to {TITLE_MAX} in previews</span>}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Description</label>
            <span className="text-xs text-gray-500">Recommended ≤ {DESC_MAX} chars</span>
          </div>
          <textarea
            rows={3}
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Explain your page in one compelling sentence."
            aria-describedby="desc-counter"
          />
          <div id="desc-counter" className="mt-1 text-xs">
            <span className={descOver ? "text-red-500" : "text-gray-500"}>
              {desc.length} / {DESC_MAX}
            </span>
            {descOver && <span className="ml-2 text-red-500">Trimmed to {DESC_MAX} in previews</span>}
          </div>
        </div>

        {/* Canonical */}
        <div>
          <label className="block text-sm font-medium mb-1">Canonical URL</label>
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://toolcite.com/tools/meta-og-generator"
          />
        </div>

        {/* Site + Author */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="ToolCite"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Bharat"
            />
          </div>
        </div>

        {/* OG / Twitter image */}
        <div>
          <label className="block text-sm font-medium mb-1">Preview Image (OG/Twitter)</label>
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://toolcite.com/og/my-page.png"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty → we will show /og-default.png in preview only. We won&apos;t pre-fill the tag.
          </p>
        </div>

        {/* Theme + Twitter Card */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Theme Color</label>
            <input
              type="color"
              className="h-10 w-16 rounded border bg-white/60 dark:bg-neutral-800 p-1"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twitter Card Type</label>
            <select
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={twitterCard}
              onChange={(e) => setTwitterCard(e.target.value as any)}
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </div>
        </div>

        {/* Twitter */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Twitter @site</label>
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={twitterSite}
              onChange={(e) => setTwitterSite(e.target.value)}
              placeholder="@toolcite"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twitter @creator</label>
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={twitterCreator}
              onChange={(e) => setTwitterCreator(e.target.value)}
              placeholder="@bharat"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(snippetToShow)}
            className="rounded border px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Copy snippet
          </button>
          <button
            onClick={() => download("meta-tags.html", snippetToShow)}
            className="rounded border px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            Download HTML
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-6">
        <h3 className="text-lg font-semibold">Live Previews</h3>

        {/* OG Preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="Open Graph preview image" className="w-full h-40 object-cover" />
          <div className="p-4">
            <div className="text-xs text-gray-500">{url.trim() || "https://example.com"}</div>
            <div className="text-base font-semibold mt-1">{safeTitle || "Your Open Graph Title"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Your Open Graph description shows here."}
            </div>
            <div className="text-xs text-gray-500 mt-2">{siteName || "ToolCite"}</div>
          </div>
        </div>

        {/* Twitter Preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {(twitterCard === "summary_large_image") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage} alt="Twitter card preview image" className="w-full h-40 object-cover" />
          )}
          <div className="p-4">
            <div className="text-xs text-gray-500">{url.trim() || "https://example.com"}</div>
            <div className="text-base font-semibold mt-1">{safeTitle || "Twitter Card Title"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Twitter Card description preview."}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {(ensureAt(twitterSite) || "@site")} • {(ensureAt(twitterCreator) || "@creator")}
            </div>
          </div>
        </div>

        {/* Snippet tabs */}
        <div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setActiveTab("html")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                activeTab === "html"
                  ? "bg-blue-600 text-white"
                  : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
              }`}
            >
              HTML &lt;head&gt;
            </button>
            <button
              onClick={() => setActiveTab("next")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                activeTab === "next"
                  ? "bg-blue-600 text-white"
                  : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
              }`}
            >
              Next.js metadata
            </button>
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                activeTab === "basic"
                  ? "bg-blue-600 text-white"
                  : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
              }`}
            >
              Basic &lt;head/&gt;
            </button>
            <button
              onClick={() => setActiveTab("social")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                activeTab === "social"
                  ? "bg-blue-600 text-white"
                  : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
              }`}
            >
              Social only
            </button>
          </div>
          <pre className="rounded-xl border bg-white dark:bg-neutral-800 p-4 text-xs overflow-auto max-h-60">
            {snippetToShow}
          </pre>
        </div>

        {/* SEO / sharing checklist */}
        <div className="rounded-xl border bg-white/60 dark:bg-neutral-800 p-4 text-xs space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-200">SEO &amp; Sharing Checks</p>
          <p className={safeTitle ? "text-green-600" : "text-red-500"}>
            • Title {safeTitle ? "present" : "empty"} (≤ {TITLE_MAX} in previews).
          </p>
          <p className={safeDesc ? "text-green-600" : "text-yellow-500"}>
            • Description {safeDesc ? "present" : "empty (code filtered?)"}.
          </p>
          <p className={url.trim() ? "text-green-600" : "text-yellow-500"}>
            • Canonical URL {url.trim() ? "included." : "missing (optional)."}
          </p>
          <p className={shouldEmitImage ? "text-green-600" : "text-yellow-500"}>
            • OG image {shouldEmitImage ? "present." : "preview-only fallback used, not exported."}
          </p>
          <p className={twitterCard ? "text-green-600" : "text-yellow-500"}>
            • Twitter card: {twitterCard}.
          </p>
          <p className={twitterSite.trim() ? "text-green-600" : "text-yellow-500"}>
            • Twitter @site / @creator {twitterSite.trim() ? "present." : "missing — optional but useful."}
          </p>
        </div>
      </div>
    </div>
  );
}

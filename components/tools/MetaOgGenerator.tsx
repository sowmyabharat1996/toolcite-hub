"use client";

import React, { useMemo, useState } from "react";

const TITLE_MAX = 60;
const DESC_MAX = 160;
const FALLBACK_IMAGE = "/og-default.png"; // 👈 UI + generated code both use this if empty

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

// ---------- small helpers ----------
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
  // ---------- state ----------
  const [preset, setPreset] = useState<PresetKey>("tool");

  const [title, setTitle] = useState(PRESETS.tool.title);
  const [desc, setDesc] = useState(PRESETS.tool.desc);
  const [url, setUrl] = useState(PRESETS.tool.url);
  const [siteName, setSiteName] = useState(PRESETS.tool.siteName);
  const [author, setAuthor] = useState(PRESETS.tool.author);

  // 👇 user-editable image, but we will *resolve* it to a fallback for preview AND snippet
  const [image, setImage] = useState("");

  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [twitterCard, setTwitterCard] = useState<"summary" | "summary_large_image">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("@toolcite");
  const [twitterCreator, setTwitterCreator] = useState("@bharat");

  const [activeTab, setActiveTab] = useState<SnippetTab>("html");

  // ---------- derived ----------
  const safeTitle = clamp(title, TITLE_MAX);
  const safeDesc = clamp(desc, DESC_MAX);

  // 👇 THIS is the key difference (Option A):
  // if user didn't type image → we *still* use /og-default.png everywhere
  const resolvedImage = (image || "").trim() || FALLBACK_IMAGE;

  // ---------- actions ----------
  function applyPreset(kind: PresetKey) {
    const p = PRESETS[kind];
    setPreset(kind);
    setTitle(p.title);
    setDesc(p.desc);
    setUrl(p.url);
    setSiteName(p.siteName);
    setAuthor(p.author);
    // NOTE: we do NOT overwrite image – user can keep their own
  }

  // ---------- snippets ----------
  const htmlHeadSnippet = useMemo(() => {
    const lines: string[] = [];

    // base
    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name", "description", safeDesc));
    if (themeColor) lines.push(meta("name", "theme-color", themeColor));

    // canonical (optional)
    if (url.trim()) {
      lines.push(`<link rel="canonical" href="${escapeAttr(url.trim())}" />`);
    }

    // OG
    if (safeTitle) lines.push(meta("property", "og:title", safeTitle));
    if (safeDesc) lines.push(meta("property", "og:description", safeDesc));
    if (url.trim()) lines.push(meta("property", "og:url", url.trim()));
    if (siteName.trim()) lines.push(meta("property", "og:site_name", siteName.trim()));
    lines.push(meta("property", "og:type", "website"));

    // 👇 always emit image (Option A)
    lines.push(meta("property", "og:image", resolvedImage));
    lines.push(meta("property", "og:image:width", "1200"));
    lines.push(meta("property", "og:image:height", "630"));
    lines.push(meta("property", "og:image:alt", safeTitle || "Open Graph image"));

    // Twitter
    lines.push(meta("name", "twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name", "twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name", "twitter:description", safeDesc));
    // also always emit twitter image so pasted links look good
    if (twitterCard === "summary_large_image") {
      lines.push(meta("name", "twitter:image", resolvedImage));
    }
    if (twitterSite.trim()) {
      lines.push(meta("name", "twitter:site", ensureAt(twitterSite)));
    }
    if (twitterCreator.trim()) {
      lines.push(meta("name", "twitter:creator", ensureAt(twitterCreator)));
    }

    // generic author
    if (author.trim()) {
      lines.push(meta("name", "author", author.trim()));
    }

    return lines.join("\n");
  }, [
    safeTitle,
    safeDesc,
    url,
    siteName,
    resolvedImage,
    themeColor,
    twitterCard,
    twitterSite,
    twitterCreator,
    author,
  ]);

  const nextJsMetadataSnippet = useMemo(() => {
    return `export const metadata = {
  title: "${escapeAttr(safeTitle || "Meta Tag & Open Graph Generator")}",
  description: "${escapeAttr(
    safeDesc || "Generate SEO meta tags, Open Graph, Twitter cards, and canonical URLs."
  )}",
  alternates: { canonical: "${escapeAttr(url.trim() || "https://toolcite.com/tools/meta-og-generator")}" },
  openGraph: {
    type: "website",
    title: "${escapeAttr(safeTitle || "Meta Tag & Open Graph Generator")}",
    description: "${escapeAttr(safeDesc || "Create social previews and meta tags for your pages quickly.")}",
    url: "${escapeAttr(url.trim() || "https://toolcite.com/tools/meta-og-generator")}",
    siteName: "${escapeAttr(siteName || "ToolCite")}",
    images: [
      {
        url: "${escapeAttr(resolvedImage)}",
        width: 1200,
        height: 630,
        alt: "${escapeAttr(safeTitle || "Open Graph image")}",
      },
    ],
  },
  twitter: {
    card: "${twitterCard}",
    title: "${escapeAttr(safeTitle || "Meta Tag & Open Graph Generator")}",
    description: "${escapeAttr(safeDesc || "Build meta tags for SEO, Facebook, and Twitter. Copy in 1 click.")}",
    images: ["${escapeAttr(resolvedImage)}"],
    site: "${escapeAttr(ensureAt(twitterSite) || "@site")}",
    creator: "${escapeAttr(ensureAt(twitterCreator) || "@creator")}",
  },
};`;
  }, [
    safeTitle,
    safeDesc,
    url,
    siteName,
    resolvedImage,
    twitterCard,
    twitterSite,
    twitterCreator,
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
    lines.push(meta("property", "og:image", resolvedImage));
    lines.push(meta("name", "twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name", "twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name", "twitter:description", safeDesc));
    if (twitterCard === "summary_large_image") {
      lines.push(meta("name", "twitter:image", resolvedImage));
    }
    return lines.join("\n");
  }, [safeTitle, safeDesc, url, siteName, resolvedImage, twitterCard]);

  // which one to show
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

        {/* presets */}
        <div className="flex flex-wrap gap-2">
          <PresetButton active={preset === "tool"} onClick={() => applyPreset("tool")}>
            🛠️ Tool / Feature page
          </PresetButton>
          <PresetButton active={preset === "blog"} onClick={() => applyPreset("blog")}>
            📝 Blog / Article
          </PresetButton>
          <PresetButton active={preset === "home"} onClick={() => applyPreset("home")}>
            🏠 Homepage / SaaS
          </PresetButton>
          <PresetButton active={preset === "product"} onClick={() => applyPreset("product")}>
            🛒 Product / Landing
          </PresetButton>
        </div>

        {/* title */}
        <Field label="Page Title" hint={`Recommended ≤ ${TITLE_MAX} chars`}>
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
              {titleOver && (
                <span className="ml-2 text-red-500">Trimmed to {TITLE_MAX} in previews</span>
              )}
            </div>
        </Field>

        {/* desc */}
        <Field label="Description" hint={`Recommended ≤ ${DESC_MAX} chars`}>
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
              {descOver && (
                <span className="ml-2 text-red-500">Trimmed to {DESC_MAX} in previews</span>
              )}
            </div>
        </Field>

        {/* canonical */}
        <Field label="Canonical URL">
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://toolcite.com/tools/meta-og-generator"
          />
        </Field>

        {/* site + author */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site Name">
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="ToolCite"
            />
          </Field>
          <Field label="Author">
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Bharat"
            />
          </Field>
        </div>

        {/* image */}
        <Field label="Preview Image (OG/Twitter)">
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://toolcite.com/og/my-page.png"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty → we will show /og-default.png and also export it in the snippet.
          </p>
        </Field>

        {/* theme + twitter type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Theme Color">
            <input
              type="color"
              className="h-10 w-16 rounded border bg-white/60 dark:bg-neutral-800 p-1"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
            />
          </Field>
          <Field label="Twitter Card Type">
            <select
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={twitterCard}
              onChange={(e) => setTwitterCard(e.target.value as any)}
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </Field>
        </div>

        {/* twitter */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Twitter @site">
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={twitterSite}
              onChange={(e) => setTwitterSite(e.target.value)}
              placeholder="@toolcite"
            />
          </Field>
          <Field label="Twitter @creator">
            <input
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              value={twitterCreator}
              onChange={(e) => setTwitterCreator(e.target.value)}
              placeholder="@bharat"
            />
          </Field>
        </div>

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

        {/* OG preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedImage} alt="Open Graph preview image" className="w-full h-40 object-cover" />
          <div className="p-4">
            <div className="text-xs text-gray-500">{url.trim() || "https://example.com"}</div>
            <div className="text-base font-semibold mt-1">{safeTitle || "Your Open Graph Title"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Your Open Graph description shows here."}
            </div>
            <div className="text-xs text-gray-500 mt-2">{siteName || "ToolCite"}</div>
          </div>
        </div>

        {/* Twitter preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {twitterCard === "summary_large_image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolvedImage} alt="Twitter card preview image" className="w-full h-40 object-cover" />
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

        {/* snippet tabs */}
        <div>
          <div className="flex gap-2 mb-2">
            <TabButton onClick={() => setActiveTab("html")} active={activeTab === "html"}>
              HTML &lt;head&gt;
            </TabButton>
            <TabButton onClick={() => setActiveTab("next")} active={activeTab === "next"}>
              Next.js metadata
            </TabButton>
            <TabButton onClick={() => setActiveTab("basic")} active={activeTab === "basic"}>
              Basic &lt;head/&gt;
            </TabButton>
            <TabButton onClick={() => setActiveTab("social")} active={activeTab === "social"}>
              Social only
            </TabButton>
          </div>
          <pre className="rounded-xl border bg-white dark:bg-neutral-800 p-4 text-xs overflow-auto max-h-60">
            {snippetToShow}
          </pre>
        </div>

        {/* checklist */}
        <div className="rounded-xl border bg-white/60 dark:bg-neutral-800 p-4 text-xs space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-200">SEO &amp; Sharing Checks</p>
          <p className={safeTitle ? "text-green-600" : "text-red-500"}>
            • Title {safeTitle ? "present (≤ 60 in preview)." : "missing."}
          </p>
          <p className={safeDesc ? "text-green-600" : "text-yellow-500"}>
            • Description {safeDesc ? "present." : "empty."}
          </p>
          <p className={url.trim() ? "text-green-600" : "text-yellow-500"}>
            • Canonical URL {url.trim() ? "included." : "missing (optional)."}
          </p>
          <p className="text-green-600">• OG image: {resolvedImage} (fallback used if empty).</p>
          <p className="text-green-600">• Twitter card: {twitterCard}.</p>
          <p className={twitterSite.trim() ? "text-green-600" : "text-yellow-500"}>
            • Twitter @site / @creator {twitterSite.trim() ? "present." : "missing (optional)."}
          </p>
        </div>
      </div>
    </div>
  );
}

// small dumb components
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium">{label}</label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function PresetButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

"use client";

import React, { useMemo, useState } from "react";

/* ----------------------------- small helpers ----------------------------- */

function clamp(str: string, max: number) {
  return str.length > max ? str.slice(0, max) : str;
}
function copy(text: string) {
  navigator.clipboard.writeText(text);
}
function meta(kind: "name" | "property", k: string, v: string) {
  return `<meta ${kind}="${escapeAttr(k)}" content="${escapeAttr(v)}" />`;
}
function escapeAttr(s: string) {
  return String(s).replace(/"/g, "&quot;");
}
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}
function ensureAt(s: string) {
  const t = (s || "").trim();
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

/** if img starts with "/", make it absolute using url origin (or window location) */
function absolutizeImage(img: string, pageUrl: string): string {
  if (!img) return "";
  try {
    // absolute already?
    new URL(img);
    return img;
  } catch {
    // relative path
    try {
      const origin =
        pageUrl && pageUrl.startsWith("http")
          ? new URL(pageUrl).origin
          : typeof window !== "undefined"
          ? window.location.origin
          : "https://example.com";
      return img.startsWith("/") ? origin + img : origin + "/" + img;
    } catch {
      return img;
    }
  }
}

/* --------------------------------- UI ----------------------------------- */

export default function MetaOgGenerator() {
  /* form state */
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [siteName, setSiteName] = useState("ToolCite");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState(""); // allow blank -> fallback
  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [twitterCard, setTwitterCard] =
    useState<"summary" | "summary_large_image">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("");
  const [twitterCreator, setTwitterCreator] = useState("");

  /* step 6 presets (tool/blog/home/product) */
  const [preset, setPreset] =
    useState<"tool" | "blog" | "home" | "product">("tool");

  /* step 7: snippet-variant tabs */
  const [snippetKind, setSnippetKind] =
    useState<"html" | "next" | "react" | "social">("html");

  /* limits */
  const titleMax = 60;
  const descMax = 160;

  /* clamped */
  const safeTitle = clamp(title, titleMax);
  const safeDesc = clamp(desc, descMax);

  /* resolved image with ALWAYS-ON fallback */
  const resolvedImage = image || "/og-default.png";
  const absoluteImage = absolutizeImage(resolvedImage, url || "");

  /* ------------------------------ snippets ------------------------------ */

  const html = useMemo(() => {
    const lines: string[] = [];

    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name", "description", safeDesc));
    if (themeColor) lines.push(meta("name", "theme-color", themeColor));

    // Canonical
    if (url) lines.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);

    // Open Graph
    if (safeTitle) lines.push(meta("property", "og:title", safeTitle));
    if (safeDesc) lines.push(meta("property", "og:description", safeDesc));
    if (url) lines.push(meta("property", "og:url", url));
    if (siteName) lines.push(meta("property", "og:site_name", siteName));
    if (absoluteImage) {
      lines.push(meta("property", "og:image", absoluteImage));
      lines.push(meta("property", "og:image:width", "1200"));
      lines.push(meta("property", "og:image:height", "630"));
      if (safeTitle) lines.push(meta("property", "og:image:alt", safeTitle));
    }
    lines.push(meta("property", "og:type", "website"));

    // Twitter
    lines.push(meta("name", "twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name", "twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name", "twitter:description", safeDesc));
    if (absoluteImage && twitterCard === "summary_large_image")
      lines.push(meta("name", "twitter:image", absoluteImage));
    if (twitterSite) lines.push(meta("name", "twitter:site", ensureAt(twitterSite)));
    if (twitterCreator || author)
      lines.push(
        meta("name", "twitter:creator", ensureAt(twitterCreator) || author)
      );

    // Author (generic)
    if (author) lines.push(meta("name", "author", author));

    return lines.join("\n");
  }, [
    absoluteImage,
    author,
    safeDesc,
    safeTitle,
    siteName,
    themeColor,
    twitterCard,
    twitterCreator,
    twitterSite,
    url,
  ]);

  const nextSnippet = useMemo(
    () =>
      `
export const metadata = {
  title: ${JSON.stringify(safeTitle || "Your page title")},
  description: ${JSON.stringify(safeDesc || "Page description")},
  alternates: { canonical: ${JSON.stringify(url || "https://example.com")} },
  openGraph: {
    title: ${JSON.stringify(safeTitle || "Your page title")},
    description: ${JSON.stringify(safeDesc || "Page description")},
    url: ${JSON.stringify(url || "https://example.com")},
    siteName: ${JSON.stringify(siteName || "Site Name")},
    images: [
      {
        url: ${JSON.stringify(absoluteImage)},
        width: 1200,
        height: 630,
        alt: ${JSON.stringify(safeTitle || "OG image")},
      },
    ],
    type: "website",
  },
  twitter: {
    card: ${JSON.stringify(twitterCard)},
    site: ${JSON.stringify(ensureAt(twitterSite) || "")},
    creator: ${JSON.stringify(ensureAt(twitterCreator) || author || "")},
  },
};
`.trim(),
    [
      absoluteImage,
      author,
      safeDesc,
      safeTitle,
      siteName,
      twitterCard,
      twitterCreator,
      twitterSite,
      url,
    ]
  );

  const reactSnippet = useMemo(
    () =>
      `
import Head from "next/head";

export default function Page() {
  return (
    <>
      <Head>
        <title>${escapeHtml(safeTitle || "Your page title")}</title>
        <meta name="description" content="${escapeAttr(
          safeDesc || "Page description"
        )}" />
        <link rel="canonical" href="${escapeAttr(url || "https://example.com")}" />
        <meta property="og:title" content="${escapeAttr(
          safeTitle || "Your page title"
        )}" />
        <meta property="og:description" content="${escapeAttr(
          safeDesc || "Page description"
        )}" />
        <meta property="og:url" content="${escapeAttr(
          url || "https://example.com"
        )}" />
        <meta property="og:image" content="${escapeAttr(absoluteImage)}" />
        <meta property="og:type" content="website" />
      </Head>
      {/* page content */}
    </>
  );
}
`.trim(),
    [absoluteImage, safeDesc, safeTitle, url]
  );

  const socialSnippet = useMemo(
    () =>
      [
        meta("property", "og:title", safeTitle || "Your page title"),
        meta("property", "og:description", safeDesc || "Page description"),
        meta("property", "og:url", url || "https://example.com"),
        absoluteImage ? meta("property", "og:image", absoluteImage) : "",
        meta("property", "og:type", "website"),
        meta("name", "twitter:card", twitterCard),
        safeTitle ? meta("name", "twitter:title", safeTitle) : "",
        safeDesc ? meta("name", "twitter:description", safeDesc) : "",
        absoluteImage && twitterCard === "summary_large_image"
          ? meta("name", "twitter:image", absoluteImage)
          : "",
        twitterSite ? meta("name", "twitter:site", ensureAt(twitterSite)) : "",
        twitterCreator || author
          ? meta(
              "name",
              "twitter:creator",
              ensureAt(twitterCreator) || author || ""
            )
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [
      absoluteImage,
      author,
      safeDesc,
      safeTitle,
      twitterCard,
      twitterCreator,
      twitterSite,
      url,
    ]
  );

  /* what the Copy button should copy, depending on active tab */
  const activeSnippet =
    snippetKind === "html"
      ? html
      : snippetKind === "next"
      ? nextSnippet
      : snippetKind === "react"
      ? reactSnippet
      : socialSnippet;

  /* ------------------------------ presets fill ------------------------------ */

  function applyPreset(kind: "tool" | "blog" | "home" | "product") {
    setPreset(kind);

    if (kind === "tool") {
      setTitle("Free Online Tool – Fast, Private, In-Browser");
      setDesc(
        "Use this free online tool to generate, test, and export SEO-ready data instantly."
      );
      setUrl("https://toolcite.com/tools/example");
      setSiteName("ToolCite");
      setAuthor("Bharat");
      setImage("/og-default.png");
      setTwitterCard("summary_large_image");
      setTwitterSite("@toolcite");
    } else if (kind === "blog") {
      setTitle("How to Optimize Meta Tags for Social Sharing");
      setDesc(
        "A quick guide to title, description, OG, and Twitter tags that actually render right."
      );
      setUrl("https://toolcite.com/blog/meta-tags-guide");
      setSiteName("ToolCite Blog");
      setAuthor("Bharat");
      setImage("/og-default.png");
      setTwitterCard("summary_large_image");
      setTwitterSite("@toolcite");
    } else if (kind === "home") {
      setTitle("ToolCite — 70+ Front-End Tools for Creators");
      setDesc(
        "SEO, dev, image, and PDF utilities — instantly usable, no login."
      );
      setUrl("https://toolcite.com/");
      setSiteName("ToolCite");
      setAuthor("Bharat");
      setImage("/og-default.png");
      setTwitterCard("summary_large_image");
      setTwitterSite("@toolcite");
    } else if (kind === "product") {
      setTitle("ToolCite Pro — Faster Previews, No Ads");
      setDesc("Upgrade for instant exports, batch mode, and custom branding.");
      setUrl("https://toolcite.com/pro");
      setSiteName("ToolCite");
      setAuthor("Bharat");
      setImage("/og-default.png");
      setTwitterCard("summary_large_image");
      setTwitterSite("@toolcite");
    }
  }

  /* --------------------------------- UI ----------------------------------- */

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: form */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-5">
        <h3 className="text-lg font-semibold">Meta &amp; Social Fields</h3>

        {/* presets */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "tool", label: "⚒️ Tool / Feature page" },
            { id: "blog", label: "📝 Blog / Article" },
            { id: "home", label: "🏠 Homepage / SaaS" },
            { id: "product", label: "🛒 Product / Landing" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={preset === (p.id as any)}
              onClick={() => applyPreset(p.id as any)}
              className={
                "rounded-lg border px-3 py-1.5 text-sm transition " +
                "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <Field label="Page Title" hint={`Recommended ≤ ${titleMax} chars`}>
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Awesome Tool — Do X in Seconds"
            aria-describedby="title-counter"
          />
          <CharCounter id="title-counter" value={title} max={titleMax} />
        </Field>

        <Field label="Description" hint={`Recommended ≤ ${descMax} chars`}>
          <textarea
            rows={3}
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Explain your page in one compelling sentence."
            aria-describedby="desc-counter"
          />
          <CharCounter id="desc-counter" value={desc} max={descMax} />
        </Field>

        <Field label="Canonical URL">
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://toolcite.com/tools/meta-og-generator"
          />
        </Field>

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

        <Field label="Preview Image (OG/Twitter)">
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="/og-default.png or https://..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave blank to use <code>/og-default.png</code> (recommended 1200×630,
            ≤2&nbsp;MB).
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Theme Color">
            <input
              type="color"
              aria-label="Theme color"
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
            onClick={() => copy(activeSnippet)}
            className="rounded border px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Copy snippet
          </button>
          <button
            onClick={() => download("meta-tags.html", html)}
            className="rounded border px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
            title="Downloads the HTML <head> variant"
          >
            Download HTML
          </button>
        </div>
      </div>

      {/* Right: previews & code */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-6">
        <h3 className="text-lg font-semibold">Live Previews</h3>

        {/* OG Preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedImage}
            alt=""
            className="w-full h-40 object-cover"
            loading="lazy"
          />
          <div className="p-4">
            <div className="text-xs text-gray-500">
              {url || "https://example.com"}
            </div>
            <div className="text-base font-semibold mt-1">
              {safeTitle || "Your Open Graph Title"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Your Open Graph description shows here."}
            </div>
            <div className="text-xs text-gray-500 mt-2">{siteName || "Site Name"}</div>
          </div>
        </div>

        {/* Twitter Preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {twitterCard === "summary_large_image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedImage}
              alt=""
              className="w-full h-40 object-cover"
              loading="lazy"
            />
          )}
          <div className="p-4">
            <div className="text-xs text-gray-500">{url ? new URL(url).host : "example.com"}</div>
            <div className="text-base font-semibold mt-1">
              {safeTitle || "Twitter Card Title"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Twitter Card description preview."}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {(ensureAt(twitterSite) || "@site")} •{" "}
              {(ensureAt(twitterCreator) || "@creator")}
            </div>
          </div>
        </div>

        {/* Step 7: Snippet Variants */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Generated snippet</p>

          <div
            className="inline-flex rounded-lg border bg-white/40 dark:bg-neutral-800 mb-3"
            role="tablist"
            aria-label="Snippet format"
          >
            {[
              { id: "html", label: "HTML <head>" },
              { id: "next", label: "Next.js metadata" },
              { id: "react", label: "React <Head>" },
              { id: "social", label: "Social only" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={snippetKind === (tab.id as any)}
                onClick={() => setSnippetKind(tab.id as any)}
                className={
                  "px-3 py-1.5 text-xs rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " +
                  (snippetKind === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-200")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <pre
            className="rounded-xl border bg-white dark:bg-neutral-800 p-4 text-xs overflow-auto min-h-[160px]"
            aria-live="polite"
          >
            {snippetKind === "html" && html}
            {snippetKind === "next" && nextSnippet}
            {snippetKind === "react" && reactSnippet}
            {snippetKind === "social" && socialSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- small subcomponents ----------------------------- */

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
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function CharCounter({
  id,
  value,
  max,
}: {
  id: string;
  value: string;
  max: number;
}) {
  const over = value.length > max;
  return (
    <div id={id} className="mt-1 text-xs">
      <span className={over ? "text-red-600" : "text-gray-500"}>
        {value.length} / {max}
      </span>
      {over && <span className="ml-2 text-red-600">Trimmed in tags</span>}
    </div>
  );
}

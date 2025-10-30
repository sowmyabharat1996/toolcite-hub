// app/tools/meta-og-generator/page.tsx
"use client";

/**
 * META-OG-GENERATOR v2 (sentinel OK)
 * Steps 1–10 done
 * Step 11 added: URL-state / deep-link sharing
 */

import React, { useEffect, useMemo, useState } from "react";

const TITLE_MAX = 60;
const DESC_MAX = 160;
const FALLBACK_OG = "/og-default.png";
const STORAGE_KEY = "toolcite.metaOg.v1";

type PresetId = "tool" | "blog" | "homepage" | "product";

const PRESETS: Record<
  PresetId,
  { label: string; title: string; desc: string; url: string; siteName: string; author: string }
> = {
  tool: {
    label: "⚒️ Tool / Feature page",
    title: "Free Online Tool – Fast, Private, In-Browser",
    desc: "Use this free online tool to generate, test, and export SEO-ready data instantly.",
    url: "https://toolcite.com/tools/example",
    siteName: "ToolCite",
    author: "Bharat",
  },
  blog: {
    label: "📝 Blog / Article",
    title: "How to Optimize Meta Tags for Social Sharing",
    desc: "A quick guide to title, description, OG, and Twitter tags that actually render right.",
    url: "https://toolcite.com/blog/meta-tags-guide",
    siteName: "ToolCite Blog",
    author: "Bharat",
  },
  homepage: {
    label: "🏠 Homepage / SaaS",
    title: "ToolCite – 70+ Tools for Creators",
    desc: "SEO, image, dev, PDF – all in-browser, no login.",
    url: "https://toolcite.com",
    siteName: "ToolCite",
    author: "Bharat",
  },
  product: {
    label: "🛒 Product / Landing",
    title: "Launch tools faster with ToolCite Hub",
    desc: "Drop-in, SEO-ready meta tags for every page.",
    url: "https://toolcite.com/tools/meta-og-generator",
    siteName: "ToolCite",
    author: "Bharat",
  },
};

/* ---------------- helpers ---------------- */

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ");
}
function stripBackticks(s: string) {
  return s.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}
function looksLikeCode(raw: string) {
  const bad = (raw.match(/[{}[\];]/g) || []).length;
  const kw =
    (raw.match(
      /\b(import|export|from|return|const|let|var|function|class|interface|type|enum|extends|implements|new)\b/gi
    ) || []).length;
  return bad >= 3 || kw >= 1;
}
function stripCodeyStuff(s: string) {
  s = s.replace(/\b(use client)\b/gi, " ");
  s = s.replace(
    /\b(import|export|from|return|const|let|var|function|class|interface|type|enum|extends|implements|new)\b/gi,
    " "
  );
  s = s.replace(/[{}[\]();]/g, " ");
  return s;
}
function sanitizeText(raw: string, max: number) {
  if (!raw.trim()) return "";
  let s = raw;
  s = stripBackticks(s);
  s = stripHtml(s);
  s = stripCodeyStuff(s);
  s = s.replace(/\s+/g, " ").trim();
  if (looksLikeCode(raw)) {
    // hide code-y stuff from previews
    return "";
  }
  if (s.length > max) s = s.slice(0, max);
  return s;
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
function absolutize(img: string) {
  if (!img.trim()) {
    if (typeof window !== "undefined") return window.location.origin + FALLBACK_OG;
    return FALLBACK_OG;
  }
  if (/^https?:\/\//i.test(img)) return img;
  if (typeof window !== "undefined") {
    return window.location.origin + (img.startsWith("/") ? img : `/${img}`);
  }
  return img;
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

/* simple <head> importer (step 9) */
function parseImport(raw: string) {
  const out: Partial<{
    title: string;
    description: string;
    url: string;
    image: string;
    siteName: string;
    author: string;
  }> = {};

  const titleTag = raw.match(/<title>([^<]+)<\/title>/i);
  if (titleTag) out.title = titleTag[1].trim();

  const descTag = raw.match(/name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descTag) out.description = descTag[1].trim();

  const canonTag = raw.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonTag) out.url = canonTag[1].trim();

  const ogImg = raw.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImg) out.image = ogImg[1].trim();

  const ogSite = raw.match(/property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSite) out.siteName = ogSite[1].trim();

  const author = raw.match(/name=["']author["']\s+content=["']([^"']+)["']/i);
  if (author) out.author = author[1].trim();

  return out;
}

/* ---------------- main ---------------- */

export default function Page() {
  // ---------- state -------------
  const [preset, setPreset] = useState<PresetId>("tool");
  const p = PRESETS[preset];

  const [titleInput, setTitleInput] = useState(p.title);
  const [descInput, setDescInput] = useState(p.desc);
  const [url, setUrl] = useState(p.url);
  const [siteName, setSiteName] = useState(p.siteName);
  const [author, setAuthor] = useState(p.author);
  const [image, setImage] = useState(""); // keep empty, preview uses fallback

  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [twitterCard, setTwitterCard] =
    useState<"summary" | "summary_large_image">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("@toolcite");
  const [twitterCreator, setTwitterCreator] = useState("@bharat");
  const [tab, setTab] = useState<"html" | "next" | "react" | "social">("html");

  // step 9 panel
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // used to avoid pushing URL before we finish initial hydration
  const [hydrated, setHydrated] = useState(false);

  // ---------- FIRST LOAD: querystring → localStorage → preset ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    let loadedFromQuery = false;

    if (params.toString().length > 0) {
      // 1) from URL
      const qpPreset = params.get("preset") as PresetId | null;
      if (qpPreset && PRESETS[qpPreset]) {
        setPreset(qpPreset);
        const base = PRESETS[qpPreset];
        setTitleInput(params.get("title") ?? base.title);
        setDescInput(params.get("desc") ?? base.desc);
        setUrl(params.get("url") ?? base.url);
        setSiteName(params.get("site") ?? base.siteName);
        setAuthor(params.get("author") ?? base.author);
      } else {
        // no valid preset in query → still try to load fields
        if (params.get("title")) setTitleInput(params.get("title") || "");
        if (params.get("desc")) setDescInput(params.get("desc") || "");
        if (params.get("url")) setUrl(params.get("url") || "");
        if (params.get("site")) setSiteName(params.get("site") || "");
        if (params.get("author")) setAuthor(params.get("author") || "");
      }

      if (params.get("image")) setImage(params.get("image") || "");
      if (params.get("theme")) setThemeColor(params.get("theme") || "#0ea5e9");
      if (params.get("card")) setTwitterCard((params.get("card") as any) || "summary_large_image");
      if (params.get("site_handle")) setTwitterSite(params.get("site_handle") || "@toolcite");
      if (params.get("creator")) setTwitterCreator(params.get("creator") || "@bharat");
      if (params.get("tab")) setTab((params.get("tab") as any) || "html");

      loadedFromQuery = true;
    }

    if (!loadedFromQuery) {
      // 2) from localStorage
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.preset) setPreset(saved.preset);
          if (saved.titleInput !== undefined) setTitleInput(saved.titleInput);
          if (saved.descInput !== undefined) setDescInput(saved.descInput);
          if (saved.url !== undefined) setUrl(saved.url);
          if (saved.siteName !== undefined) setSiteName(saved.siteName);
          if (saved.author !== undefined) setAuthor(saved.author);
          if (saved.image !== undefined) setImage(saved.image);
          if (saved.themeColor !== undefined) setThemeColor(saved.themeColor);
          if (saved.twitterCard !== undefined) setTwitterCard(saved.twitterCard);
          if (saved.twitterSite !== undefined) setTwitterSite(saved.twitterSite);
          if (saved.twitterCreator !== undefined) setTwitterCreator(saved.twitterCreator);
          if (saved.tab !== undefined) setTab(saved.tab);
        }
      } catch (err) {
        // ignore
      }
    }

    setHydrated(true);
  }, []);

  // ---------- AUTOSAVE to localStorage ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return; // wait for initial hydration
    const payload = {
      preset,
      titleInput,
      descInput,
      url,
      siteName,
      author,
      image,
      themeColor,
      twitterCard,
      twitterSite,
      twitterCreator,
      tab,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    preset,
    titleInput,
    descInput,
    url,
    siteName,
    author,
    image,
    themeColor,
    twitterCard,
    twitterSite,
    twitterCreator,
    tab,
  ]);

  // ---------- PUSH STATE TO URL (Step 11) ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return; // don't push while we're still loading
    const params = new URLSearchParams();
    params.set("preset", preset);
    if (titleInput) params.set("title", titleInput);
    if (descInput) params.set("desc", descInput);
    if (url) params.set("url", url);
    if (siteName) params.set("site", siteName);
    if (author) params.set("author", author);
    if (image) params.set("image", image);
    if (themeColor && themeColor !== "#0ea5e9") params.set("theme", themeColor);
    if (twitterCard && twitterCard !== "summary_large_image") params.set("card", twitterCard);
    if (twitterSite && twitterSite !== "@toolcite") params.set("site_handle", twitterSite);
    if (twitterCreator && twitterCreator !== "@bharat") params.set("creator", twitterCreator);
    if (tab && tab !== "html") params.set("tab", tab);

    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [
    hydrated,
    preset,
    titleInput,
    descInput,
    url,
    siteName,
    author,
    image,
    themeColor,
    twitterCard,
    twitterSite,
    twitterCreator,
    tab,
  ]);

  // sanitized for previews
  const safeTitle = sanitizeText(titleInput, TITLE_MAX);
  const safeDesc = sanitizeText(descInput, DESC_MAX);

  // for checks
  const hasDescRaw = descInput.trim().length > 0;
  const descFilteredOut = hasDescRaw && !safeDesc;

  const resolvedImage = absolutize(image || FALLBACK_OG);

  function applyPreset(id: PresetId) {
    const pp = PRESETS[id];
    setPreset(id);
    setTitleInput(pp.title);
    setDescInput(pp.desc);
    setUrl(pp.url);
    setSiteName(pp.siteName);
    setAuthor(pp.author);
    // keep image field as user typed
  }

  function handleResetToPreset() {
    const pp = PRESETS[preset];
    setTitleInput(pp.title);
    setDescInput(pp.desc);
    setUrl(pp.url);
    setSiteName(pp.siteName);
    setAuthor(pp.author);
  }

  function handleClearAll() {
    setTitleInput("");
    setDescInput("");
    setUrl("");
    setSiteName("");
    setAuthor("");
    setImage("");
    // keep twitter + theme
  }

  function handleRunImport() {
    const parsed = parseImport(importText);
    if (parsed.title) setTitleInput(parsed.title);
    if (parsed.description) setDescInput(parsed.description);
    if (parsed.url) setUrl(parsed.url);
    if (parsed.image) setImage(parsed.image);
    if (parsed.siteName) setSiteName(parsed.siteName);
    if (parsed.author) setAuthor(parsed.author);
    setShowImport(false);
  }

  // build snippet
  const htmlHead = useMemo(() => {
    const lines: string[] = [];
    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name", "description", safeDesc));
    if (themeColor) lines.push(meta("name", "theme-color", themeColor));
    if (url) lines.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);

    // OG
    if (safeTitle) lines.push(meta("property", "og:title", safeTitle));
    if (safeDesc) lines.push(meta("property", "og:description", safeDesc));
    if (url) lines.push(meta("property", "og:url", url));
    if (siteName) lines.push(meta("property", "og:site_name", siteName));
    lines.push(meta("property", "og:type", "website"));

    // image (Option A - always)
    lines.push(meta("property", "og:image", resolvedImage));
    lines.push(meta("property", "og:image:width", "1200"));
    lines.push(meta("property", "og:image:height", "630"));
    lines.push(meta("property", "og:image:alt", safeTitle || "Open Graph image"));

    // Twitter
    lines.push(meta("name", "twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name", "twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name", "twitter:description", safeDesc));
    if (twitterCard === "summary_large_image") {
      lines.push(meta("name", "twitter:image", resolvedImage));
    }
    if (twitterSite) lines.push(meta("name", "twitter:site", ensureAt(twitterSite)));
    if (twitterCreator || author)
      lines.push(meta("name", "twitter:creator", ensureAt(twitterCreator) || author));

    if (author) lines.push(meta("name", "author", author));

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

  const checks = [
    safeTitle
      ? { ok: true, text: "Title OK (≤ 60)." }
      : { ok: false, text: "Title empty." },
    !hasDescRaw
      ? { ok: false, text: "Description empty." }
      : descFilteredOut
      ? {
          ok: false,
          text: "Description present but filtered (looked like code / JSX).",
        }
      : { ok: true, text: "Description OK (≤ 160)." },
    url.startsWith("http")
      ? { ok: true, text: "Canonical URL absolute." }
      : { ok: false, text: "Canonical URL missing/relative." },
    { ok: true, text: "OG image present (custom or fallback)." },
    { ok: true, text: `Twitter card: ${twitterCard}.` },
    { ok: !!twitterSite, text: `@site: ${twitterSite || "—"}` },
    { ok: !!twitterCreator || !!author, text: `@creator/author present.` },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Meta &amp; Social Tag Generator</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT */}
        <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Meta &amp; Social Fields</h3>
            <div className="flex gap-2">
              <button
                onClick={handleResetToPreset}
                className="text-xs rounded-md border px-3 py-1 bg-white/30 dark:bg-neutral-800"
              >
                Reset
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs rounded-md border px-3 py-1 bg-white/30 dark:bg-neutral-800"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESETS) as PresetId[]).map((id) => (
              <button
                key={id}
                onClick={() => applyPreset(id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  preset === id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white/40 dark:bg-neutral-800 hover:bg-white/70 dark:hover:bg-neutral-700"
                }`}
                aria-pressed={preset === id}
              >
                {PRESETS[id].label}
              </button>
            ))}
          </div>

          <Field label="Page Title" hint={`Recommended ≤ ${TITLE_MAX} chars`}>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="Awesome Tool — Do X in Seconds"
              aria-describedby="title-counter"
            />
            <Counter id="title-counter" raw={titleInput} safe={sanitizeText(titleInput, TITLE_MAX)} max={TITLE_MAX} />
          </Field>

          <Field label="Description" hint={`Recommended ≤ ${DESC_MAX} chars`}>
            <textarea
              rows={3}
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="Explain your page in one compelling sentence."
              aria-describedby="desc-counter"
            />
            <Counter id="desc-counter" raw={descInput} safe={sanitizeText(descInput, DESC_MAX)} max={DESC_MAX} />
          </Field>

          <Field label="Canonical URL">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="https://toolcite.com/tools/meta-og-generator"
              inputMode="url"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site Name">
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              />
            </Field>
            <Field label="Author">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              />
            </Field>
          </div>

          <Field label="Preview Image (OG/Twitter)">
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="/og-default.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave this empty → preview + snippet use <code>/og-default.png</code>. We don’t pre-fill.
            </p>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme Color">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-10 w-16 rounded border bg-white/60 dark:bg-neutral-800 p-1"
              />
            </Field>
            <Field label="Twitter Card Type">
              <select
                value={twitterCard}
                onChange={(e) => setTwitterCard(e.target.value as any)}
                className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              >
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Twitter @site">
              <input
                value={twitterSite}
                onChange={(e) => setTwitterSite(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
                placeholder="@toolcite"
              />
            </Field>
            <Field label="Twitter @creator">
              <input
                value={twitterCreator}
                onChange={(e) => setTwitterCreator(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
                placeholder="@bharat"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(htmlHead)}
              className="rounded border px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Copy snippet
            </button>
            <button
              onClick={() => download("meta-tags.html", htmlHead)}
              className="rounded border px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Download HTML
            </button>
            <button
              onClick={() => setShowImport((p) => !p)}
              className="rounded border px-3 py-2 text-sm bg-white/40 dark:bg-neutral-800"
            >
              {showImport ? "Hide" : "Import fields"}
            </button>
          </div>

          {showImport && (
            <div className="border rounded-xl p-3 bg-white/40 dark:bg-neutral-800 space-y-2 text-xs">
              <p className="font-medium">Paste raw &lt;head&gt; or meta tags:</p>
              <textarea
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full rounded border bg-white/60 dark:bg-neutral-900 p-2 text-xs"
                placeholder={`<title>My page</title>\n<meta name="description" content="...">`}
              />
              <button
                onClick={handleRunImport}
                className="rounded border px-3 py-1 bg-blue-600 text-white text-xs"
              >
                Import
              </button>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-6">
          <h3 className="text-lg font-semibold">Live Previews</h3>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvedImage} alt="Open Graph preview image" className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="text-xs text-gray-500">{url || "https://example.com"}</div>
              <div className="text-base font-semibold mt-1">
                {safeTitle || "Your Open Graph Title"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {safeDesc || "Your Open Graph description shows here."}
              </div>
              <div className="text-xs text-gray-500 mt-2">{siteName || "ToolCite"}</div>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
            {twitterCard === "summary_large_image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolvedImage} alt="Twitter card preview image" className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <div className="text-xs text-gray-500">{url || "https://example.com"}</div>
              <div className="text-base font-semibold mt-1">
                {safeTitle || "Twitter Card Title"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {safeDesc || "Twitter Card description preview."}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {(ensureAt(twitterSite) || "@site")} • {(ensureAt(twitterCreator) || "@creator")}
              </div>
            </div>
          </div>

          <div>
            <div className="flex gap-2 mb-2">
              {(["html", "next", "react", "social"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    tab === t ? "bg-blue-600 text-white" : "bg-white/30 dark:bg-neutral-800"
                  }`}
                >
                  {t === "html"
                    ? "HTML <head>"
                    : t === "next"
                    ? "Next.js metadata"
                    : t === "react"
                    ? "React <Head>"
                    : "Social only"}
                </button>
              ))}
            </div>

            <pre className="rounded-xl border bg-white dark:bg-neutral-800 p-4 text-xs overflow-auto">
              {tab === "html" && htmlHead}

              {tab === "next" &&
                `export const metadata = {
  title: "${safeTitle || "ToolCite page"}",
  description: "${safeDesc}",
  alternates: { canonical: "${url}" },
  openGraph: {
    title: "${safeTitle}",
    description: "${safeDesc}",
    url: "${url}",
    siteName: "${siteName}",
    images: [{ url: "${resolvedImage}", width: 1200, height: 630 }],
  },
  twitter: {
    card: "${twitterCard}",
    title: "${safeTitle}",
    description: "${safeDesc}",
    images: ["${resolvedImage}"],
    site: "${ensureAt(twitterSite)}",
    creator: "${ensureAt(twitterCreator)}",
  },
};`}

              {tab === "react" &&
                `<Head>
  <title>${escapeHtml(safeTitle || "ToolCite page")}</title>
  <meta name="description" content="${escapeAttr(safeDesc)}" />
  <link rel="canonical" href="${escapeAttr(url)}" />
  <meta property="og:title" content="${escapeAttr(safeTitle)}" />
  <meta property="og:description" content="${escapeAttr(safeDesc)}" />
  <meta property="og:image" content="${escapeAttr(resolvedImage)}" />
  <meta name="twitter:card" content="${twitterCard}" />
  <meta name="twitter:title" content="${escapeAttr(safeTitle)}" />
  <meta name="twitter:description" content="${escapeAttr(safeDesc)}" />
  <meta name="twitter:image" content="${escapeAttr(resolvedImage)}" />
  <meta name="twitter:site" content="${ensureAt(twitterSite)}" />
  <meta name="twitter:creator" content="${ensureAt(twitterCreator)}" />
</Head>`}

              {tab === "social" &&
                [
                  meta("property", "og:title", safeTitle || "ToolCite page"),
                  meta("property", "og:description", safeDesc),
                  meta("property", "og:image", resolvedImage),
                  meta("name", "twitter:card", twitterCard),
                  meta("name", "twitter:title", safeTitle || "ToolCite page"),
                  meta("name", "twitter:description", safeDesc),
                  meta("name", "twitter:image", resolvedImage),
                  meta("name", "twitter:site", ensureAt(twitterSite)),
                  meta("name", "twitter:creator", ensureAt(twitterCreator)),
                ].join("\n")}
            </pre>
          </div>

          <div className="rounded-xl border bg-white/40 dark:bg-neutral-800 p-4 space-y-1 text-xs">
            <p className="font-medium mb-1">SEO &amp; Sharing Checks</p>
            {checks.map((c, i) => (
              <p key={i} className={c.ok ? "text-green-500" : "text-amber-400"}>
                {c.ok ? "✓ " : "• "} {c.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------- small UI helpers ------- */

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

function Counter({ id, raw, safe, max }: { id: string; raw: string; safe: string; max: number }) {
  const over = raw.length > max;
  return (
    <div id={id} className="mt-1 text-xs">
      <span className={over ? "text-red-500" : "text-gray-500"}>
        {raw.length} / {max}
      </span>
      {over && (
        <span className="ml-2 text-red-500">Trimmed to {safe.length} in previews</span>
      )}
    </div>
  );
}

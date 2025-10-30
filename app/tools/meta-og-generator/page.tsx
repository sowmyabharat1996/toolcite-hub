// app/tools/meta-og-generator/page.tsx
"use client";

/**
 * META-OG-GENERATOR v3 (single Share btn)
 * - presets ✅
 * - snippet variants + SEO checks ✅
 * - URL-state sharing + copy/share ✅
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

const TITLE_MAX = 60;
const DESC_MAX = 160;
const FALLBACK_OG = "/og-default.png";

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

/* ---------- helpers ---------- */

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
    // user pasted code → don’t leak to preview
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

/* ---------- main page ---------- */

export default function Page() {
  // base from presets
  const [preset, setPreset] = useState<PresetId>("tool");
  const p = PRESETS[preset];

  const [titleInput, setTitleInput] = useState(p.title);
  const [descInput, setDescInput] = useState(p.desc);
  const [url, setUrl] = useState(p.url);
  const [siteName, setSiteName] = useState(p.siteName);
  const [author, setAuthor] = useState(p.author);
  const [image, setImage] = useState(""); // empty → show fallback only in preview/snippet

  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [twitterCard, setTwitterCard] =
    useState<"summary" | "summary_large_image">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("@toolcite");
  const [twitterCreator, setTwitterCreator] = useState("@bharat");
  const [tab, setTab] = useState<"html" | "next" | "react" | "social">("html");

  // to avoid URL thrash on first render
  const hydratedRef = useRef(false);

  /* 1) READ FROM URL ONCE */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);

    const qpPreset = sp.get("preset") as PresetId | null;
    const qpTitle = sp.get("title");
    const qpDesc = sp.get("desc");
    const qpUrl = sp.get("url");
    const qpSite = sp.get("site");
    const qpAuthor = sp.get("author");
    const qpImg = sp.get("img");
    const qpTheme = sp.get("theme");
    const qpTwCard = sp.get("twc") as "summary" | "summary_large_image" | null;
    const qpTwSite = sp.get("tws");
    const qpTwCreator = sp.get("twcr");

    if (qpPreset && PRESETS[qpPreset]) {
      const base = PRESETS[qpPreset];
      setPreset(qpPreset);
      setTitleInput(qpTitle ?? base.title);
      setDescInput(qpDesc ?? base.desc);
      setUrl(qpUrl ?? base.url);
      setSiteName(qpSite ?? base.siteName);
      setAuthor(qpAuthor ?? base.author);
    } else {
      if (qpTitle) setTitleInput(qpTitle);
      if (qpDesc) setDescInput(qpDesc);
      if (qpUrl) setUrl(qpUrl);
      if (qpSite) setSiteName(qpSite);
      if (qpAuthor) setAuthor(qpAuthor);
    }

    if (qpImg) setImage(qpImg);
    if (qpTheme) setThemeColor(qpTheme);
    if (qpTwCard) setTwitterCard(qpTwCard);
    if (qpTwSite) setTwitterSite(qpTwSite);
    if (qpTwCreator) setTwitterCreator(qpTwCreator);

    hydratedRef.current = true;
  }, []);

  /* 2) WRITE TO URL WHEN STATE CHANGES */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydratedRef.current) return;

    const sp = new URLSearchParams();

    if (preset !== "tool") sp.set("preset", preset);
    if (titleInput && titleInput !== PRESETS[preset].title) sp.set("title", titleInput);
    if (descInput && descInput !== PRESETS[preset].desc) sp.set("desc", descInput);
    if (url && url !== PRESETS[preset].url) sp.set("url", url);
    if (siteName && siteName !== PRESETS[preset].siteName) sp.set("site", siteName);
    if (author && author !== PRESETS[preset].author) sp.set("author", author);
    if (image) sp.set("img", image);
    if (themeColor !== "#0ea5e9") sp.set("theme", themeColor);
    if (twitterCard !== "summary_large_image") sp.set("twc", twitterCard);
    if (twitterSite !== "@toolcite") sp.set("tws", twitterSite);
    if (twitterCreator !== "@bharat") sp.set("twcr", twitterCreator);

    const qs = sp.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [
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
  ]);

  /* 3) SANITIZED VERSIONS */
  const safeTitle = sanitizeText(titleInput, TITLE_MAX);
  const safeDesc = sanitizeText(descInput, DESC_MAX);
  const hasDescRaw = descInput.trim().length > 0;
  const descFilteredOut = hasDescRaw && !safeDesc;
  const resolvedImage = absolutize(image || FALLBACK_OG);

  /* change preset from UI */
  function applyPreset(id: PresetId) {
    const pp = PRESETS[id];
    setPreset(id);
    setTitleInput(pp.title);
    setDescInput(pp.desc);
    setUrl(pp.url);
    setSiteName(pp.siteName);
    setAuthor(pp.author);
  }

  /* 4) BUILD SNIPPET */
  const htmlHead = useMemo(() => {
    const lines: string[] = [];
    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name", "description", safeDesc));
    if (themeColor) lines.push(meta("name", "theme-color", themeColor));
    if (url) lines.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);

    if (safeTitle) lines.push(meta("property", "og:title", safeTitle));
    if (safeDesc) lines.push(meta("property", "og:description", safeDesc));
    if (url) lines.push(meta("property", "og:url", url));
    if (siteName) lines.push(meta("property", "og:site_name", siteName));
    lines.push(meta("property", "og:type", "website"));
    // always show fallback so preview never breaks
    lines.push(meta("property", "og:image", resolvedImage));
    lines.push(meta("property", "og:image:width", "1200"));
    lines.push(meta("property", "og:image:height", "630"));
    lines.push(meta("property", "og:image:alt", safeTitle || "Open Graph image"));

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

  /* 5) CHECKS */
  const checks = [
    safeTitle ? { ok: true, text: "Title OK (≤ 60)." } : { ok: false, text: "Title empty." },
    !hasDescRaw
      ? { ok: false, text: "Description empty." }
      : descFilteredOut
      ? {
          ok: false,
          text: "Description looked like code → tweak wording.",
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

  /* 6) SHARE HANDLER (single) */
  async function shareCurrent() {
    if (typeof window === "undefined") return;
    const link = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: safeTitle || "Meta & OG Generator",
          url: link,
        });
        return;
      }
    } catch {
      // ignore share abort
    }
    try {
      await navigator.clipboard.writeText(link);
      alert("Share link copied.");
    } catch {
      alert("Unable to copy link.");
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* top bar with SINGLE share */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold tracking-tight">ToolCite Hub</h1>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Smart • Fast • Shareable</p>
          <button
            onClick={shareCurrent}
            className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Share
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-5">
          <h3 className="text-lg font-semibold">Meta &amp; Social Fields</h3>

          {/* presets */}
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

          {/* title */}
          <Field label="Page Title" hint={`Recommended ≤ ${TITLE_MAX} chars`}>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="Awesome Tool — Do X in Seconds"
              aria-describedby="title-counter"
            />
            <Counter id="title-counter" raw={titleInput} safe={safeTitle} max={TITLE_MAX} />
          </Field>

          {/* desc */}
          <Field label="Description" hint={`Recommended ≤ ${DESC_MAX} chars`}>
            <textarea
              rows={3}
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="Explain your page in one compelling sentence."
              aria-describedby="desc-counter"
            />
            <Counter id="desc-counter" raw={descInput} safe={safeDesc} max={DESC_MAX} />
          </Field>

          {/* url */}
          <Field label="Canonical URL">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="https://toolcite.com/tools/meta-og-generator"
              inputMode="url"
            />
          </Field>

          {/* site + author */}
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

          {/* image */}
          <Field label="Preview Image (OG/Twitter)">
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="/og-default.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave this empty → preview &amp; snippet use <code>/og-default.png</code>. We don’t
              pre-fill the field.
            </p>
          </Field>

          {/* theme + twitter card */}
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

          {/* twitter handles */}
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
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-6">
          <h3 className="text-lg font-semibold">Live Previews</h3>

          {/* OG preview */}
          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvedImage} alt="Open Graph preview image" className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="text-xs text-gray-500">{url || "https://example.com"}</div>
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
              <div className="text-xs text-gray-500">{url || "https://example.com"}</div>
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

          {/* checks */}
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

/* ---------- tiny helpers ---------- */

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

"use client";

import React, { useMemo, useState } from "react";

function clamp(str: string, max: number) {
  return str.length > max ? str.slice(0, max) : str;
}

function copy(text: string) {
  navigator.clipboard.writeText(text);
}

export default function MetaOgGenerator() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [siteName, setSiteName] = useState("ToolCite");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState("");
  const [themeColor, setThemeColor] = useState("#0ea5e9"); // tailwind sky-500-ish
  const [twitterCard, setTwitterCard] = useState<"summary" | "summary_large_image">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("");
  const [twitterCreator, setTwitterCreator] = useState("");

  const titleMax = 60;
  const descMax = 160;

  const safeTitle = clamp(title, titleMax);
  const safeDesc = clamp(desc, descMax);

  const html = useMemo(() => {
    const lines: string[] = [];
    if (safeTitle) lines.push(`<title>${escapeHtml(safeTitle)}</title>`);
    if (safeDesc) lines.push(meta("name","description", safeDesc));
    if (themeColor) lines.push(meta("name","theme-color", themeColor));

    // Canonical
    if (url) lines.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);

    // Open Graph
    if (safeTitle) lines.push(meta("property","og:title", safeTitle));
    if (safeDesc) lines.push(meta("property","og:description", safeDesc));
    if (url) lines.push(meta("property","og:url", url));
    if (siteName) lines.push(meta("property","og:site_name", siteName));
    if (image) lines.push(meta("property","og:image", image));
    lines.push(meta("property","og:type", "website"));

    // Twitter
    lines.push(meta("name","twitter:card", twitterCard));
    if (safeTitle) lines.push(meta("name","twitter:title", safeTitle));
    if (safeDesc) lines.push(meta("name","twitter:description", safeDesc));
    if (image && twitterCard === "summary_large_image") lines.push(meta("name","twitter:image", image));
    if (twitterSite) lines.push(meta("name","twitter:site", ensureAt(twitterSite)));
    if (twitterCreator || author) lines.push(meta("name","twitter:creator", ensureAt(twitterCreator) || author));

    // Author (generic)
    if (author) lines.push(meta("name","author", author));

    return lines.join("\n");
  }, [safeTitle, safeDesc, url, siteName, image, themeColor, twitterCard, twitterSite, twitterCreator, author]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: form */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-5">
        <h3 className="text-lg font-semibold">Meta & Social Fields</h3>

        <Field label="Page Title" hint={`Recommended ≤ ${titleMax} chars`}>
          <input
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Awesome Tool — Do X in Seconds"
          />
          <CharCounter value={title} max={titleMax} />
        </Field>

        <Field label="Description" hint={`Recommended ≤ ${descMax} chars`}>
          <textarea
            rows={3}
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Explain your page in one compelling sentence."
          />
          <CharCounter value={desc} max={descMax} />
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
            placeholder="https://toolcite.com/og-image.png"
          />
          <p className="text-xs text-gray-500 mt-1">Recommended: 1200×630 (≤2 MB), absolute URL.</p>
        </Field>

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
            onClick={() => copy(html)}
            className="rounded border px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Copy HTML snippet
          </button>
          <button
            onClick={() => download("meta-tags.html", html)}
            className="rounded border px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
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
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gray-200 dark:bg-neutral-700 grid place-items-center text-gray-500">
              1200×630 image preview
            </div>
          )}
          <div className="p-4">
            <div className="text-xs text-gray-500">{url || "https://example.com"}</div>
            <div className="text-base font-semibold mt-1">{safeTitle || "Your Open Graph Title"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Your Open Graph description shows here."}
            </div>
            <div className="text-xs text-gray-500 mt-2">{siteName || "Site Name"}</div>
          </div>
        </div>

        {/* Twitter Preview */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-800">
          {twitterCard === "summary_large_image" && (image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gray-200 dark:bg-neutral-700 grid place-items-center text-gray-500">
              Twitter large image
            </div>
          ))}
          <div className="p-4">
            <div className="text-xs text-gray-500">{url || "example.com"}</div>
            <div className="text-base font-semibold mt-1">{safeTitle || "Twitter Card Title"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {safeDesc || "Twitter Card description preview."}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {(ensureAt(twitterSite) || "@site")} • {(ensureAt(twitterCreator) || "@creator")}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Generated HTML (&lt;head&gt; snippet)</div>
          <pre className="rounded-xl border bg-white dark:bg-neutral-800 p-4 text-xs overflow-auto">
            {html}
          </pre>
        </div>
      </div>
    </div>
  );
}

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

function CharCounter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <div className="mt-1 text-xs">
      <span className={over ? "text-red-600" : "text-gray-500"}>
        {value.length} / {max}
      </span>
      {over && <span className="ml-2 text-red-600">Trimmed in tags</span>}
    </div>
  );
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

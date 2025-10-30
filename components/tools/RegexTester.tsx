"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------
   Types & helpers
--------------------------------------------------------- */

type FlagKey = "i" | "g" | "m" | "s" | "u" | "y";

type Preset = {
  id: string;
  label: string;
  pattern: string;
  flags: string;
  sample: string;
  note?: string;
  builtIn?: boolean;
};

const STORAGE_KEY = "regexTester.customPresets.v1";
const MAX_SOFT = 200_000; // show warning
const MAX_HARD = 250_000; // hard trim

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function buildRegex(pattern: string, flags: string) {
  const valid = Array.from(new Set(flags.split("").filter((f) => "igmsuy".includes(f)))).join("");
  try {
    return { re: new RegExp(pattern, valid), error: "" };
  } catch (e: any) {
    return { re: null as unknown as RegExp, error: e?.message || "Invalid pattern" };
  }
}

function highlightMatches(text: string, re: RegExp | null) {
  if (!re) return [{ text, hit: false }];
  if (!re.global) {
    const m = text.match(re);
    if (!m) return [{ text, hit: false }];
    const i = m.index ?? 0;
    return [
      { text: text.slice(0, i), hit: false },
      { text: text.slice(i, i + m[0].length), hit: true },
      { text: text.slice(i + m[0].length), hit: false },
    ];
  }
  const parts: { text: string; hit: boolean }[] = [];
  let last = 0;
  re.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > last) parts.push({ text: text.slice(last, start), hit: false });
    parts.push({ text: text.slice(start, end), hit: true });
    last = end;
    if (match[0].length === 0) re.lastIndex++; // avoid infinite loop
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

function debounce<T>(fn: (v: T) => void, ms = 150) {
  let t: any;
  return (v: T) => {
    clearTimeout(t);
    t = setTimeout(() => fn(v), ms);
  };
}

function prettyBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let u = -1;
  do {
    n = n / 1024;
    u++;
  } while (n >= 1024 && u < units.length - 1);
  return `${Math.round(n)} ${units[u]}`;
}

/* ---------------------------------------------------------
   Built-in presets
--------------------------------------------------------- */

const BUILT_IN: Preset[] = [
  {
    id: "emails",
    label: "Emails (user + domain)",
    pattern: String.raw`([\w.+-]+)@([\w-]+\.[\w.-]+)`,
    flags: "g",
    sample: `Emails:
hello@example.com
admin@test.io
invalid@@nope
jane.doe+news@sub.mail.co.uk`,
    builtIn: true,
  },
  {
    id: "urls",
    label: "URLs (http/https w/ optional path)",
    pattern: String.raw`https?:\/\/([\w.-]+)(\/[^\s]*)?`,
    flags: "g",
    sample: `See https://toolcite.com and http://example.org/docs/index.html
Also ftp://nope.com should not match.`,
    builtIn: true,
  },
  {
    id: "hex",
    label: "Hex Colors (#RGB or #RRGGBB)",
    pattern: String.raw`#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b`,
    flags: "g",
    sample: `Colors: #fff, #1e90ff, #ABC, #12345 (bad), #12FG34 (bad)`,
    builtIn: true,
  },
  {
    id: "iso-dates",
    label: "Dates (YYYY-MM-DD)",
    pattern: String.raw`(\d{4})-(\d{2})-(\d{2})`,
    flags: "g",
    sample: `Releases: 2024-12-31, 2025-01-01, 24-1-1 (bad)`,
    builtIn: true,
  },
  {
    id: "ipv4-basic",
    label: "IPv4 (basic; not strict)",
    pattern: String.raw`\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b`,
    flags: "g",
    sample: `Servers: 192.168.1.7, 10.0.0.1, 256.1.1.1 (bad but will match)`,
    builtIn: true,
  },
  {
    id: "hashtags",
    label: "Hashtags",
    pattern: String.raw`#([A-Za-z0-9_]+)`,
    flags: "g",
    sample: `Tags: #ToolCite #regex #v2_update #bad-char!`,
    builtIn: true,
  },
  {
    id: "todo-lines",
    label: "Multiline anchors (TODO lines)",
    pattern: String.raw`^TODO:(.*)$`,
    flags: "gm",
    sample: `DONE: ship QR tool
TODO: add regex tester
TODO: docs for image compressor
NOTE: later`,
    builtIn: true,
  },
  {
    id: "dotall-block",
    label: "DotAll block (BEGIN…END)",
    pattern: String.raw`BEGIN([\s\S]*?)END`,
    flags: "g",
    sample: `BEGIN
block A
END
BEGIN block B END`,
    builtIn: true,
  },
  {
    id: "exact-word",
    label: "Exact word (\\bcat\\b)",
    pattern: String.raw`\bcat\b`,
    flags: "g",
    sample: `cat scatter catalog catty dog-cat`,
    builtIn: true,
  },
  {
    id: "unicode-words",
    label: "Unicode letters (\\p{L}+)",
    pattern: String.raw`\p{L}+`,
    flags: "gu",
    sample: `café Москва 東京 cafe`,
    builtIn: true,
  },
  {
    id: "phones",
    label: "Phones (optional country + groups)",
    pattern: String.raw`(?:\+(\d{1,3})\s*)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})`,
    flags: "g",
    sample: `Call +1 415-555-2671 or (212) 555 9034 or 305.555.1200.`,
    builtIn: true,
  },
  {
    id: "sticky",
    label: "Sticky vs Global (\\d+ with y)",
    pattern: String.raw`\d+`,
    flags: "y",
    sample: `12 345 67`,
    builtIn: true,
  },
];

/* ---------------------------------------------------------
   Storage helpers
--------------------------------------------------------- */

function loadCustom(): Preset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch {
    return [];
  }
}

function saveCustom(list: Preset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */

export default function RegexTester() {
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string>(BUILT_IN[1].id); // default: URLs
  const [statusMsg, setStatusMsg] = useState<string>("");

  const allPresets = useMemo(() => [...BUILT_IN, ...customPresets], [customPresets]);
  const selected = allPresets.find((p) => p.id === presetId) ?? BUILT_IN[1];

  const [pattern, setPattern] = useState<string>(selected.pattern);
  const [flags, setFlags] = useState<string>(selected.flags);
  const [sample, setSample] = useState<string>(selected.sample);
  const [nameInput, setNameInput] = useState<string>(selected.label);
  const [saveAsNew, setSaveAsNew] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>("");

  // for URL-state
  const firstLoadRef = useRef<boolean>(true);

  // Refs for shortcuts
  const patternRef = useRef<HTMLInputElement>(null);
  const sampleRef = useRef<HTMLTextAreaElement>(null);

  // Load custom presets + URL params (FIRST MOUNT ONLY)
  useEffect(() => {
    // 1) load custom presets
    const stored = loadCustom();
    setCustomPresets(stored);

    // 2) URL decode (browser only)
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);

    const urlPresetId = sp.get("id");
    const urlPattern = sp.get("p");
    const urlFlags = sp.get("f");
    const urlSample = sp.get("s");

    // if a preset id is present in URL, prefer it
    if (urlPresetId) {
      setPresetId(urlPresetId);
    }

    // if pattern / flags / sample are present, override the current ones
    // sample can be large → decode + clamp
    if (urlPattern) setPattern(decodeURIComponent(urlPattern));
    if (urlFlags) setFlags(decodeURIComponent(urlFlags));
    if (urlSample) {
      const decoded = decodeURIComponent(urlSample);
      setSample(decoded.slice(0, MAX_HARD));
    }

    // mark as done
    firstLoadRef.current = false;
  }, []);

  // When user switches preset (dropdown)
  useEffect(() => {
    // if we are still in the very first URL-hydrate pass, don't overwrite
    if (firstLoadRef.current) return;

    setPattern(selected.pattern);
    setFlags(selected.flags);
    setSample(selected.sample);
    setNameInput(selected.label);
    setSaveAsNew(false);
  }, [presetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Soft/hard sample guard
  const [softWarn, setSoftWarn] = useState<boolean>(false);
  useEffect(() => {
    const len = sample.length;
    setSoftWarn(len > MAX_SOFT);
    if (len > MAX_HARD) {
      setSample((s) => s.slice(0, MAX_HARD));
    }
  }, [sample]);

  // Debounced compute
  const [debounced, setDebounced] = useState({ pattern, flags, sample });
  useEffect(() => {
    const doSet = debounce<typeof debounced>((v) => setDebounced(v), 150);
    doSet({ pattern, flags, sample });
  }, [pattern, flags, sample]);

  const t0 = performance.now();
  const { re, error } = useMemo(
    () => buildRegex(debounced.pattern, debounced.flags),
    [debounced.pattern, debounced.flags]
  );
  const parts = useMemo(
    () => highlightMatches(debounced.sample, error ? null : re),
    [debounced.sample, re, error]
  );
  const matches = useMemo(() => {
    if (error || !re) return [];
    const out: string[][] = [];
    if (!re.global) {
      const m = debounced.sample.match(re);
      if (m) out.push([...m]);
    } else {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(debounced.sample))) {
        out.push([...m]);
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    return out;
  }, [re, debounced.sample, error]);
  const t1 = performance.now();
  const ms = Math.max(0, Math.round(t1 - t0));

  // Flag toggler
  const toggleFlag = (f: FlagKey) =>
    setFlags((curr) => (curr.includes(f) ? curr.replace(f, "") : (curr + f).split("").join("")));

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Focus pattern with '/'
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const typingInField =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            (target as any).isContentEditable);
        if (!typingInField) {
          e.preventDefault();
          patternRef.current?.focus();
        }
      }

      // Run: Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        setStatusMsg("Re-ran pattern");
        setTimeout(() => setStatusMsg(""), 800);
      }

      // Cycle presets: Alt + Up/Down
      if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const idx = allPresets.findIndex((p) => p.id === presetId);
        if (idx >= 0) {
          const next =
            e.key === "ArrowDown"
              ? (idx + 1) % allPresets.length
              : (idx - 1 + allPresets.length) % allPresets.length;
          setPresetId(allPresets[next].id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presetId, allPresets]);

  /* ---------- Custom preset actions ---------- */

  const isBuiltIn = selected.builtIn === true;
  const isCustom = !isBuiltIn;

  function handleSavePreset() {
    const label = (nameInput || "").trim() || "My regex preset";
    const next: Preset = {
      id: saveAsNew || isBuiltIn ? uid() : selected.id,
      label,
      pattern,
      flags,
      sample,
      builtIn: false,
    };

    setCustomPresets((prev) => {
      let list: Preset[];
      if (!saveAsNew && isCustom) {
        list = prev.map((p) => (p.id === selected.id ? next : p));
      } else {
        list = [...prev, next];
      }
      saveCustom(list);
      return list;
    });

    setPresetId(next.id);
    setSaveAsNew(false);
  }

  function handleDeletePreset() {
    if (!isCustom) return;
    setCustomPresets((prev) => {
      const list = prev.filter((p) => p.id !== selected.id);
      saveCustom(list);
      return list;
    });
    setPresetId(BUILT_IN[1].id);
  }

  function exportPresets() {
    const data = JSON.stringify(customPresets, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "regex-custom-presets.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importPresets(file: File) {
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Invalid file format");
        const cleaned: Preset[] = parsed
          .map((p: any) => ({
            id: typeof p.id === "string" ? p.id : uid(),
            label: String(p.label || "Imported preset"),
            pattern: String(p.pattern || ""),
            flags: String(p.flags || ""),
            sample: String(p.sample || ""),
            builtIn: false,
          }))
          .filter((p: Preset) => p.pattern.length > 0);

        setCustomPresets((prev) => {
          const map = new Map<string, Preset>();
          [...prev, ...cleaned].forEach((p) => map.set(p.id, p));
          const list = Array.from(map.values());
          saveCustom(list);
          return list;
        });
      } catch (e: any) {
        setImportError(e?.message || "Import failed");
      }
    };
    reader.readAsText(file);
  }

  // Copy helpers
  function copyMatches(fmt: "csv" | "tsv" | "lines" = "csv") {
    const sep = fmt === "csv" ? "," : fmt === "tsv" ? "\t" : "\n";
    const text =
      matches.length === 0
        ? ""
        : matches
            .map((m) =>
              fmt === "lines"
                ? m[0]
                : [m[0], ...m.slice(1)]
                    .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                    .join(sep)
            )
            .join("\n");
    navigator.clipboard.writeText(text);
    setStatusMsg("Copied matches");
    setTimeout(() => setStatusMsg(""), 800);
  }

  function copyGroupsOnly(fmt: "csv" | "tsv" = "csv") {
    const sep = fmt === "csv" ? "," : "\t";
    const text =
      matches.length === 0
        ? ""
        : matches
            .map((m) =>
              m.length > 1
                ? m
                    .slice(1)
                    .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                    .join(sep)
                : ""
            )
            .join("\n");
    navigator.clipboard.writeText(text);
    setStatusMsg("Copied groups");
    setTimeout(() => setStatusMsg(""), 800);
  }

  /* ---------- URL ENCODE (Step 10) ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // don’t instantly overwrite what we just loaded from the URL
    if (firstLoadRef.current) return;

    const timeout = setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      if (pattern) sp.set("p", encodeURIComponent(pattern));
      else sp.delete("p");

      if (flags) sp.set("f", encodeURIComponent(flags));
      else sp.delete("f");

      if (sample) {
        // don’t make URL insane
        const short = sample.length > 1000 ? sample.slice(0, 1000) + "…" : sample;
        sp.set("s", encodeURIComponent(short));
      } else {
        sp.delete("s");
      }

      if (presetId) sp.set("id", presetId);
      else sp.delete("id");

      const newUrl = window.location.pathname + "?" + sp.toString();
      window.history.replaceState(null, "", newUrl);
    }, 200);

    return () => clearTimeout(timeout);
  }, [pattern, flags, sample, presetId]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Controls */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-5">
        {/* Presets */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Presets</label>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
          >
            <optgroup label="Built-in">
              {BUILT_IN.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Custom">
              {customPresets.length === 0 ? (
                <option value="__none" disabled>
                  (No custom presets yet)
                </option>
              ) : (
                customPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))
              )}
            </optgroup>
          </select>

          {/* Save / rename */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800"
              placeholder="Preset name"
            />
            <button
              onClick={handleSavePreset}
              className="rounded border px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
              title={isBuiltIn || saveAsNew ? "Save as new custom preset" : "Update this custom preset"}
            >
              {isBuiltIn || saveAsNew ? "Save as New" : "Save / Update"}
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={saveAsNew} onChange={(e) => setSaveAsNew(e.target.checked)} />
              Save as new (duplicate)
            </label>

            {isCustom && (
              <button
                onClick={handleDeletePreset}
                className="ml-auto rounded border px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete preset
              </button>
            )}
          </div>

          {/* Import / Export */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button onClick={exportPresets} className="rounded border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-800">
              Export custom presets
            </button>
            <label className="rounded border px-3 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
              Import…
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importPresets(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {importError && <span className="text-sm text-red-600">{importError}</span>}
          </div>
        </div>

        {/* Pattern + Flags */}
        <div>
          <label className="block text-sm font-medium mb-1">Pattern</label>
          <div className="flex items-center gap-2">
            <span className="rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800">/</span>
            <input
              ref={patternRef}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              className="flex-1 rounded border px-2 py-2 bg-white/60 dark:bg-neutral-800 font-mono"
              placeholder="Enter regex pattern…"
              aria-label="Regex pattern"
            />
            <span className="rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800">/</span>
            <input
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              spellCheck={false}
              className="w-24 rounded border px-2 py-2 bg-white/60 dark:bg-neutral-800 font-mono"
              placeholder="flags"
              aria-label="Regex flags"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["i", "g", "m", "s", "u", "y"] as FlagKey[]).map((f) => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                aria-pressed={flags.includes(f)}
                title={
                  f === "i"
                    ? "Ignore case"
                    : f === "g"
                    ? "Global"
                    : f === "m"
                    ? "Multiline"
                    : f === "s"
                    ? "DotAll"
                    : f === "u"
                    ? "Unicode"
                    : "Sticky"
                }
                className={`rounded border px-2 py-1 text-sm ${
                  flags.includes(f) ? "bg-blue-600 text-white" : "bg-white/60 dark:bg-neutral-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>}
        </div>

        {/* Sample text */}
        <div>
          <label className="block text-sm font-medium mb-1">Test Text</label>
          <textarea
            ref={sampleRef}
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={10}
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800 font-mono"
            placeholder="Paste text to test…"
            aria-label="Test text"
          />
          <div className="mt-1 text-xs text-gray-500">
            Size: {prettyBytes(sample.length)}{" "}
            {softWarn && <span className="text-amber-600">• Large input may be slower.</span>}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Tips: `/` focuses pattern • <kbd>Ctrl/⌘ + Enter</kbd> re-runs • <kbd>Alt + ↑/↓</kbd> cycles presets • Use{" "}
          <code className="font-mono">g</code> to find all matches.
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-6">
        <div>
          <div className="text-sm font-medium mb-2">Highlighted Preview</div>
          <div className="rounded-lg border bg-white dark:bg-neutral-800 p-4 font-mono whitespace-pre-wrap leading-relaxed">
            {parts.map((p, i) =>
              p.hit ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/60 rounded px-0.5">
                  {p.text}
                </mark>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {error
              ? "Invalid regex"
              : `Matches: ${matches.length} • Groups: ${matches.reduce(
                  (n, m) => n + Math.max(0, m.length - 1),
                  0
                )} • ${ms} ms`}
            {statusMsg && <span className="ml-2 text-gray-500">— {statusMsg}</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyMatches("csv")}
              className="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Copy matches (CSV)
            </button>
            <button
              onClick={() => copyMatches("tsv")}
              className="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              TSV
            </button>
            <button
              onClick={() => copyMatches("lines")}
              className="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Lines
            </button>
            <button
              onClick={() => copyGroupsOnly("csv")}
              className="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Copy groups
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">
            Matches {matches.length ? `(${matches.length})` : ""}
          </div>
          {matches.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-2 py-1 border">#</th>
                    <th className="px-2 py-1 border">Full match</th>
                    <th className="px-2 py-1 border">Groups</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, idx) => (
                    <tr
                      key={idx}
                      className="odd:bg-white even:bg-gray-50 dark:odd:bg-neutral-900 dark:even:bg-neutral-800"
                    >
                      <td className="px-2 py-1 border text-center">{idx + 1}</td>
                      <td className="px-2 py-1 border font-mono break-all">{m[0]}</td>
                      <td className="px-2 py-1 border font-mono break-all">
                        {m.slice(1).length ? m.slice(1).join(" | ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No matches yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

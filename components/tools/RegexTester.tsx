"use client";

import React, { useMemo, useState } from "react";

type FlagKey = "i" | "g" | "m" | "s" | "u" | "y";

function buildRegex(pattern: string, flags: string) {
  // Validate flags: remove invalid/duplicates
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
  let match: RegExpExecArray | null;

  // Reset lastIndex for global runs
  re.lastIndex = 0;
  while ((match = re.exec(text))) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > last) parts.push({ text: text.slice(last, start), hit: false });
    parts.push({ text: text.slice(start, end), hit: true });
    last = end;

    // Avoid infinite loops on zero-width matches
    if (match[0].length === 0) re.lastIndex++;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState<string>("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState<string>("g");
  const [sample, setSample] = useState<string>(
    `Emails:
hello@example.com
admin@test.io
invalid@@nope
Name: Jane
`
  );

  const { re, error } = useMemo(() => buildRegex(pattern, flags), [pattern, flags]);

  const parts = useMemo(() => highlightMatches(sample, error ? null : re), [sample, re, error]);

  // Collect matches + groups for the table preview
  const matches = useMemo(() => {
    if (error || !re) return [];
    const out: string[][] = [];
    if (!re.global) {
      const m = sample.match(re);
      if (m) out.push([...m]);
    } else {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sample))) {
        out.push([...m]);
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    return out;
  }, [re, sample, error]);

  const toggleFlag = (f: FlagKey) => {
    setFlags((curr) =>
      curr.includes(f) ? curr.replace(f, "") : (curr + f).split("").filter(Boolean).join("")
    );
  };

  const flagDefs: { k: FlagKey; label: string; tip: string }[] = [
    { k: "i", label: "i", tip: "Ignore case" },
    { k: "g", label: "g", tip: "Global (find all)" },
    { k: "m", label: "m", tip: "Multiline (^ and $)" },
    { k: "s", label: "s", tip: "DotAll (dot matches newline)" },
    { k: "u", label: "u", tip: "Unicode" },
    { k: "y", label: "y", tip: "Sticky" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Controls */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pattern</label>
          <div className="flex items-center gap-2">
            <span className="rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800">/</span>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              className="flex-1 rounded border px-2 py-2 bg-white/60 dark:bg-neutral-800 font-mono"
              placeholder="Enter regex pattern…"
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
            {flagDefs.map((f) => (
              <button
                key={f.k}
                onClick={() => toggleFlag(f.k)}
                title={f.tip}
                className={`rounded border px-2 py-1 text-sm ${
                  flags.includes(f.k) ? "bg-blue-600 text-white" : "bg-white/60 dark:bg-neutral-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              ⚠️ {error}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Test Text</label>
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={10}
            className="w-full rounded border px-3 py-2 bg-white/60 dark:bg-neutral-800 font-mono"
            placeholder="Paste text to test…"
          />
        </div>

        <div className="text-xs text-gray-500">
          Quick tips: use <code className="font-mono">g</code> to highlight all matches; enable{" "}
          <code className="font-mono">m</code> for multi-line anchors;{" "}
          <code className="font-mono">s</code> lets <code className="font-mono">.</code> match
          newlines.
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
                    <tr key={idx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-neutral-900 dark:even:bg-neutral-800">
                      <td className="px-2 py-1 border text-center">{idx + 1}</td>
                      <td className="px-2 py-1 border font-mono">{m[0]}</td>
                      <td className="px-2 py-1 border font-mono">
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

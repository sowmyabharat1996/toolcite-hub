// app/tools/regex-tester/client.tsx
"use client";

import React, { useMemo, useState } from "react";

type Flag = "g" | "i" | "m" | "s" | "u" | "y";

const DEFAULT_PATTERN = String.raw`https?:\/\/([\w.-]+)`;
const DEFAULT_TEXT = `See https://toolcite.com and http://example.org/docs/index.html.
Also ftp://nope.com should not match.
Visit https://toolcite.com/tools/regex-tester for docs.`;

const PRESETS = [
  {
    name: "URLs (http/https w/ optional path)",
    pattern: String.raw`https?:\/\/([\w.-]+)(?:\/[^\s]*)?`,
    flags: ["g"] as Flag[],
  },
  {
    name: "Emails (simple)",
    pattern: String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}`,
    flags: ["g", "i"] as Flag[],
  },
  {
    name: "IPv4",
    pattern: String.raw`\b(?:\d{1,3}\.){3}\d{1,3}\b`,
    flags: ["g"] as Flag[],
  },
];

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [flags, setFlags] = useState<Flag[]>(["g"]);
  const [selectedPreset, setSelectedPreset] = useState(0);

  const regex = useMemo(() => {
    try {
      return new RegExp(pattern, flags.join(""));
    } catch {
      return null;
    }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!regex) return [];
    const all: { match: string; index: number; groups: string[] }[] = [];
    const it = text.matchAll(regex);
    for (const m of it) {
      all.push({
        match: m[0] ?? "",
        index: m.index ?? 0,
        groups: m.slice(1),
      });
    }
    return all;
  }, [regex, text]);

  function toggleFlag(f: Flag) {
    setFlags((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  function applyPreset(i: number) {
    const p = PRESETS[i];
    setSelectedPreset(i);
    setPattern(p.pattern);
    setFlags(p.flags);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ pattern, flags, text }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "regex-tester-config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* LEFT */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportJSON}
            className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm"
          >
            Export JSON
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-200 lg:text-gray-100">Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(idx)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  selectedPreset === idx
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-black/20 border-gray-600 text-gray-200 hover:bg-black/10"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="pattern" className="text-sm font-medium block">
            Pattern
          </label>
          <div className="flex gap-2">
            <input
              id="pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="flex-1 rounded-md bg-black/10 dark:bg-neutral-900 border border-gray-700 px-3 py-2 text-sm"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="flex gap-1">
              {(["g", "i", "m", "s", "u", "y"] as Flag[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFlag(f)}
                  className={`w-8 h-8 rounded-md border text-sm font-medium ${
                    flags.includes(f)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-black/10 border-gray-600 text-gray-200"
                  }`}
                  aria-pressed={flags.includes(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="test-text" className="text-sm font-medium block">
            Test Text
          </label>
          <textarea
            id="test-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[160px] rounded-md bg-black/10 dark:bg-neutral-900 border border-gray-700 px-3 py-2 text-sm"
            spellCheck={false}
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:w-80 w-full space-y-3">
        <div className="rounded-lg border border-gray-700 bg-black/10 dark:bg-neutral-900 p-3">
          <p className="text-sm font-semibold mb-2">Matches ({matches.length})</p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {!regex && <p className="text-xs text-red-400">Invalid regex / flags.</p>}
            {regex && matches.length === 0 && (
              <p className="text-xs text-gray-400">No matches in current text.</p>
            )}
            {matches.map((m, idx) => (
              <div key={idx} className="rounded bg-black/20 p-2 text-xs break-all">
                <p className="text-gray-100">
                  <span className="font-mono">#{idx + 1}</span> — {m.match}
                </p>
                <p className="text-gray-400">at index {m.index}</p>
                {m.groups.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {m.groups.map((g, gi) => (
                      <p key={gi} className="text-gray-300">
                        group {gi + 1}: <span className="font-mono">{g}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-black/5 dark:bg-neutral-900 p-3 text-xs overflow-x-auto">
          <p className="text-gray-300 mb-1 font-semibold">Current RegExp</p>
          <code className="whitespace-pre">/{pattern}/{flags.join("") || "∅"}</code>
        </div>
      </div>
    </div>
  );
}

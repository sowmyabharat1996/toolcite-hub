"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types & utils ----------------------------- */

type Color = { hex: string; locked: boolean };

type Harmony =
  | "analogous"
  | "complementary"
  | "triadic"
  | "tetradic"
  | "monochrome";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pad2 = (n: number) => n.toString(16).padStart(2, "0");
const rgbToHex = (r: number, g: number, b: number) =>
  `#${pad2(r)}${pad2(g)}${pad2(b)}`.toUpperCase();

const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

// Simple deterministic RNG (LCG) for seed-based palettes
const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 0xffffffff) / 0xffffffff;

const makeToast = (html: string) => {
  const t = document.createElement("div");
  t.innerHTML = html;
  t.style.position = "fixed";
  t.style.bottom = "24px";
  t.style.left = "50%";
  t.style.transform = "translateX(-50%)";
  t.style.background = "#1f2937";
  t.style.color = "#fff";
  t.style.padding = "10px 16px";
  t.style.borderRadius = "10px";
  t.style.fontSize = "14px";
  t.style.zIndex = "9999";
  t.style.opacity = "0";
  t.style.transition = "opacity .25s ease, transform .25s ease";
  document.body.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = "1";
    t.style.transform = "translateX(-50%) translateY(-4px)";
  });
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => t.remove(), 280);
  }, 1500);
};

const contrastRatio = (hex: string) => {
  // WCAG contrast vs white text
  const { r, g, b } = hexToRgb(hex);
  const lum = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const L1 = 1.0; // white
  const L2 = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return (L1 + 0.05) / (L2 + 0.05); // white-on-color
};

const badgeForContrast = (hex: string) => {
  const ratio = contrastRatio(hex);
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "A";
  return "";
};

const copyText = async (text: string, announce?: (m: string) => void) => {
  await navigator.clipboard.writeText(text);
  announce?.("Copied to clipboard");
  makeToast("Copied to clipboard");
};

const withHash = (h: string) => (h.startsWith("#") ? h : `#${h}`);

/* ------------------------------ Preset data ------------------------------ */

const PRESETS: Record<string, string[]> = {
  Brand: ["#0EE9BF", "#0EDCE9", "#0EA5E9", "#0E6EE9", "#0E38E9"],
  Pastel: ["#FFE5EC", "#EDE7F6", "#E0F2F1", "#FFF9C4", "#F8BBD0"],
  Neon: ["#39FF14", "#FF2079", "#00FFFF", "#FCEE09", "#FF6EC7"],
  Earth: ["#7F5539", "#9C6644", "#B08968", "#E6CCB2", "#EDE0D4"],
  Ocean: ["#0EA5E9", "#0891B2", "#155E75", "#0B7285", "#74C0FC"],
  Sunset: ["#FF6B6B", "#F06595", "#CC5DE8", "#845EF7", "#5C7CFA"],
};

const HARMONY_LABELS: Record<Harmony, string> = {
  analogous: "Analogous",
  complementary: "Complementary",
  triadic: "Triadic",
  tetradic: "Tetradic",
  monochrome: "Monochrome",
};

/* -------------------------- Palette generation -------------------------- */

const generatePalette = (
  baseHex: string,
  harmony: Harmony,
  n: number,
  satAdj: number, // -100..100 (UI provides -100..100 mapped to -1..1)
  lumAdj: number, // -100..100 (UI provides -100..100 mapped to -1..1)
  seedStr: string
): string[] => {
  const seedNum = [...seedStr].reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
  const rnd = lcg(seedNum);

  const { r, g, b } = hexToRgb(baseHex);
  const base = rgbToHsl(r, g, b);

  const adjust = (h: number, s: number, l: number) => {
    // apply global sliders
    s = clamp(s + satAdj, 0, 1);
    l = clamp(l + lumAdj, 0, 1);
    const rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  const hues: number[] = [];
  switch (harmony) {
    case "analogous": {
      const step = 1 / 24; // ~15°
      const start = base.h - step * Math.floor(n / 2);
      for (let i = 0; i < n; i++) hues.push((start + i * step + 1) % 1);
      break;
    }
    case "complementary": {
      const comp = (base.h + 0.5) % 1;
      for (let i = 0; i < n; i++) {
        const t = i / Math.max(1, n - 1);
        const h = i % 2 === 0 ? base.h : comp;
        const l = clamp(base.l * (0.9 + 0.2 * t) + (rnd() - 0.5) * 0.02, 0, 1);
        const s = clamp(base.s * (0.9 + 0.2 * (1 - t)), 0, 1);
        const rgb = hslToRgb(h, s, l);
        hues.push(h);
      }
      break;
    }
    case "triadic": {
      const tri = [(base.h + 0) % 1, (base.h + 1 / 3) % 1, (base.h + 2 / 3) % 1];
      for (let i = 0; i < n; i++) hues.push(tri[i % 3]);
      break;
    }
    case "tetradic": {
      const tet = [
        (base.h + 0) % 1,
        (base.h + 0.25) % 1,
        (base.h + 0.5) % 1,
        (base.h + 0.75) % 1,
      ];
      for (let i = 0; i < n; i++) hues.push(tet[i % 4]);
      break;
    }
    case "monochrome": {
      for (let i = 0; i < n; i++) {
        const t = i / Math.max(1, n - 1);
        const l = clamp(0.15 + 0.7 * t, 0, 1);
        const s = clamp(base.s * (0.8 + 0.4 * (rnd() - 0.5)), 0, 1);
        const rgb = hslToRgb(base.h, s, l);
        hues.push(base.h);
      }
      break;
    }
  }

  return hues.map((h, i) => {
    const jitterS = (rnd() - 0.5) * 0.05;
    const jitterL = (rnd() - 0.5) * 0.05;
    const s = clamp(base.s + jitterS, 0, 1);
    const l = clamp(base.l + jitterL, 0, 1);
    return adjust(h, s, l);
  });
};

/* --------------------------- URL <-> state wiring --------------------------- */

const encodeStateToUrl = (opts: {
  base: string;
  a: Harmony;
  n: number;
  s: number;
  l: number;
  colors?: string[];
  seed?: string;
}) => {
  const url = new URL(window.location.href);
  url.searchParams.set("base", opts.base);
  url.searchParams.set("a", opts.a);
  url.searchParams.set("n", String(opts.n));
  url.searchParams.set("s", String(Math.round(opts.s * 100)));
  url.searchParams.set("l", String(Math.round(opts.l * 100)));
  if (opts.colors && opts.colors.length > 0) {
    url.searchParams.set("colors", opts.colors.join(","));
  } else {
    url.searchParams.delete("colors");
  }
  if (opts.seed) url.searchParams.set("seed", opts.seed);
  return url.toString();
};

const decodeUrl = (): {
  base?: string;
  a?: Harmony;
  n?: number;
  s?: number; // -1..1
  l?: number; // -1..1
  colors?: string[];
  seed?: string;
} => {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const base = sp.get("base") || undefined;
  const a = (sp.get("a") as Harmony) || undefined;
  const n = sp.get("n") ? parseInt(sp.get("n")!, 10) : undefined;
  const s = sp.get("s") ? clamp(parseInt(sp.get("s")!, 10) / 100, -1, 1) : undefined;
  const l = sp.get("l") ? clamp(parseInt(sp.get("l")!, 10) / 100, -1, 1) : undefined;
  const colors = sp.get("colors")?.split(",").map(withHash);
  const seed = sp.get("seed") || undefined;
  return { base, a, n, s, l, colors, seed };
};

/* -------------------------------- Component -------------------------------- */

export default function ColorPaletteGenerator() {
  // core state
  const [baseColor, setBaseColor] = useState("#06A92F");
  const [harmony, setHarmony] = useState<Harmony>("analogous");
  const [count, setCount] = useState(5);
  const [satAdj, setSatAdj] = useState(0); // -1..1
  const [lumAdj, setLumAdj] = useState(0); // -1..1

  const [palette, setPalette] = useState<Color[]>([
    { hex: "#2FA906", locked: false },
    { hex: "#06A906", locked: false },
    { hex: "#06A92F", locked: false },
    { hex: "#06A958", locked: false },
    { hex: "#06A980", locked: false },
  ]);

  const [seed, setSeed] = useState<string>(() =>
    Math.random().toString(36).slice(2, 8)
  );

  // Reorder mode
  const [reorder, setReorder] = useState(false);

  // History (localStorage)
  const [history, setHistory] = useState<
    Array<{ id: string; label: string; colors: string[]; when: number }>
  >([]);

  // Deep-link freeze (when colors=? present initially)
  const [frozenFromColors, setFrozenFromColors] = useState(false);

  // A11y live region
  const srRef = useRef<HTMLDivElement | null>(null);
  const announce = (msg: string) => {
    if (!srRef.current) return;
    srRef.current.textContent = "";
    setTimeout(() => {
      if (srRef.current) srRef.current.textContent = msg;
    }, 30);
  };

  // drag reorder helpers
  const dragFrom = useRef<number | null>(null);

  /* ----------------------------- Initial hydration ----------------------------- */

  useEffect(() => {
    // load from URL
    const decoded = decodeUrl();
    if (decoded.base) setBaseColor(withHash(decoded.base));
    if (decoded.a) setHarmony(decoded.a);
    if (decoded.n) setCount(clamp(decoded.n, 3, 10));
    if (typeof decoded.s === "number") setSatAdj(decoded.s);
    if (typeof decoded.l === "number") setLumAdj(decoded.l);
    if (decoded.seed) setSeed(decoded.seed);
    if (decoded.colors && decoded.colors.length) {
      setPalette(decoded.colors.map((hex) => ({ hex: withHash(hex), locked: false })));
      setFrozenFromColors(true); // freeze until Generate from Base
    }

    // load history
    try {
      const raw = localStorage.getItem("cp_hist");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------- Recompute -------------------------------- */

  // recompute when the core settings change, unless frozenFromColors
  useEffect(() => {
    if (frozenFromColors) return;
    const newHexes = generatePalette(
      baseColor,
      harmony,
      count,
      satAdj,
      lumAdj,
      seed
    );
    setPalette((prev) =>
      Array.from({ length: count }).map((_, i) => {
        const existing = prev[i];
        const hex = newHexes[i % newHexes.length];
        return existing ? (existing.locked ? existing : { hex, locked: false }) : { hex, locked: false };
      })
    );
  }, [baseColor, harmony, count, satAdj, lumAdj, seed, frozenFromColors]);

  // keep URL in sync (replaceState)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = encodeStateToUrl({
      base: baseColor,
      a: harmony,
      n: count,
      s: satAdj,
      l: lumAdj,
      // include exact colors so share link is deterministic
      colors: palette.map((p) => p.hex),
      seed,
    });
    window.history.replaceState(null, "", url);
  }, [baseColor, harmony, count, satAdj, lumAdj, palette, seed]);

  /* --------------------------------- Actions --------------------------------- */

  const toggleLock = (index: number) => {
    setPalette((prev) => prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c)));
  };

  const randomizeUnlocked = () => {
    setSeed(Math.random().toString(36).slice(2, 8));
    setPalette((prev) =>
      prev.map((c) => (c.locked ? c : { ...c, hex: generatePalette(baseColor, harmony, 1, satAdj, lumAdj, Math.random().toString(36).slice(2, 8))[0] }))
    );
    announce("Randomized unlocked colors");
  };

  const generateFromBase = () => {
    setFrozenFromColors(false);
    setSeed(Math.random().toString(36).slice(2, 8));
    const newHexes = generatePalette(baseColor, harmony, count, satAdj, lumAdj, Math.random().toString(36).slice(2, 8));
    setPalette((prev) =>
      Array.from({ length: count }).map((_, i) => {
        const existing = prev[i];
        const hex = newHexes[i % newHexes.length];
        return existing ? (existing.locked ? existing : { hex, locked: false }) : { hex, locked: false };
      })
    );
    announce("Generated palette from base color");
  };

  // drag-n-drop reorder
  const moveSwatch = (from: number, dirOrTo: number) => {
    setPalette((prev) => {
      const next = prev.slice();
      let to = typeof dirOrTo === "number" && Math.abs(dirOrTo) <= 1 ? from + dirOrTo : dirOrTo;
      to = clamp(to, 0, next.length - 1);
      const [spliced] = next.splice(from, 1);
      next.splice(to, 0, spliced);
      return next;
    });
  };

  // share link (always include colors for exact reproduction)
  const shareLink = async () => {
    const url = encodeStateToUrl({
      base: baseColor,
      a: harmony,
      n: count,
      s: satAdj,
      l: lumAdj,
      colors: palette.map((p) => p.hex),
      seed,
    });
    if (navigator.share) {
      await navigator.share({ title: "My Color Palette", text: "Check out my color palette!", url });
      announce("Share sheet opened");
    } else {
      await copyText(url, announce);
    }
  };

  // PNG export
  const downloadPNG = () => {
    const sw = 180, sh = 120, pad = 0;
    const canvas = document.createElement("canvas");
    canvas.width = sw * palette.length;
    canvas.height = sh;
    const ctx = canvas.getContext("2d")!;
    palette.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * sw + pad, 0 + pad, sw - pad * 2, sh - pad * 2);
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "palette.png";
    link.click();
    announce("PNG downloaded");
  };

  // JSON export
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(palette, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "palette.json";
    link.click();
    announce("JSON downloaded");
  };

  // Copy helpers
  const copyHEX = () =>
    copyText(palette.map((p) => p.hex.toUpperCase()).join("\n"), announce);

  const copyCSV = () => {
    const lines = ["index,hex,r,g,b"];
    palette.forEach((p, i) => {
      const { r, g, b } = hexToRgb(p.hex);
      lines.push(`${i + 1},${p.hex.toUpperCase()},${r},${g},${b}`);
    });
    copyText(lines.join("\n"), announce);
  };

  const copyTailwindSnippet = () => {
    const lines = [
      "// usage: class=\"text-tc-c1 bg-tc-c2\"",
      "export default {",
      "  theme: {",
      "    extend: {",
      "      colors: {",
      "        tc: {",
    ];
    palette.forEach((p, i) => lines.push(`          c${i + 1}: "${p.hex.toUpperCase()}",`));
    lines.push("        }", "      }", "    }", "  }", "}");
    copyText(lines.join("\n"), announce);
  };

  const exportGPL = () => {
    const head = [
      "GIMP Palette",
      "Name: ToolCite Palette",
      `Columns: ${palette.length}`,
      "#",
    ];
    const rows = palette.map((p, i) => {
      const { r, g, b } = hexToRgb(p.hex);
      return `${r} ${g} ${b} Color ${i + 1}`;
    });
    const blob = new Blob([head.concat(rows).join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "palette.gpl";
    link.click();
    announce(".gpl downloaded");
  };

  const copyCssVars = () => {
    const lines = palette.map((p, i) => `--tc-c${i + 1}: ${p.hex};`);
    copyText(lines.join("\n"), announce);
  };

  // Sessions
  const saveSession = () => {
    const id = Math.random().toString(36).slice(2, 8);
    const label = `${HARMONY_LABELS[harmony]} • ${palette[0]?.hex.toUpperCase()} • ${new Date().toLocaleTimeString()}`;
    const entry = { id, label, colors: palette.map((p) => p.hex), when: Date.now() };
    const next = [entry, ...history].slice(0, 8);
    setHistory(next);
    localStorage.setItem("cp_hist", JSON.stringify(next));
    announce("Session saved");
  };

  const loadSession = (id: string) => {
    const entry = history.find((h) => h.id === id);
    if (!entry) return;
    setPalette(entry.colors.map((c) => ({ hex: c, locked: false })));
    setFrozenFromColors(false);
    announce("Session loaded");
  };

  const clearHistory = () => {
    localStorage.removeItem("cp_hist");
    setHistory([]);
    announce("History cleared");
  };

  // contrast badges memo
  const badges = useMemo(() => palette.map((p) => badgeForContrast(p.hex)), [palette]);

  /* ----------------------------------- UI ----------------------------------- */

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* SR live region */}
      <div ref={srRef} aria-live="polite" role="status" className="sr-only" />

      <h1 className="text-2xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
        🎨 Color Palette Generator – Free Online Tool
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Generate color palettes and shades from a seed color or random selection.
        Click a swatch to copy HEX. Lock colors to keep them during regeneration.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <span className="text-sm text-gray-600">Presets:</span>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              const cols = PRESETS[name];
              setPalette(cols.map((hex) => ({ hex, locked: false })));
              setBaseColor(cols[0]);
              setCount(cols.length);
              announce(`${name} preset applied`);
            }}
            className="px-3 py-1 rounded-md border text-sm bg-white/70 dark:bg-neutral-800 hover:bg-gray-50
                       focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={copyCssVars}
          className="px-3 py-1 rounded-md border text-sm bg-white/70 dark:bg-neutral-800 hover:bg-gray-50
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Copy CSS Vars
        </button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <input
          aria-label="Base color"
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="w-24 h-10 rounded-md cursor-pointer border border-gray-300
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        />

        <select
          aria-label="Harmony mode"
          value={harmony}
          onChange={(e) => setHarmony(e.target.value as Harmony)}
          className="px-3 py-2 rounded-md border bg-white/70 dark:bg-neutral-900
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {Object.entries(HARMONY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Count</span>
          <input
            aria-label="Count"
            type="range"
            min={3}
            max={10}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="w-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          />
          <span className="w-6 text-center text-sm">{count}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Saturation</span>
          <input
            aria-label="Saturation"
            type="range"
            min={-100}
            max={100}
            value={Math.round(satAdj * 100)}
            onChange={(e) => setSatAdj(parseInt(e.target.value, 10) / 100)}
            className="w-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          />
          <span className="w-6 text-center text-sm">
            {Math.round(satAdj * 100)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Luminosity</span>
          <input
            aria-label="Luminosity"
            type="range"
            min={-100}
            max={100}
            value={Math.round(lumAdj * 100)}
            onChange={(e) => setLumAdj(parseInt(e.target.value, 10) / 100)}
            className="w-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          />
          <span className="w-6 text-center text-sm">
            {Math.round(lumAdj * 100)}
          </span>
        </div>
      </div>

      {/* Primary actions */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        <button
          aria-label="Generate palette from base color"
          onClick={generateFromBase}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Generate from Base
        </button>
        <button
          aria-label="Randomize unlocked colors"
          onClick={randomizeUnlocked}
          className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Randomize Palette
        </button>
        <button
          aria-label="Export palette as JSON"
          onClick={exportJSON}
          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Export JSON
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        <button
          aria-label="Download palette as PNG image"
          onClick={downloadPNG}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Download PNG
        </button>
        <button
          aria-label="Copy a shareable link"
          onClick={shareLink}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Share Link
        </button>
        <button
          aria-pressed={reorder}
          aria-label={reorder ? "Disable reorder mode" : "Enable reorder mode"}
          onClick={() => setReorder((v) => !v)}
          className={`px-4 py-2 rounded-md border ${
            reorder ? "bg-amber-100 text-amber-900" : "bg-white"
          } hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
        >
          ↔ Reorder
        </button>
      </div>

      {/* Session history */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={saveSession}
          className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          💾 Save Session
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">History:</span>
          <select
            aria-label="Choose a saved run"
            onChange={(e) => {
              if (e.target.value) loadSession(e.target.value);
            }}
            className="px-3 py-2 rounded-md border bg-white
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            defaultValue=""
          >
            <option value="" disabled>
              Choose a saved run…
            </option>
            {history.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
          <button
            aria-label="Clear saved history"
            onClick={clearHistory}
            className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50
                       focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      {/* Pro exports */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          onClick={copyHEX}
          className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Copy HEX
        </button>
        <button
          onClick={copyCSV}
          className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Copy CSV
        </button>
        <button
          onClick={copyTailwindSnippet}
          className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Copy Tailwind
        </button>
        <button
          onClick={exportGPL}
          className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50
                     focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Export .gpl
        </button>
      </div>

      {/* Swatches */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {palette.slice(0, count).map((c, i) => (
          <div
            key={i}
            role="button"
            aria-roledescription="color swatch"
            aria-label={`${c.hex.toUpperCase()} ${c.locked ? "locked" : "unlocked"} — press Enter to copy`}
            tabIndex={0}
            className="rounded-xl shadow-sm cursor-pointer transition transform hover:scale-105
                       focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{ backgroundColor: c.hex }}
            onClick={() => {
              copyText(c.hex.toUpperCase(), announce);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                copyText(c.hex.toUpperCase(), announce);
              }
              if (reorder && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                e.preventDefault();
                const dir = e.key === "ArrowLeft" ? -1 : 1;
                moveSwatch(i, dir);
                announce(`Moved swatch ${dir === -1 ? "left" : "right"}`);
              }
            }}
            draggable={reorder}
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => reorder && e.preventDefault()}
            onDrop={() => {
              if (!reorder) return;
              const from = dragFrom.current;
              if (from === null) return;
              moveSwatch(from, i);
              dragFrom.current = null;
              announce("Swatch moved");
            }}
          >
            <div className="p-2 bg-white/90 rounded-b-xl text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                {badges[i] ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white">
                    {badges[i]}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500">AA</span>
                )}
                <div className="font-mono">{c.hex.toUpperCase()}</div>
              </div>
              <button
                type="button"
                aria-pressed={c.locked}
                aria-label={c.locked ? `Unlock ${c.hex.toUpperCase()}` : `Lock ${c.hex.toUpperCase()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(i);
                  announce(c.locked ? "Unlocked" : "Locked");
                }}
                className="mt-1 text-xs text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                {c.locked ? "🔒" : "🔓"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <p className="text-center text-gray-500 text-sm">
        Tip: Toggle <b>↔ Reorder</b>, then drag with a mouse (or use <b>←/→</b> on a focused swatch).
      </p>

      {/* Deep-link freeze explain */}
      {frozenFromColors && (
        <p className="mt-4 text-center text-amber-700 bg-amber-50 rounded-md p-3 text-sm">
          This palette was loaded from a shared link (<code>colors=</code> in the URL).  
          Click <b>Generate from Base</b> once to re-enable live updates with sliders.
        </p>
      )}
    </div>
  );
}

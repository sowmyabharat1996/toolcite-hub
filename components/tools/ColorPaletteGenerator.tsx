"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ----------------------------- Types & utils ----------------------------- */

type Color = { hex: string; locked: boolean };

// clamp & mod
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const mod = (n: number, m: number) => ((n % m) + m) % m;

// hex ⇄ rgb ⇄ hsl helpers (0–255 rgb; 0–360 h, 0–100 s/l)
function hexToRgb(hex: string) {
  const s = hex.replace("#", "");
  const v = s.length === 3 ? s.split("").map(c => c + c).join("") : s;
  const num = parseInt(v, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}
function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    t = mod(t, 1);
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);
  return { r: r * 255, g: g * 255, b: b * 255 };
}
function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s / 100, l / 100);
  return rgbToHex(r, g, b);
}

// simple contrast checker vs white/black (WCAG-ish)
function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrastRatio(hex1: string, hex2: string) {
  const L1 = luminance(hex1) + 0.05;
  const L2 = luminance(hex2) + 0.05;
  return L1 > L2 ? L1 / L2 : L2 / L1;
}
function wcagBadge(hex: string) {
  const black = "#000000";
  const white = "#ffffff";
  const c = Math.max(contrastRatio(hex, black), contrastRatio(hex, white));
  return c >= 7 ? "AAA" : c >= 4.5 ? "AA" : "A";
}

/* ------------------------- Palette generation core ------------------------ */

type Algo = "analogous" | "complementary" | "triadic" | "tetradic" | "monochrome";

function generateByAlgo(
  base: string,
  algo: Algo,
  count: number,
  satAdj: number,
  lumAdj: number
): string[] {
  const { r, g, b } = hexToRgb(base);
  const { h, s, l } = rgbToHsl(r, g, b);
  const S = clamp(s + satAdj, 0, 100);
  const L = clamp(l + lumAdj, 0, 100);

  const list: number[] = [];
  switch (algo) {
    case "analogous": {
      const step = 30;
      const start = h - (Math.floor(count / 2) * step);
      for (let i = 0; i < count; i++) list.push(mod(start + i * step, 360));
      break;
    }
    case "complementary": {
      const set = [h, h + 180, h + 30, h + 180 + 30, h - 30].slice(0, count);
      list.push(...set.map(v => mod(v, 360)));
      break;
    }
    case "triadic": {
      const set = [h, h + 120, h + 240, h + 60, h + 180].slice(0, count);
      list.push(...set.map(v => mod(v, 360)));
      break;
    }
    case "tetradic": {
      const set = [h, h + 90, h + 180, h + 270, h + 45].slice(0, count);
      list.push(...set.map(v => mod(v, 360)));
      break;
    }
    case "monochrome": {
      const step = count <= 1 ? 0 : 50 / (count - 1);
      for (let i = 0; i < count; i++) list.push(h);
      return list.map((hh, i) => hslToHex(hh, S, clamp(L - 25 + i * step, 0, 100)));
    }
  }
  return list.map(hh => hslToHex(hh, S, L));
}

// move item util (for reorder)
function moveItem<T>(arr: T[], from: number, to: number) {
  const a = arr.slice();
  const f = clamp(from, 0, a.length - 1);
  const t = clamp(to, 0, a.length - 1);
  if (f === t) return a;
  const [x] = a.splice(f, 1);
  a.splice(t, 0, x);
  return a;
}

/* ------------------------------- Component -------------------------------- */

export default function ColorPaletteGenerator() {
  // core state
  const [baseColor, setBaseColor] = useState("#06A92F");
  const [algo, setAlgo] = useState<Algo>("analogous");
  const [count, setCount] = useState(5);
  const [satAdj, setSatAdj] = useState(0);
  const [lumAdj, setLumAdj] = useState(0);
  const [seed, setSeed] = useState<string>("");

  const [palette, setPalette] = useState<Color[]>([
    { hex: "#2FA906", locked: false },
    { hex: "#06A906", locked: false },
    { hex: "#06A92F", locked: false },
    { hex: "#06A958", locked: false },
    { hex: "#06A980", locked: false },
  ]);

  // reordering (Step 9)
  const [isReordering, setIsReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // "deep-link freeze" when colors= is present
  const [frozen, setFrozen] = useState(false);

  // presets
  const PRESETS: Record<string, string[]> = {
    Brand: ["#0EA5E9", "#6366F1", "#22C55E", "#F59E0B", "#EF4444"],
    Pastel: ["#EAE4F2", "#FBE4E4", "#FFF6D6", "#E8F8F5", "#E7F0FF"],
    Neon: ["#39FF14", "#00F0FF", "#FF00E6", "#FFE600", "#FF4D00"],
    Earth: ["#6B8E23", "#A0522D", "#C2B280", "#556B2F", "#8B4513"],
    Ocean: ["#0EE9BF", "#0EDCE9", "#0EA5E9", "#0E6EE9", "#0E38E9"],
    Sunset: ["#FF8A00", "#FF5E62", "#FC466B", "#3F5EFB", "#00DBDE"],
  };

  // Build URL & share
  const buildUrl = () => {
    const colors = palette.map(p => p.hex).join(",");
    const params = new URLSearchParams();
    params.set("seed", seed || Math.random().toString(36).slice(2, 8));
    params.set("colors", colors);
    params.set("base", baseColor);
    params.set("a", algo);
    params.set("n", String(count));
    params.set("s", String(satAdj));
    params.set("l", String(lumAdj));
    return `${window.location.origin}/tools/color-palette-generator?${params.toString()}`;
  };

  const shareLink = async () => {
    const url = buildUrl();
    if (navigator.share) {
      await navigator.share({ title: "My Color Palette", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast("Link copied!");
    }
  };

  // toast
  function toast(text: string) {
    const el = document.createElement("div");
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#111827",
      color: "white",
      padding: "8px 14px",
      borderRadius: "10px",
      fontSize: "14px",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity .25s",
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    requestAnimationFrame(() => (el.style.opacity = "1"));
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 350);
    }, 1400);
  }

  // copy helpers
  const copyHexList = async () => {
    await navigator.clipboard.writeText(palette.map(p => p.hex).join("\n"));
    toast("HEX copied");
  };
  const copyCsv = async () => {
    const rows = ["index,hex,r,g,b"].concat(
      palette.map((p, i) => {
        const { r, g, b } = hexToRgb(p.hex);
        return `${i + 1},${p.hex},${r},${g},${b}`;
      })
    );
    await navigator.clipboard.writeText(rows.join("\n"));
    toast("CSV copied");
  };
  const copyTailwind = async () => {
    const map = Object.fromEntries(
      palette.map((p, i) => [`c${i + 1}`, p.hex])
    );
    const snippet =
      `// usage: class="text-tc-c1 bg-tc-c2"\n` +
      `export default {\n  theme: {\n    extend: {\n      colors: {\n        tc: ${JSON.stringify(map, null, 2).replace(
        /"([^"]+)":/g,
        "$1:"
      )}\n      }\n    }\n  }\n}\n`;
    await navigator.clipboard.writeText(snippet);
    toast("Tailwind snippet copied");
  };
  const exportGPL = () => {
    const lines = [
      "GIMP Palette",
      "Name: ToolCite Palette",
      `Columns: ${palette.length}`,
      "#",
      ...palette.map((p, i) => {
        const { r, g, b } = hexToRgb(p.hex);
        return `${r} ${g} ${b} Color ${i + 1}`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "palette.gpl";
    link.click();
  };

  // png & json exports
  const downloadPNG = () => {
    const sw = 160,
      sh = 120,
      pad = 0;
    const canvas = document.createElement("canvas");
    canvas.width = palette.length * sw + pad * 2;
    canvas.height = sh + pad * 2;
    const ctx = canvas.getContext("2d")!;
    palette.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(pad + i * sw, pad, sw, sh);
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "palette.png";
    link.click();
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(palette, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "palette.json";
    link.click();
  };

  // Swatch actions
  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex.toUpperCase());
    toast(`Copied ${hex.toUpperCase()}`);
  };
  const toggleLock = (i: number) =>
    setPalette(prev => prev.map((c, idx) => (idx === i ? { ...c, locked: !c.locked } : c)));

  // generate & randomize
  const generateFromBase = () => {
    const out = generateByAlgo(baseColor, algo, count, satAdj, lumAdj);
    setPalette(prev => out.map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false })));
    if (frozen) setFrozen(false); // unfreeze after first explicit generate
  };
  const randomize = () => {
    setPalette(prev =>
      prev.map(c => (c.locked ? c : { ...c, hex: rgbToHex(Math.random() * 255, Math.random() * 255, Math.random() * 255) }))
    );
  };

  // presets
  const applyPreset = (name: keyof typeof PRESETS) => {
    const hexes = PRESETS[name];
    setPalette(hexes.map(h => ({ hex: h, locked: false })));
    setBaseColor(hexes[0]);
    setCount(hexes.length);
  };

  // auto recompute when sliders change (unless deep-link frozen)
  useEffect(() => {
    if (frozen) return;
    const out = generateByAlgo(baseColor, algo, count, satAdj, lumAdj);
    setPalette(prev => out.map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseColor, algo, count, satAdj, lumAdj]);

  // parse URL deep-link on first mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const colors = params.get("colors");
      const base = params.get("base");
      const a = (params.get("a") as Algo) || undefined;
      const n = Number(params.get("n") || "");
      const s = Number(params.get("s") || "");
      const l = Number(params.get("l") || "");
      const sd = params.get("seed") || "";
      if (sd) setSeed(sd);
      if (base) setBaseColor(base);
      if (a) setAlgo(a);
      if (Number.isFinite(n) && n >= 3 && n <= 10) setCount(n);
      if (Number.isFinite(s)) setSatAdj(clamp(s, -50, 50));
      if (Number.isFinite(l)) setLumAdj(clamp(l, -50, 50));
      if (colors) {
        const arr = colors.split(",").filter(Boolean);
        if (arr.length) {
          setPalette(arr.map(hex => ({ hex, locked: false })));
          setFrozen(true); // freeze until user hits Generate from Base once
        }
      }
    } catch {}
  }, []);

  // save/restore sessions (last 5)
  type Snap = {
    t: number;
    palette: string[];
    base: string;
    a: Algo;
    n: number;
    s: number;
    l: number;
  };
  const KEY = "tc-pal-hist-v1";
  const [history, setHistory] = useState<Snap[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setHistory(JSON.parse(raw));
  }, []);
  const saveSession = () => {
    const next: Snap = {
      t: Date.now(),
      palette: palette.map(p => p.hex),
      base: baseColor,
      a: algo,
      n: count,
      s: satAdj,
      l: lumAdj,
    };
    const list = [next, ...history].slice(0, 5);
    setHistory(list);
    localStorage.setItem(KEY, JSON.stringify(list));
    toast("Saved");
  };
  const loadSession = (idx: number) => {
    const s = history[idx];
    if (!s) return;
    setPalette(s.palette.map(h => ({ hex: h, locked: false })));
    setBaseColor(s.base);
    setAlgo(s.a);
    setCount(s.n);
    setSatAdj(s.s);
    setLumAdj(s.l);
    setFrozen(false);
  };
  const clearHistory = () => {
    localStorage.removeItem(KEY);
    setHistory([]);
    toast("History cleared");
  };

  // Copy CSS vars (shortcut button row)
  const copyCssVars = async () => {
    const body =
      palette.map((p, i) => `--tc-c${i + 1}: ${p.hex};`).join("\n") +
      `\n/* usage: color: var(--tc-c1); background: var(--tc-c2) */`;
    await navigator.clipboard.writeText(`:root{\n${body}\n}`);
    toast("CSS vars copied");
  };

  /* -------------------- Step 9: Reorder wiring (drag/keys) -------------------- */

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    if (!isReordering) return;
    setDragIndex(idx);
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    if (!isReordering) return;
    e.preventDefault(); // REQUIRED so drop will fire
  };
  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    if (!isReordering) return;
    e.preventDefault();
    const from =
      dragIndex !== null ? dragIndex : Number(e.dataTransfer.getData("text/plain"));
    if (Number.isFinite(from) && from !== idx) {
      setPalette(prev => moveItem(prev, Number(from), idx));
    }
    setDragIndex(null);
  };
  const handleKeyReorder = (idx: number) => (e: React.KeyboardEvent) => {
    if (!isReordering) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      setPalette(prev => moveItem(prev, idx, idx + dir));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPalette(prev => moveItem(prev, idx, 0));
    } else if (e.key === "End") {
      e.preventDefault();
      setPalette(prev => moveItem(prev, idx, prev.length - 1));
    } else if (e.key === "Escape") {
      setIsReordering(false);
    }
  };

  // derived palette limited to `count`
  const shown = useMemo(() => palette.slice(0, count), [palette, count]);

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
        🎨 Color Palette Generator – Free Online Tool
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
        Generate color palettes and shades from a seed color or random selection.
        Click a swatch to copy HEX. Lock colors to keep them during regeneration.
      </p>

      {/* Presets row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <span className="text-sm text-gray-500">Presets:</span>
        {Object.keys(PRESETS).map(name => (
          <button
            key={name}
            onClick={() => applyPreset(name)}
            className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            {name}
          </button>
        ))}
        <button
          onClick={copyCssVars}
          className="ml-2 px-3 py-1 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
        >
          Copy CSS Vars
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={baseColor}
            onChange={e => setBaseColor(e.target.value)}
            aria-label="Base color"
            className="w-40 h-12 rounded-md border"
          />

          <select
            value={algo}
            onChange={e => setAlgo(e.target.value as Algo)}
            aria-label="Palette type"
            className="rounded-md border px-3 py-2"
          >
            <option value="analogous">Analogous</option>
            <option value="complementary">Complementary</option>
            <option value="triadic">Triadic</option>
            <option value="tetradic">Tetradic</option>
            <option value="monochrome">Monochrome</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Count</span>
            <input
              type="range"
              min={3}
              max={10}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              aria-label="Count"
            />
            <span className="w-4 text-center text-sm">{count}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Saturation</span>
            <input
              type="range"
              min={-50}
              max={50}
              value={satAdj}
              onChange={e => setSatAdj(Number(e.target.value))}
              aria-label="Saturation adjust"
            />
            <span className="w-6 text-center text-sm">{satAdj}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Luminosity</span>
            <input
              type="range"
              min={-50}
              max={50}
              value={lumAdj}
              onChange={e => setLumAdj(Number(e.target.value))}
              aria-label="Luminosity adjust"
            />
            <span className="w-6 text-center text-sm">{lumAdj}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          onClick={generateFromBase}
        >
          Generate from Base
        </button>
        <button
          className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={randomize}
        >
          Randomize Palette
        </button>
        <button
          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
          onClick={exportJSON}
        >
          Export JSON
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <button
          className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700"
          onClick={downloadPNG}
        >
          Download PNG
        </button>
        <button
          className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"
          onClick={shareLink}
        >
          Share Link
        </button>

        {/* Step 9 toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isReordering}
          aria-label="Reorder swatches"
          onClick={() => setIsReordering(v => !v)}
          className={`px-4 py-2 rounded-md border transition ${
            isReordering ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          ↔ Reorder
        </button>
      </div>

      {/* History / Save */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <button
          className="px-4 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-neutral-800"
          onClick={saveSession}
          aria-label="Save Session"
        >
          💾 Save Session
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">History:</span>
          <select
            className="rounded-md border px-3 py-2"
            onChange={e => {
              const idx = Number(e.target.value);
              if (Number.isFinite(idx)) loadSession(idx);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Choose a saved run…
            </option>
            {history.map((h, i) => (
              <option key={h.t} value={i}>
                {new Date(h.t).toLocaleString()}
              </option>
            ))}
          </select>
          <button
            className="px-3 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-neutral-800"
            onClick={clearHistory}
            aria-label="Clear history"
          >
            🖌️ Clear
          </button>
        </div>
      </div>

      {/* Pro export set */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <button className="px-4 py-2 rounded-md border" onClick={copyHexList}>
          Copy HEX
        </button>
        <button className="px-4 py-2 rounded-md border" onClick={copyCsv}>
          Copy CSV
        </button>
        <button className="px-4 py-2 rounded-md border" onClick={copyTailwind}>
          Copy Tailwind
        </button>
        <button className="px-4 py-2 rounded-md border" onClick={exportGPL}>
          Export .gpl
        </button>
      </div>

      {/* Palette grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        {shown.map((c, i) => {
          const badge = wcagBadge(c.hex);
          return (
            <div
              key={i}
              className={`rounded-xl shadow-sm transition transform hover:scale-[1.02] ${
                isReordering ? "cursor-move ring-1 ring-blue-300" : "cursor-pointer"
              }`}
              style={{ backgroundColor: c.hex }}
              // copy only when not reordering
              onClick={() => !isReordering && copyHex(c.hex)}
              // DnD wiring (Step 9)
              draggable={isReordering}
              onDragStart={handleDragStart(i)}
              onDragOver={handleDragOver(i)}
              onDrop={handleDrop(i)}
              tabIndex={0}
              onKeyDown={handleKeyReorder(i)}
              aria-label={`Swatch ${i + 1} ${c.hex}${c.locked ? " locked" : ""}`}
            >
              <div className="p-3">
                <div className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-white/80">
                  {badge}
                </div>
              </div>
              <div className="p-2 bg-white/90 rounded-b-xl text-center text-sm">
                <div className="font-mono">{c.hex.toUpperCase()}</div>
                <button
                  className="mt-1 text-xs text-gray-600"
                  onClick={e => {
                    e.stopPropagation();
                    toggleLock(i);
                  }}
                  aria-label={c.locked ? "Unlock color" : "Lock color"}
                >
                  {c.locked ? "🔒" : "🔓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Tip: Toggle ↔ <b>Reorder</b>, then drag with a mouse (or use ←/→ on a focused
        swatch).
      </p>
    </div>
  );
}

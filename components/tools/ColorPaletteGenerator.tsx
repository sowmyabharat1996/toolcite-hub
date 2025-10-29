"use client";

import React, { useState, useEffect } from "react";

type Color = { hex: string; locked: boolean };
type Algo = "analogous" | "complementary" | "triadic" | "tetradic" | "monochrome";

/* =======================
   NEW (Step 4): Presets
   ======================= */
const PRESETS: Record<string, string[]> = {
  Brand:  ["#0EA5E9", "#6366F1", "#22C55E", "#F59E0B", "#EF4444"],
  Pastel: ["#AEC6CF", "#FFB3BA", "#B5EAD7", "#FFDFBA", "#C7CEEA"],
  Neon:   ["#39FF14", "#00FFFF", "#FF6EC7", "#FFD300", "#FF073A"],
  Earth:  ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
  Ocean:  ["#003049", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"],
  Sunset: ["#370617", "#6A040F", "#9D0208", "#DC2F02", "#F48C06"],
};

/* =======================
   (From Step 3) WCAG helpers (kept)
   ======================= */
function relativeLuminance(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const r = parseInt(m?.[1] ?? "00", 16) / 255;
  const g = parseInt(m?.[2] ?? "00", 16) / 255;
  const b = parseInt(m?.[3] ?? "00", 16) / 255;
  const lin = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const R = lin(r), G = lin(g), B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(fg: string, bg: string) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
function bestTextColor(bg: string) {
  const cW = contrastRatio("#ffffff", bg);
  const cB = contrastRatio("#000000", bg);
  return cW >= cB ? "#ffffff" : "#000000";
}
function badgeForContrast(c: number) {
  if (c >= 7) return "AAA";
  if (c >= 4.5) return "AA";
  if (c >= 3) return "AA Large";
  return "Low";
}

/* =======================
   Existing utils (kept)
   ======================= */
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const mod = (n: number, m: number) => ((n % m) + m) % m;
function randomHex() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}
function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: 255 * f(0), g: 255 * f(8), b: 255 * f(4) };
}
function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState("#06A92F");
  const [palette, setPalette] = useState<Color[]>([
    { hex: "#000000", locked: false },
    { hex: "#06A92F", locked: false },
    { hex: "#20CA5F", locked: false },
    { hex: "#46E96F", locked: false },
    { hex: "#67098F", locked: false },
  ]);

  // Step-2 controls (kept)
  const [algo, setAlgo] = useState<Algo>("analogous");
  const [count, setCount] = useState<number>(5);
  const [satShift, setSatShift] = useState<number>(0);
  const [lumShift, setLumShift] = useState<number>(0);
  const [freezeAuto, setFreezeAuto] = useState<boolean>(false);

  // legacy shade helper (kept for compatibility)
  const shadeColor = (color: string, percent: number) => {
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent) / 100;
    const R = f >> 16;
    const G = (f >> 8) & 0x00ff;
    const B = f & 0x0000ff;
    const newColor =
      "#" +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      )
        .toString(16)
        .slice(1);
    return newColor;
  };

  // generator (kept)
  const generateFromBase = () => {
    const base = baseColor;
    const { r, g, b } = hexToRgb(base);
    const baseH = rgbToHsl(r, g, b);

    const n = clamp(count, 3, 10);
    const hueShifts: number[] = (() => {
      switch (algo) {
        case "analogous": {
          const span = 30;
          return Array.from({ length: n }, (_, i) => -span + (2 * span * i) / (n - 1));
        }
        case "complementary":
          return n === 3 ? [-20, 0, 180] : [-30, 0, 30, 180, 210].slice(0, n);
        case "triadic":
          return [0, 120, 240].slice(0, n);
        case "tetradic":
          return [0, 90, 180, 270].slice(0, n);
        case "monochrome":
          return Array.from({ length: n }, () => 0);
        default:
          return Array(n).fill(0);
      }
    })();

    const next: Color[] = hueShifts.map((deg, i) => {
      const h = mod(baseH.h + deg, 360);
      const s = clamp(baseH.s + satShift, 0, 100);
      const l =
        algo === "monochrome"
          ? clamp(baseH.l + lumShift + (i - (n - 1) / 2) * (20 / n), 0, 100)
          : clamp(baseH.l + lumShift, 0, 100);
      return { hex: hslToHex(h, s, l), locked: false };
    });

    setPalette((prev) => next.map((c, i) => (prev[i]?.locked ? prev[i] : c)));
  };

  const regenerate = () => {
    setPalette((prev) =>
      prev
        .slice(0, count)
        .map((c) => (c.locked ? c : { ...c, hex: randomHex() }))
        .concat(
          Array.from({ length: Math.max(0, count - prev.length) }, () => ({
            hex: randomHex(),
            locked: false,
          }))
        )
    );
  };

  const toggleLock = (index: number) => {
    setPalette((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  // NEW (Step 4): apply preset (keeps locks where index matches, updates base/count, unfreezes auto)
  const applyPreset = (name: keyof typeof PRESETS) => {
  const hexes = PRESETS[name];
  if (!hexes?.length) return;

  setFreezeAuto(true);          // ← keep the preset exactly as authored
  setBaseColor(hexes[0]);       // base = first swatch
  setCount(hexes.length);       // count = preset length

  setPalette((prev) =>
    hexes.map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false }))
  );
};
  // toast copy (kept)
  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    const toast = document.createElement("div");
    toast.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
        <span style="width:16px;height:16px;border-radius:4px;background:${hex};display:inline-block"></span>
        <span>Copied ${hex.toUpperCase()}!</span>
      </div>`;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.3s ease",
    } as CSSStyleDeclaration);
    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 1500);
  };

  // NEW (Step 4): Copy CSS Variables
  const copyCssVariables = async () => {
    const vars = palette.slice(0, count).map((c, i) => `  --tc-color-${i + 1}: ${c.hex};`).join("\n");
    const css = `:root{\n${vars}\n}`;
    await navigator.clipboard.writeText(css);
    const toast = document.createElement("div");
    toast.textContent = "CSS variables copied!";
    Object.assign(toast.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#333", color: "#fff", padding: "8px 16px", borderRadius: "8px",
      fontSize: "14px", zIndex: "9999", opacity: "0", transition: "opacity 0.3s ease",
    } as CSSStyleDeclaration);
    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 400); }, 1500);
  };

  // export (kept)
  const exportPalette = async (type: "json" | "png") => {
    if (type === "json") {
      const blob = new Blob([JSON.stringify(palette.slice(0, count), null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "palette.json";
      link.click();
    } else if (type === "png") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const sw = 120, sh = 120;
      const arr = palette.slice(0, count);
      canvas.width = arr.length * sw;
      canvas.height = sh;
      arr.forEach((c, i) => {
        ctx.fillStyle = c.hex;
        ctx.fillRect(i * sw, 0, sw, sh);
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "palette.png";
      link.click();
    }
  };

  // share (kept)
  const sharePalette = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("base", baseColor);
    url.searchParams.set("a", algo);
    url.searchParams.set("n", String(count));
    url.searchParams.set("s", String(satShift));
    url.searchParams.set("l", String(lumShift));
    url.searchParams.set("colors", palette.slice(0, count).map((p) => p.hex).join(","));
    const href = url.toString();

    if (navigator.share) {
      await navigator.share({ title: "My Color Palette", text: "Check out my color palette!", url: href });
    } else {
      await navigator.clipboard.writeText(href);
      const toast = document.createElement("div");
      toast.textContent = "Link copied to clipboard!";
      Object.assign(toast.style, {
        position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
        background: "#333", color: "#fff", padding: "8px 16px", borderRadius: "8px",
        fontSize: "14px", zIndex: "9999", opacity: "0", transition: "opacity 0.3s ease",
      } as CSSStyleDeclaration);
      document.body.appendChild(toast);
      requestAnimationFrame(() => (toast.style.opacity = "1"));
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
      }, 1500);
    }
  };

  /* ---------- URL decode (kept) ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const colorsParam = params.get("colors");
    const baseParam = params.get("base");
    const a = (params.get("a") as Algo) || undefined;
    const n = params.get("n");
    const s = params.get("s");
    const l = params.get("l");

    if (baseParam) setBaseColor(baseParam);
    if (a) setAlgo(a);
    if (n) setCount(clamp(parseInt(n, 10), 3, 10));
    if (s) setSatShift(clamp(parseInt(s, 10), -40, 40));
    if (l) setLumShift(clamp(parseInt(l, 10), -40, 40));

    if (colorsParam) {
      let raw = colorsParam;
      try { raw = decodeURIComponent(raw); } catch {}
      const colors = raw.split(",").map((hex) => {
        if (hex.startsWith("%23")) hex = "#" + hex.slice(3);
        return /^#([0-9a-f]{6})$/i.test(hex) ? hex : "#000000";
      });
      setPalette(colors.slice(0, 10).map((hex) => ({ hex, locked: false })));
      setFreezeAuto(true);
    }
  }, []);

  /* ---------- URL encode (kept) ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      sp.set("colors", palette.slice(0, count).map((p) => p.hex).join(","));
      sp.set("base", baseColor);
      sp.set("a", algo);
      sp.set("n", String(count));
      sp.set("s", String(satShift));
      sp.set("l", String(lumShift));
      const url = window.location.pathname + "?" + sp.toString();
      window.history.replaceState(null, "", url);
    }, 200);
    return () => clearTimeout(t);
  }, [palette, baseColor, algo, count, satShift, lumShift]);

  /* ---------- Auto recompute (kept) ---------- */
  useEffect(() => {
    if (freezeAuto) return;
    const t = setTimeout(() => generateFromBase(), 180);
    return () => clearTimeout(t);
  }, [baseColor, algo, count, satShift, lumShift, freezeAuto]);

  /* ---------- UI ---------- */
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* SR live region (kept) */}
      <div id="a11y-announcer" aria-live="polite" className="sr-only" />

      <h1 className="text-2xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
        🎨 Color Palette Generator – Free Online Tool
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Generate color palettes and shades from a seed color or random selection. Click a swatch to copy HEX. Lock colors to keep them during regeneration.
      </p>

      {/* NEW (Step 4): Presets row */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-gray-600">Presets:</span>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => applyPreset(name as keyof typeof PRESETS)}
            className="hit-44 rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
            aria-label={`Apply ${name} preset`}
            title={`Apply ${name} preset`}
          >
            {name}
          </button>
        ))}
        <button
          onClick={copyCssVariables}
          className="hit-44 ml-2 rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
          aria-label="Copy CSS variables"
          title="Copy CSS variables"
        >
          Copy CSS Vars
        </button>
      </div>

      {/* Controls (kept) */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <input
          id="base-color"
          aria-label="Base color"
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="w-24 h-10 rounded-md cursor-pointer border border-gray-300"
        />

        <select
          id="algo"
          aria-label="Palette algorithm"
          value={algo}
          onChange={(e) => setAlgo(e.target.value as Algo)}
          className="px-3 py-2 rounded-md border border-gray-300"
        >
          <option value="analogous">Analogous</option>
          <option value="complementary">Complementary</option>
          <option value="triadic">Triadic</option>
          <option value="tetradic">Tetradic</option>
          <option value="monochrome">Monochrome</option>
        </select>

        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Count</span>
          <input
            id="count"
            aria-label="Number of swatches"
            type="range"
            min={3}
            max={10}
            step={1}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
          />
          <span className="w-6 text-sm text-center">{count}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Saturation</span>
          <input
            id="saturation"
            aria-label="Saturation shift"
            type="range"
            min={-40}
            max={40}
            step={1}
            value={satShift}
            onChange={(e) => setSatShift(parseInt(e.target.value, 10))}
          />
          <span className="w-10 text-sm text-center">{satShift > 0 ? `+${satShift}` : satShift}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Luminosity</span>
          <input
            id="lightness"
            aria-label="Luminosity shift"
            type="range"
            min={-40}
            max={40}
            step={1}
            value={lumShift}
            onChange={(e) => setLumShift(parseInt(e.target.value, 10))}
          />
          <span className="w-10 text-sm text-center">{lumShift > 0 ? `+${lumShift}` : lumShift}</span>
        </label>

        <button
          id="generate-btn"
          onClick={() => { generateFromBase(); setFreezeAuto(false); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Generate from Base
        </button>

        <button
          onClick={regenerate}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          Randomize Palette
        </button>

        {/* Export / Share (kept) */}
        <button
          onClick={() => exportPalette("json")}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          Export JSON
        </button>
        <button
          id="export-png-btn"
          onClick={() => exportPalette("png")}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          Download PNG
        </button>
        <button
          onClick={sharePalette}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
        >
          Share Link
        </button>
      </div>

      {/* Palette (kept with Step-3 badge) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {palette.slice(0, count).map((c, i) => {
          const text = bestTextColor(c.hex);
          const ratio = contrastRatio(text, c.hex);
          const badge = badgeForContrast(ratio);

          return (
            <div
              key={i}
              className="relative rounded-xl shadow-sm cursor-pointer transition transform hover:scale-105"
              style={{ backgroundColor: c.hex }}
              onClick={() => copyHex(c.hex)}
              title={`Contrast ${ratio.toFixed(2)}:1 (${badge})`}
            >
              <span
                className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  color: text,
                  background: text === "#000000" ? "rgba(255,255,255,.55)" : "rgba(0,0,0,.35)",
                }}
                aria-label={`Contrast ${badge}`}
              >
                {badge}
              </span>

              <div className="p-2 bg-white/90 rounded-b-xl text-center text-sm">
                <div className="font-mono">{c.hex.toUpperCase()}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(i); }}
                  className="mt-1 text-xs text-gray-500"
                  aria-label={c.locked ? "Unlock swatch" : "Lock swatch"}
                >
                  {c.locked ? "🔒" : "🔓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-gray-500 text-sm">
        Tip: You can mix locked and random colors for unique combinations.
      </p>
    </div>
  );
}

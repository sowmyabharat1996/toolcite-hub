"use client";

import React, { useState, useEffect } from "react";

type Color = { hex: string; locked: boolean };
type Algo = "analogous" | "complementary" | "triadic" | "tetradic" | "monochrome";

/* =======================
   Step 4: Presets
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
   Step 3: WCAG helpers
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
   Utils
   ======================= */
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const mod = (n: number, m: number) => ((n % m) + m) % m;
const randomHex = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
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

/* =======================
   Step 5: Session history
   ======================= */
type SessionSnap = {
  id: string; name: string;
  base: string; algo: Algo; count: number; sat: number; lum: number; colors: string[];
};
const HISTORY_KEY = "tc_color_history_v1";
const loadHistory = (): SessionSnap[] => {
  try { const raw = localStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const saveHistory = (items: SessionSnap[]) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 5))); } catch {} };

/* =======================
   Step 16: Favorites
   ======================= */
type Favorite = { id: string; name: string; colors: string[] };
const FAV_KEY = "tc_color_faves_v1";
const loadFavs = (): Favorite[] => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } };
const saveFavs = (x: Favorite[]) => { try { localStorage.setItem(FAV_KEY, JSON.stringify(x)); } catch {} };

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState("#06A92F");
  const [palette, setPalette] = useState<Color[]>([
    { hex: "#000000", locked: false },
    { hex: "#06A92F", locked: false },
    { hex: "#20CA5F", locked: false },
    { hex: "#46E96F", locked: false },
    { hex: "#67098F", locked: false },
  ]);

  // Step-2 controls
  const [algo, setAlgo] = useState<Algo>("analogous");
  const [count, setCount] = useState<number>(5);
  const [satShift, setSatShift] = useState<number>(0);
  const [lumShift, setLumShift] = useState<number>(0);
  const [freezeAuto, setFreezeAuto] = useState<boolean>(false);

  // Step 5 state
  const [history, setHistory] = useState<SessionSnap[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("");

  // Step 6: Reorder mode
  const [reorderMode, setReorderMode] = useState<boolean>(false);

  // Step 7: Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Step 10: Offline banner
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Step 12: Contrast matrix
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixFilter, setMatrixFilter] = useState<"all" | "AA" | "AAA">("all");

  // Step 11: Import
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  // Step 16: Favorites
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [favSelectedId, setFavSelectedId] = useState("");

  // SR announcer
  const announce = (msg: string) => {
    const el = document.getElementById("a11y-announcer");
    if (el) el.textContent = msg;
  };

  // Step 17: analytics shim (supports GA gtag() or Plausible)
  const track = (event: string, params: Record<string, any> = {}) => {
    try { (window as any).gtag?.("event", event, params); } catch {}
    try { (window as any).plausible?.(event, { props: params }); } catch {}
  };

  // generator
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
    track("randomize", { count });
  };

  const toggleLock = (index: number) => {
    setPalette((prev) => prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c)));
  };

  // Step 4: apply preset (freeze to show exactly, then let user unfreeze)
  const applyPreset = (name: keyof typeof PRESETS) => {
    const hexes = PRESETS[name];
    if (!hexes?.length) return;
    setFreezeAuto(true);
    setBaseColor(hexes[0]);
    setCount(hexes.length);
    setPalette((prev) => hexes.map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false })));
    announce(`${name} preset applied`);
    track("preset_apply", { name });
  };

  // toast helper
  const toast = (msg: string) => {
    try {
      const t = document.createElement("div");
      t.textContent = msg;
      Object.assign(t.style as any, {
        position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
        background: "#333", color: "#fff", padding: "8px 16px", borderRadius: "8px",
        fontSize: "14px", zIndex: "9999", opacity: "0", transition: "opacity .3s ease",
      });
      document.body.appendChild(t);
      requestAnimationFrame(() => (t.style.opacity = "1"));
      setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 400); }, 1400);
    } catch {}
  };

  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    toast(`Copied ${hex.toUpperCase()}!`);
    announce(`Copied ${hex.toUpperCase()} to clipboard`);
    track("copy_hex", { hex });
  };

  // Step 4: Copy CSS Variables
  const copyCssVariables = async () => {
    const vars = palette.slice(0, count).map((c, i) => `  --tc-color-${i + 1}: ${c.hex};`).join("\n");
    const css = `:root{\n${vars}\n}`;
    await navigator.clipboard.writeText(css);
    toast("CSS variables copied!");
    announce("CSS variables copied");
    track("copy_css_vars", { count });
  };

  /* =======================
     Step 8: Pro exports
     ======================= */
  const copyAllHex = async () => {
    const list = palette.slice(0, count).map((c) => c.hex.toUpperCase()).join("\n");
    await navigator.clipboard.writeText(list);
    toast("HEX list copied!");
    announce("All HEX copied");
    track("copy_all_hex", { count });
  };

  const copyCsv = async () => {
    const rows = [
      "index,hex,r,g,b",
      ...palette.slice(0, count).map((c, i) => {
        const { r, g, b } = hexToRgb(c.hex);
        return `${i + 1},${c.hex.toUpperCase()},${r},${g},${b}`;
      }),
    ].join("\n");
    await navigator.clipboard.writeText(rows);
    toast("CSV copied!");
    announce("CSV copied");
    track("copy_csv", { count });
  };

  const copyTailwindSnippet = async () => {
    const entries = palette.slice(0, count).map((c, i) => `        c${i + 1}: "${c.hex.toUpperCase()}"`).join(",\n");
    const js = `// Tailwind config snippet
// usage: class="text-tc-c1 bg-tc-c2"
export default {
  theme: {
    extend: {
      colors: {
        tc: {
${entries}
        }
      }
    }
  }
}`;
    await navigator.clipboard.writeText(js);
    toast("Tailwind snippet copied!");
    announce("Tailwind snippet copied");
    track("copy_tailwind", { count });
  };

  const exportGpl = () => {
    const name = "ToolCite Palette";
    const cols = Math.min(10, Math.max(3, count));
    const lines = [
      "GIMP Palette",
      `Name: ${name}`,
      `Columns: ${cols}`,
      "#",
      ...palette.slice(0, count).map((c, i) => {
        const { r, g, b } = hexToRgb(c.hex);
        const label = `Color ${i + 1}`;
        return `${r} ${g} ${b} ${label}`;
      }),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "palette.gpl";
    link.click();
    announce("GIMP palette downloaded");
    track("export_gpl", { count });
  };

  // export (JSON/PNG upgraded with previews)
  const exportPalette = async (type: "json" | "png") => {
    if (type === "json") {
      const blob = new Blob([JSON.stringify(palette.slice(0, count), null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "palette.json";
      link.click();
      announce("JSON exported");
      track("export_json", { count });
      return;
    }

    // PNG with swatches + tiny preview
    const sw = 120, sh = 120;
    const arr = palette.slice(0, count);
    const w = Math.max(600, arr.length * sw);
    const h = sh + 160; // extra space for previews

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = w; canvas.height = h;

    // swatches row
    arr.forEach((c, i) => {
      ctx.fillStyle = c.hex; ctx.fillRect(i * sw, 0, sw, sh);
    });

    // preview area (simple hero + button)
    const c0 = arr[0]?.hex || "#333", c2 = arr[2]?.hex || "#666";
    ctx.fillStyle = c0; ctx.fillRect(0, sh + 10, w, 140);
    ctx.fillStyle = bestTextColor(c0);
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.fillText("Preview", 16, sh + 40);
    // button
    ctx.fillStyle = c2; ctx.fillRect(16, sh + 60, 120, 40);
    ctx.fillStyle = bestTextColor(c2);
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText("Action", 50, sh + 85);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "palette.png";
    link.click();
    announce("PNG exported");
    track("export_png", { count });
  };

  // share (Step 10: offline-safe + tracking)
  const sharePalette = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("base", baseColor);
    url.searchParams.set("a", algo);
    url.searchParams.set("n", String(count));
    url.searchParams.set("s", String(satShift));
    url.searchParams.set("l", String(lumShift));
    url.searchParams.set("colors", palette.slice(0, count).map((p) => p.hex).join(","));
    const href = url.toString();

    try {
      if (navigator.share) {
        await navigator.share({ title: "My Color Palette", text: "Check out my color palette!", url: href });
        announce("Shared via native share");
        track("share_native");
      } else {
        await navigator.clipboard.writeText(href);
        toast("Link copied to clipboard!");
        announce("Link copied to clipboard");
        track("share_clipboard");
      }
    } catch {
      await navigator.clipboard.writeText(href);
      toast("Link copied to clipboard!");
      announce("Link copied to clipboard");
      track("share_clipboard_fallback");
    }
  };

  // Step 11: Import helpers
  const parseHexes = (txt: string): string[] => {
    const matches = (txt.match(/#[0-9a-fA-F]{6}\b/g) || []).map((s) => s.toUpperCase());
    return Array.from(new Set(matches));
  };
  const applyImport = () => {
    const hexes = parseHexes(importText);
    if (hexes.length < 3) {
      toast("Need at least 3 valid HEX codes");
      announce("Import failed");
      return;
    }
    setFreezeAuto(true);
    setBaseColor(hexes[0]);
    setCount(Math.min(10, hexes.length));
    setPalette((prev) => hexes.slice(0, 10).map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false })));
    toast(`Imported ${hexes.length} colors`);
    announce(`Imported ${hexes.length} colors`);
    track("import_palette", { count: hexes.length });
  };

  // Step 15: From image → extract palette
  const extractFromImageFile = async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((res) => {
      img.onload = () => res();
      img.src = url;
    });
    const size = 64;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = size; canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    const bins = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]; if (a < 200) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const hex = rgbToHex(r, g, b).toUpperCase();
      bins.set(hex, (bins.get(hex) || 0) + 1);
    }
    const sorted = Array.from(bins.entries()).sort((a, b) => b[1] - a[1]).map(([hex]) => hex);

    // pick distinct colors
    const picked: string[] = [];
    for (const hex of sorted) {
      const { r, g, b } = hexToRgb(hex);
      const distinct = picked.every((p) => {
        const q = hexToRgb(p);
        const d = Math.sqrt((r - q.r) ** 2 + (g - q.g) ** 2 + (b - q.b) ** 2);
        return d > 40;
      });
      if (distinct) picked.push(hex);
      if (picked.length >= Math.max(5, count)) break;
    }

    if (picked.length >= 3) {
      setFreezeAuto(true);
      setBaseColor(picked[0]);
      setCount(Math.min(10, picked.length));
      setPalette(picked.slice(0, 10).map((hex) => ({ hex, locked: true })));
      toast(`Extracted ${picked.length} colors`);
      announce("Palette extracted from image");
      track("extract_from_image", { count: picked.length });
    } else {
      toast("Couldn’t extract enough distinct colors");
      announce("Image extraction failed");
    }
  };

  /* ---------- URL decode ---------- */
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

    // Step 5: load saved history & Step 16: favorites on first mount
    setHistory(loadHistory());
    setFavs(loadFavs());

    // Step 10: online listeners
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  /* ---------- URL encode ---------- */
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

  /* ---------- Auto recompute ---------- */
  useEffect(() => {
    if (freezeAuto) return;
    const t = setTimeout(() => generateFromBase(), 180);
    return () => clearTimeout(t);
  }, [baseColor, algo, count, satShift, lumShift, freezeAuto]);

  /* ---------- Step 5: Save/Load sessions ---------- */
  const saveCurrentSession = () => {
    const snap: SessionSnap = {
      id: new Date().toISOString(),
      name: `Run ${new Date().toLocaleString()}`,
      base: baseColor,
      algo,
      count,
      sat: satShift,
      lum: lumShift,
      colors: palette.slice(0, count).map((c) => c.hex),
    };

    const key = snap.colors.join(",");
    const deduped = loadHistory().filter((s) => s.colors.join(",") !== key);
    const next = [snap, ...deduped].slice(0, 5);
    setHistory(next);
    saveHistory(next);
    setSelectedHistoryId(snap.id);
    toast("Session saved!");
    track("session_save", { count });
  };

  const loadSession = (id: string) => {
    const snap = history.find((h) => h.id === id);
    if (!snap) return;
    setFreezeAuto(true);
    setSelectedHistoryId(id);
    setBaseColor(snap.base);
    setAlgo(snap.algo);
    setCount(snap.count);
    setSatShift(snap.sat);
    setLumShift(snap.lum);
    setPalette((prev) =>
      snap.colors.map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false }))
    );
    toast("Session loaded — click Generate from Base to edit");
    track("session_load", { count: snap.colors.length });
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setSelectedHistoryId("");
    toast("History cleared");
    track("session_clear");
  };

  /* ---------- Step 6: Reorder helpers (keyboard/buttons) ---------- */
  const moveSwatch = (index: number, delta: number) => {
    setPalette((prev) => {
      const arr = [...prev];
      const limit = Math.min(count, arr.length);
      const from = clamp(index, 0, limit - 1);
      const to = clamp(index + delta, 0, limit - 1);
      if (from === to) return prev;
      const tmp = arr[from];
      arr[from] = arr[to];
      arr[to] = tmp;
      return arr;
    });
    announce(`Moved swatch ${index + 1} ${delta < 0 ? "left" : "right"}`);
  };

  /* ---------- Step 7: Drag reorder (insert style) ---------- */
  const reorderSwatch = (from: number, to: number) => {
    setPalette((prev) => {
      const arr = [...prev];
      const limit = Math.min(count, arr.length);
      const f = Math.max(0, Math.min(from, limit - 1));
      const t = Math.max(0, Math.min(to, limit - 1));
      if (f === t) return prev;
      const [item] = arr.splice(f, 1);
      arr.splice(t, 0, item);
      return arr;
    });
    announce(`Moved swatch ${from + 1} to position ${to + 1}`);
  };

  /* ---------- Favorites helpers ---------- */
  const addFavorite = () => {
    const name = prompt("Save as…") || `Palette ${new Date().toLocaleString()}`;
    const colors = palette.slice(0, count).map((c) => c.hex);
    const fav = { id: Date.now().toString(), name, colors };
    const next = [fav, ...favs].slice(0, 50);
    setFavs(next); saveFavs(next);
    toast("Saved to Favorites"); announce("Saved to favorites");
    track("favorite_add", { count });
  };
  const applyFavorite = (id: string) => {
    const f = favs.find((x) => x.id === id); if (!f) return;
    setFreezeAuto(true);
    setBaseColor(f.colors[0]); setCount(Math.min(10, f.colors.length));
    setPalette(f.colors.map((hex) => ({ hex, locked: false })));
    announce("Favorite applied"); track("favorite_apply", { count: f.colors.length });
  };
  const deleteFavorite = (id: string) => {
    if (!id) return;
    const next = favs.filter((x) => x.id !== id); setFavs(next); saveFavs(next);
    toast("Favorite deleted"); track("favorite_delete");
    if (favSelectedId === id) setFavSelectedId("");
  };

  /* ---------- UI ---------- */
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* SR live region */}
      <div id="a11y-announcer" aria-live="polite" className="sr-only" />

      {!online && (
        <div className="mb-2 text-center text-xs bg-yellow-100 text-yellow-900 rounded px-2 py-1">
          Offline: actions will queue locally; sharing uses clipboard.
        </div>
      )}

      <h1 className="text-2xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
        🎨 Color Palette Generator – Free Online Tool
      </h1>
      <p className="text-center text-gray-600 mb-4">
        Generate color palettes and shades from a seed color or random selection. Click a swatch to copy HEX.
        Lock colors to keep them during regeneration.
      </p>

      {/* Presets + CSS Vars */}
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

      {/* Controls row */}
      <div className="flex flex-wrap justify-center gap-3 mb-3">
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

        {/* Step 11: Import toggle */}
        <button
          onClick={() => setImportOpen((v) => !v)}
          className="px-4 py-2 bg-gray-100 rounded-md border border-gray-300"
          aria-expanded={importOpen}
        >
          Import…
        </button>

        {/* Step 15: From Image */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) extractFromImageFile(f); }}
          aria-label="Upload image to extract palette"
          className="hidden"
          id="img-extract"
        />
        <label
          htmlFor="img-extract"
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer"
        >
          From Image
        </label>

        {/* Step 6: Reorder Mode toggle */}
        <button
          onClick={() => setReorderMode((v) => !v)}
          className={`px-3 py-2 rounded-md border ${reorderMode ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-300 hover:bg-gray-50"}`}
          aria-pressed={reorderMode}
          aria-label="Toggle reorder mode"
          title="Reorder swatches with arrows or drag handle"
        >
          {reorderMode ? "✅ Reorder: ON" : "↔ Reorder"}
        </button>
      </div>

      {/* Step 11: Import UI */}
      {importOpen && (
        <div className="w-full max-w-3xl mx-auto my-3">
          <textarea
            className="w-full min-h-[120px] border rounded-md p-3 font-mono text-sm"
            placeholder="#112233, #445566 … or paste CSS with --vars"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            aria-label="Paste HEX list or CSS with colors"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={applyImport} className="px-3 py-2 rounded-md bg-blue-600 text-white">Apply Import</button>
            <button onClick={() => setImportOpen(false)} className="px-3 py-2 rounded-md border">Close</button>
          </div>
        </div>
      )}

      {/* Step 5: Save + History + Favorites */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={saveCurrentSession}
          className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          aria-label="Save current session"
        >
          💾 Save Session
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="hist" className="text-sm text-gray-600">History:</label>
          <select
            id="hist"
            value={selectedHistoryId}
            onChange={(e) => loadSession(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 min-w-[240px]"
            aria-label="Restore a previous session"
          >
            <option value="" disabled>Choose a saved run…</option>
            {history.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} — {h.colors[0]} … ({h.colors.length})
              </option>
            ))}
          </select>
          <button
            onClick={clearHistory}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            aria-label="Clear history"
            title="Clear all saved sessions"
          >
            🧹 Clear
          </button>
        </div>

        {/* Favorites */}
        <button
          onClick={addFavorite}
          className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          aria-label="Save to favorites"
        >
          ⭐ Save Favorite
        </button>
        {favs.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Favorites:</label>
            <select
              value={favSelectedId}
              onChange={(e) => { const id = e.target.value; setFavSelectedId(id); applyFavorite(id); }}
              className="px-3 py-2 rounded-md border min-w-[220px]"
            >
              <option value="">Choose…</option>
              {favs.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.colors.length})</option>)}
            </select>
            <button
              onClick={() => deleteFavorite(favSelectedId)}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>

      {/* Step 8: Pro Exports */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={copyAllHex}
          className="hit-44 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          aria-label="Copy all HEX values"
          title="Copy all HEX values"
        >
          Copy HEX
        </button>
        <button
          onClick={copyCsv}
          className="hit-44 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          aria-label="Copy CSV"
          title="Copy CSV (index,hex,r,g,b)"
        >
          Copy CSV
        </button>
        <button
          onClick={copyTailwindSnippet}
          className="hit-44 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          aria-label="Copy Tailwind snippet"
          title="Copy Tailwind snippet"
        >
          Copy Tailwind
        </button>
        <button
          onClick={exportGpl}
          className="hit-44 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          aria-label="Export GIMP palette"
          title="Export .gpl (GIMP Palette)"
        >
          Export .gpl
        </button>
      </div>

      {/* Palette */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {palette.slice(0, count).map((c, i) => {
          const text = bestTextColor(c.hex);
          const ratio = contrastRatio(text, c.hex);
          const badge = badgeForContrast(ratio);

          return (
            <div
              key={i}
              className="relative rounded-xl shadow-sm cursor-pointer transition transform hover:scale-105 focus:outline-none"
              style={{
                backgroundColor: c.hex,
                outline: reorderMode && overIndex === i ? "2px solid rgba(59,130,246,.9)" : undefined,
                outlineOffset: reorderMode && overIndex === i ? "2px" : undefined,
              }}
              onClick={() => !reorderMode && copyHex(c.hex)}
              onKeyDown={(e) => {
                // Step 6: keyboard reorder
                if (reorderMode) {
                  if (e.key === "ArrowLeft") { e.preventDefault(); moveSwatch(i, -1); }
                  if (e.key === "ArrowRight") { e.preventDefault(); moveSwatch(i, +1); }
                } else if (e.key === "Enter" || e.key === " ") {
                  // Step 9: Enter/Space copies
                  e.preventDefault(); copyHex(c.hex);
                }
              }}
              tabIndex={0}
              title={`Contrast ${ratio.toFixed(2)}:1 (${badge})`}
              aria-label={`Swatch ${i + 1} ${c.hex}`}
              onDragOver={reorderMode ? (e) => { e.preventDefault(); } : undefined}
              onDragEnter={reorderMode ? (e) => { e.preventDefault(); setOverIndex(i); } : undefined}
              onDragLeave={reorderMode ? () => setOverIndex((v) => (v === i ? null : v)) : undefined}
              onDrop={reorderMode ? (e) => {
                e.preventDefault();
                const fromAttr = e.dataTransfer?.getData("text/plain");
                const from = dragIndex ?? (fromAttr ? parseInt(fromAttr, 10) : NaN);
                if (!Number.isNaN(from)) reorderSwatch(from, i);
                setDragIndex(null);
                setOverIndex(null);
              } : undefined}
            >
              {/* Contrast badge */}
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

              {/* Step 7: drag handle + Step 6 arrows (only in Reorder mode) */}
              {reorderMode && (
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    className="rounded-full bg-white/90 px-2 py-1 text-xs shadow hover:bg-white cursor-grab active:cursor-grabbing"
                    draggable
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDragIndex(i);
                      e.dataTransfer.effectAllowed = "move";
                      try { e.dataTransfer.setData("text/plain", String(i)); } catch {}
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    aria-label="Drag to reorder"
                    title="Drag to reorder"
                  >
                    ⠿
                  </button>
                  <button
                    className="rounded-full bg-white/90 px-2 py-1 text-xs shadow hover:bg-white"
                    onClick={(e) => { e.stopPropagation(); moveSwatch(i, -1); }}
                    aria-label="Move left"
                    title="Move left"
                  >
                    ◀
                  </button>
                  <button
                    className="rounded-full bg-white/90 px-2 py-1 text-xs shadow hover:bg-white"
                    onClick={(e) => { e.stopPropagation(); moveSwatch(i, +1); }}
                    aria-label="Move right"
                    title="Move right"
                  >
                    ▶
                  </button>
                </div>
              )}

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

      {/* Step 12: Contrast matrix controls */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button onClick={() => setShowMatrix((v) => !v)} className="px-3 py-2 rounded-md border">
          {showMatrix ? "Hide Contrast Matrix" : "Show Contrast Matrix"}
        </button>
        {showMatrix && (
          <select
            value={matrixFilter}
            onChange={(e) => setMatrixFilter(e.target.value as any)}
            className="px-3 py-2 rounded-md border"
          >
            <option value="all">All</option>
            <option value="AA">AA (≥4.5)</option>
            <option value="AAA">AAA (≥7)</option>
          </select>
        )}
      </div>

      {/* Step 12: Contrast matrix table */}
      {showMatrix && (
        <div className="overflow-auto">
          <table className="mx-auto text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-1"></th>
                {palette.slice(0, count).map((c, i) => (
                  <th key={"h" + i} className="p-1 font-mono">{c.hex.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {palette.slice(0, count).map((row, i) => (
                <tr key={"r" + i}>
                  <th className="p-1 font-mono">{row.hex.toUpperCase()}</th>
                  {palette.slice(0, count).map((col, j) => {
                    const ratio = contrastRatio(row.hex, col.hex);
                    const passAA = ratio >= 4.5, passAAA = ratio >= 7;
                    if (matrixFilter === "AA" && !passAA)
                      return <td key={`${i}-${j}`} className="p-1 text-center text-gray-400">–</td>;
                    if (matrixFilter === "AAA" && !passAAA)
                      return <td key={`${i}-${j}`} className="p-1 text-center text-gray-400">–</td>;
                    const t = bestTextColor(col.hex);
                    return (
                      <td key={`${i}-${j}`} className="p-1 text-center rounded" style={{ background: col.hex, color: t }}>
                        {ratio.toFixed(1)}{passAAA ? " ★" : " "}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Step 13: Mini UI previews */}
      <div className="max-w-3xl mx-auto mt-6 grid gap-4 sm:grid-cols-2">
        {/* Card */}
        <div
          className="rounded-xl shadow p-4"
          style={{ background: palette[1]?.hex, color: bestTextColor(palette[1]?.hex || "#fff") }}
        >
          <div className="text-sm opacity-80">Card</div>
          <div className="text-lg font-semibold">Sample Card</div>
          <p className="text-sm opacity-90">Uses c2 as background, c1 for header stripe.</p>
          <div className="h-1 mt-2 rounded" style={{ background: palette[0]?.hex }} />
        </div>

        {/* Hero + Button */}
        <div
          className="rounded-xl p-6"
          style={{ background: palette[0]?.hex, color: bestTextColor(palette[0]?.hex || "#fff") }}
        >
          <div className="text-xl font-bold mb-2">Hero Heading</div>
          <p className="text-sm mb-3">Buttons use c3, text over c0.</p>
          <button
            className="rounded px-3 py-2 font-medium shadow"
            style={{ background: palette[2]?.hex, color: bestTextColor(palette[2]?.hex || "#fff") }}
          >
            Action
          </button>
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-6">
        Tip: Toggle <strong>↔ Reorder</strong>, then drag with ⠿ or use ◀ / ▶ (or keyboard ← / → on a focused swatch).
      </p>
    </div>
  );
}

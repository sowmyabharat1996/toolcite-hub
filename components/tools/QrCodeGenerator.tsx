"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type ECLevel = "L" | "M" | "Q" | "H";

const DEFAULTS = {
  text: "",
  size: 256,
  margin: 2,
  errorLevel: "M" as ECLevel,
  fg: "#111827",
  bg: "#ffffff",
};

const HISTORY_KEY = "qrHistory.v1";

function safeGetHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function safeSetHistory(list: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {}
}

function withHash(hex: string) {
  // accept '111827' or '#111827' and normalize
  if (!hex) return "";
  return hex.startsWith("#") ? hex : `#${hex}`;
}

export default function QrCodeGenerator() {
  const [text, setText] = useState(DEFAULTS.text);
  const [size, setSize] = useState(DEFAULTS.size);
  const [margin, setMargin] = useState(DEFAULTS.margin);
  const [errorLevel, setErrorLevel] = useState<ECLevel>(DEFAULTS.errorLevel);
  const [fg, setFg] = useState(DEFAULTS.fg);
  const [bg, setBg] = useState(DEFAULTS.bg);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Offline banner state
  const [online, setOnline] = useState(true);

  // Recent entries (safe localStorage)
  const [recent, setRecent] = useState<string[]>([]);

  // ---------- Render QR to canvas ----------
  const render = async () => {
    if (!canvasRef.current) return;
    await QRCode.toCanvas(
      canvasRef.current,
      (text || "https://toolcite.com").trim(),
      {
        width: size,
        margin,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: errorLevel,
        scale: 8,
      }
    );
  };

  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, margin, errorLevel, fg, bg]);

  // ---------- URL → State (on mount) ----------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("t") ?? DEFAULTS.text;
    const s = Number(sp.get("s") ?? DEFAULTS.size);
    const m = Number(sp.get("m") ?? DEFAULTS.margin);
    const e = (sp.get("e") as ECLevel) ?? DEFAULTS.errorLevel;
    const f = withHash(sp.get("fg") ?? DEFAULTS.fg);
    const b = withHash(sp.get("bg") ?? DEFAULTS.bg);

    setText(t);
    setSize(Number.isFinite(s) ? s : DEFAULTS.size);
    setMargin(Number.isFinite(m) ? m : DEFAULTS.margin);
    setErrorLevel(["L", "M", "Q", "H"].includes(e) ? e : DEFAULTS.errorLevel);
    setFg(f);
    setBg(b);

    // history + online
    setRecent(safeGetHistory());
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ---------- State → URL (debounced-ish, but light) ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();

    if (text) sp.set("t", text);
    if (size !== DEFAULTS.size) sp.set("s", String(size));
    if (margin !== DEFAULTS.margin) sp.set("m", String(margin));
    if (errorLevel !== DEFAULTS.errorLevel) sp.set("e", errorLevel);
    if (fg !== DEFAULTS.fg) sp.set("fg", fg.replace("#", ""));
    if (bg !== DEFAULTS.bg) sp.set("bg", bg.replace("#", ""));

    const qs = sp.toString();
    const url = qs ? `?${qs}` : "";
    window.history.replaceState(null, "", url);
  }, [text, size, margin, errorLevel, fg, bg]);

  // ---------- Save “recent” texts ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = (text || "").trim();
    if (!t) return;
    const curr = safeGetHistory();
    if (curr[0] === t) return;
    const next = [t, ...curr.filter((x) => x !== t)].slice(0, 5);
    setRecent(next);
    safeSetHistory(next);
  }, [text]);

  // ---------- Download helpers ----------
  const download = (type: "png" | "jpg" | "webp" | "svg") => {
    if (type === "svg") {
      QRCode.toString(text || "https://toolcite.com", {
        type: "svg",
        margin,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: errorLevel,
        width: size,
      }).then((svg) => {
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qrcode.svg";
        a.click();
        URL.revokeObjectURL(url);
      });
      return;
    }
    const canvas = canvasRef.current!;
    const mime = type === "jpg" ? "image/jpeg" : `image/${type}`;
    const link = document.createElement("a");
    link.href = canvas.toDataURL(mime);
    link.download = `qrcode.${type === "jpg" ? "jpg" : type}`;
    link.click();
  };

  // ---------- Share / Export JSON ----------
  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
  };

  const exportJSON = () => {
    const data = {
      text,
      size,
      margin,
      errorLevel,
      fg,
      bg,
      url: typeof window !== "undefined" ? window.location.href : "",
      ts: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Presets ----------
  const setPreset = (kind: "url" | "wifi" | "vcard") => {
    if (kind === "url") setText("https://toolcite.com");
    if (kind === "wifi")
      setText("WIFI:T:WPA;S:YourSSID;P:password123;;");
    if (kind === "vcard")
      setText(
        "BEGIN:VCARD\nVERSION:3.0\nN:Kumar;Bharat;;;\nFN:Bharat Kumar\nEMAIL:hello@example.com\nTEL:+91 9000000000\nEND:VCARD"
      );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: Controls */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900">
        {!online && (
          <div
            className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
            role="status"
            aria-live="polite"
          >
            You’re offline — QR generation still works locally.
          </div>
        )}

        <label className="block text-sm font-medium mb-1" htmlFor="qr-text">
          Text / URL
        </label>
        <textarea
          id="qr-text"
          aria-label="QR content"
          className="w-full rounded-lg border p-3 bg-white dark:bg-neutral-900"
          rows={4}
          placeholder="Paste text or a URL"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Presets */}
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <button
            onClick={() => setPreset("url")}
            className="rounded border px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            URL
          </button>
          <button
            onClick={() => setPreset("wifi")}
            className="rounded border px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            Wi-Fi
          </button>
          <button
            onClick={() => setPreset("vcard")}
            className="rounded border px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            vCard
          </button>

          {recent.length > 0 && (
            <div className="ml-auto">
              <label className="mr-2 text-gray-600 text-xs">Recent:</label>
              <select
                aria-label="Recent QR texts"
                className="rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800 text-xs"
                onChange={(e) => setText(e.target.value)}
                value=""
              >
                <option value="" disabled>
                  Select…
                </option>
                {recent.map((r, i) => (
                  <option key={i} value={r}>
                    {r.length > 40 ? r.slice(0, 40) + "…" : r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-size">
              Size (px)
            </label>
            <input
              id="qr-size"
              aria-label="QR size"
              type="number"
              min={128}
              max={1024}
              step={32}
              value={size}
              onChange={(e) => setSize(+e.target.value)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-margin">
              Margin
            </label>
            <input
              id="qr-margin"
              aria-label="QR margin"
              type="number"
              min={0}
              max={16}
              value={margin}
              onChange={(e) => setMargin(+e.target.value)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-ecl">
              Error Correction
            </label>
            <select
              id="qr-ecl"
              aria-label="Error correction level"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as ECLevel)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900"
            >
              <option value="L">L (low)</option>
              <option value="M">M (default)</option>
              <option value="Q">Q</option>
              <option value="H">H (highest)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-fg">
              Foreground
            </label>
            <input
              id="qr-fg"
              aria-label="Foreground color"
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-10 w-full rounded-lg border"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-bg">
              Background
            </label>
            <input
              id="qr-bg"
              aria-label="Background color"
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-10 w-full rounded-lg border"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => download("png")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Download PNG
          </button>
          <button onClick={() => download("jpg")} className="rounded-lg border px-4 py-2">
            JPG
          </button>
          <button onClick={() => download("webp")} className="rounded-lg border px-4 py-2">
            WEBP
          </button>
          <button onClick={() => download("svg")} className="rounded-lg border px-4 py-2">
            SVG
          </button>

          <span className="mx-2" />

          <button onClick={exportJSON} className="rounded-lg border px-4 py-2">
            Export JSON
          </button>
          <button onClick={shareLink} className="rounded-lg border px-4 py-2">
            Share Link
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900 flex flex-col items-center justify-center">
        <canvas ref={canvasRef} className="rounded-xl shadow-sm" />
        <p className="mt-3 text-xs text-gray-500">
          Tip: increase size before downloading for hi-res.
        </p>
      </div>
    </div>
  );
}

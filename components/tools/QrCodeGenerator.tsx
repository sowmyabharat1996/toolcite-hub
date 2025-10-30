"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(2);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fg, setFg] = useState("#111827"); // gray-900
  const [bg, setBg] = useState("#ffffff");
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render current QR
  const render = async () => {
    if (!canvasRef.current) return;
    await QRCode.toCanvas(canvasRef.current, text || "https://toolcite.com", {
      width: size,
      margin,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: errorLevel,
      scale: 8,
    });
  };

  // URL → state on mount
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setText(sp.get("t") ?? "");
    setSize(Number(sp.get("w") ?? 256));
    setMargin(Number(sp.get("m") ?? 2));
    const lvl = sp.get("e") as "L" | "M" | "Q" | "H" | null;
    setErrorLevel(lvl ?? "M");
    setFg(sp.get("fg") ?? "#111827");
    setBg(sp.get("bg") ?? "#ffffff");

    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // State → URL (debounced a bit)
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      text ? sp.set("t", text) : sp.delete("t");
      sp.set("w", String(size));
      sp.set("m", String(margin));
      sp.set("e", errorLevel);
      sp.set("fg", fg);
      sp.set("bg", bg);
      const url = window.location.pathname + "?" + sp.toString();
      window.history.replaceState(null, "", url);
      render();
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, margin, errorLevel, fg, bg]);

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
    const link = document.createElement("a");
    const canvas = canvasRef.current!;
    link.href = canvas.toDataURL(`image/${type === "jpg" ? "jpeg" : type}`);
    link.download = `qrcode.${type === "jpg" ? "jpg" : type}`;
    link.click();
  };

  const shareLink = async () => {
    const href = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: href });
        return;
      }
    } catch {}
    await navigator.clipboard.writeText(href);
    alert("Link copied to clipboard");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {!online && (
        <div className="md:col-span-2 rounded-lg bg-yellow-100 text-yellow-900 text-xs px-3 py-2">
          Offline: sharing falls back to clipboard; downloads still work.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900">
        <label className="block text-sm font-medium mb-1" htmlFor="qr-text">Text / URL</label>
        <textarea
          id="qr-text"
          className="w-full rounded-lg border p-3 bg-white dark:bg-neutral-900"
          rows={4}
          placeholder="Paste text or a URL"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-size">Size (px)</label>
            <input
              id="qr-size"
              type="number"
              min={128}
              max={1024}
              step={32}
              value={size}
              onChange={(e) => setSize(+e.target.value)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900"
              aria-label="QR size in pixels"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-margin">Margin</label>
            <input
              id="qr-margin"
              type="number"
              min={0}
              max={16}
              value={margin}
              onChange={(e) => setMargin(+e.target.value)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-ecc">Error Correction</label>
            <select
              id="qr-ecc"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as any)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900"
            >
              <option value="L">L (low)</option>
              <option value="M">M (default)</option>
              <option value="Q">Q</option>
              <option value="H">H (highest)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-fg">Foreground</label>
            <input
              id="qr-fg"
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-10 w-full rounded-lg border"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="qr-bg">Background</label>
            <input
              id="qr-bg"
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-10 w-full rounded-lg border"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => download("png")} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Download PNG</button>
          <button onClick={() => download("jpg")} className="rounded-lg border px-4 py-2">JPG</button>
          <button onClick={() => download("webp")} className="rounded-lg border px-4 py-2">WEBP</button>
          <button onClick={() => download("svg")} className="rounded-lg border px-4 py-2">SVG</button>
          <button onClick={shareLink} className="rounded-lg border px-4 py-2">Share Link</button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900 flex flex-col items-center justify-center">
        <canvas ref={canvasRef} className="rounded-xl shadow-sm" />
        <p className="mt-3 text-xs text-gray-500">Tip: increase size before downloading for hi-res.</p>
      </div>
    </div>
  );
}

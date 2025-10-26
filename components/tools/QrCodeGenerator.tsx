"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(2);
  const [errorLevel, setErrorLevel] =
    useState<"L" | "M" | "Q" | "H">("M");
  const [fg, setFg] = useState("#111827"); // gray-900
  const [bg, setBg] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  useEffect(() => { render(); }, [text, size, margin, errorLevel, fg, bg]);

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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Controls */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900">
        <label className="block text-sm font-medium mb-1">Text / URL</label>
        <textarea
          className="w-full rounded-lg border p-3 bg-white dark:bg-neutral-900"
          rows={4}
          placeholder="Paste text or a URL"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Size (px)</label>
            <input type="number" min={128} max={1024} step={32}
              value={size} onChange={(e) => setSize(+e.target.value)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900" />
          </div>
          <div>
            <label className="block text-sm mb-1">Margin</label>
            <input type="number" min={0} max={16}
              value={margin} onChange={(e) => setMargin(+e.target.value)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900" />
          </div>
          <div>
            <label className="block text-sm mb-1">Error Correction</label>
            <select value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as any)}
              className="w-full rounded-lg border p-2 bg-white dark:bg-neutral-900">
              <option value="L">L (low)</option>
              <option value="M">M (default)</option>
              <option value="Q">Q</option>
              <option value="H">H (highest)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Foreground</label>
            <input type="color" value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-10 w-full rounded-lg border" />
          </div>
          <div>
            <label className="block text-sm mb-1">Background</label>
            <input type="color" value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-10 w-full rounded-lg border" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => download("png")} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Download PNG</button>
          <button onClick={() => download("jpg")} className="rounded-lg border px-4 py-2">JPG</button>
          <button onClick={() => download("webp")} className="rounded-lg border px-4 py-2">WEBP</button>
          <button onClick={() => download("svg")} className="rounded-lg border px-4 py-2">SVG</button>
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

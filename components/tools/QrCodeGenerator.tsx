"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(2);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fg, setFg] = useState("#111827");
  const [bg, setBg] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // render QR
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

  useEffect(() => {
    void render();
  }, [text, size, margin, errorLevel, fg, bg]);

  function download(type: "png" | "jpg" | "webp" | "svg") {
    const value = text || "https://toolcite.com";

    // SVG branch
    if (type === "svg") {
      QRCode.toString(value, {
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

    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL(
      `image/${type === "jpg" ? "jpeg" : type}`
    );
    link.download = `qrcode.${type === "jpg" ? "jpg" : type}`;
    link.click();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Controls */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900/80">
        <div className="mb-4">
          <label
            htmlFor="qr-text"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Text / URL
          </label>
          <textarea
            id="qr-text"
            className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-3 text-sm"
            rows={4}
            placeholder="Paste text or a URL"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label
              htmlFor="qr-size"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Size (px)
            </label>
            <input
              id="qr-size"
              type="number"
              min={128}
              max={1024}
              step={32}
              value={size}
              onChange={(e) => setSize(Number(e.target.value) || 256)}
              className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-2 text-sm"
              aria-describedby="qr-size-hint"
            />
            <p id="qr-size-hint" className="sr-only">
              Choose the final exported QR size in pixels
            </p>
          </div>

          <div>
            <label
              htmlFor="qr-margin"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Margin
            </label>
            <input
              id="qr-margin"
              type="number"
              min={0}
              max={16}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value) || 2)}
              className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <div>
            <label
              htmlFor="qr-error"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Error Correction
            </label>
            <select
              id="qr-error"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-2 text-sm"
            >
              <option value="L">L (low, biggest capacity)</option>
              <option value="M">M (default)</option>
              <option value="Q">Q</option>
              <option value="H">H (highest, best for logos)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="qr-fg"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Foreground
            </label>
            <input
              id="qr-fg"
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40"
              aria-label="Pick a foreground color for the QR code"
            />
          </div>

          <div>
            <label
              htmlFor="qr-bg"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Background
            </label>
            <input
              id="qr-bg"
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40"
              aria-label="Pick a background color for the QR code"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void render()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            aria-label="Generate QR code"
          >
            Generate QR
          </button>
          <button
            onClick={() => download("png")}
            className="rounded-lg bg-neutral-900/90 text-white px-4 py-2 text-sm hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500"
            aria-label="Download QR code as PNG"
          >
            PNG
          </button>
          <button
            onClick={() => download("jpg")}
            className="rounded-lg bg-neutral-900/90 text-white px-4 py-2 text-sm hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500"
            aria-label="Download QR code as JPG"
          >
            JPG
          </button>
          <button
            onClick={() => download("webp")}
            className="rounded-lg bg-neutral-900/90 text-white px-4 py-2 text-sm hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500"
            aria-label="Download QR code as WEBP"
          >
            WEBP
          </button>
          <button
            onClick={() => download("svg")}
            className="rounded-lg bg-neutral-900/90 text-white px-4 py-2 text-sm hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500"
            aria-label="Download QR code as SVG"
          >
            SVG
          </button>
          <button
            onClick={() => {
              const u = new URL(window.location.href);
              u.searchParams.set("t", text || "https://toolcite.com");
              u.searchParams.set("w", String(size));
              u.searchParams.set("m", String(margin));
              u.searchParams.set("e", errorLevel);
              u.searchParams.set("fg", fg);
              u.searchParams.set("bg", bg);
              navigator.clipboard.writeText(u.toString());
            }}
            className="rounded-lg border border-neutral-500/50 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500"
            aria-label="Copy a shareable link to this QR code"
          >
            Share Link
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border p-5 bg-white/70 dark:bg-neutral-900/80 flex flex-col items-center justify-center gap-3">
        <p className="sr-only" id="qr-preview-title">
          QR code preview
        </p>
        <canvas
          ref={canvasRef}
          aria-labelledby="qr-preview-title"
          className="rounded-xl shadow-sm bg-white dark:bg-neutral-800"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Tip: increase size before downloading for hi-res.
        </p>
      </div>
    </div>
  );
}

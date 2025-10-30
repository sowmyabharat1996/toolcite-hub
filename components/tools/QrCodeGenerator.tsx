"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeGenerator() {
  // keep user typing as string
  const [sizeInput, setSizeInput] = useState("256");
  const [marginInput, setMarginInput] = useState("2");

  const size = Math.min(Math.max(Number(sizeInput || "256"), 128), 1024);
  const margin = Math.min(Math.max(Number(marginInput || "2"), 0), 16);

  const [text, setText] = useState("");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fg, setFg] = useState("#111827");
  const [bg, setBg] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function render() {
    if (!canvasRef.current) return;
    await QRCode.toCanvas(canvasRef.current, text || "https://toolcite.com", {
      width: size,
      margin,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: errorLevel,
      scale: 8,
    });
  }

  useEffect(() => {
    void render();
  }, [text, size, margin, errorLevel, fg, bg]);

  function download(type: "png" | "jpg" | "webp" | "svg") {
    const value = text || "https://toolcite.com";

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
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL(
      `image/${type === "jpg" ? "jpeg" : type}`
    );
    a.download = `qrcode.${type === "jpg" ? "jpg" : type}`;
    a.click();
  }

  const canShare = typeof window !== "undefined";

  function handleShare() {
    if (!canShare) return;
    const u = new URL(window.location.href);
    u.searchParams.set("t", text || "https://toolcite.com");
    u.searchParams.set("w", String(size));
    u.searchParams.set("m", String(margin));
    u.searchParams.set("e", errorLevel);
    u.searchParams.set("fg", fg);
    u.searchParams.set("bg", bg);
    navigator.clipboard.writeText(u.toString());
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-3 text-sm"
            placeholder="Paste text or a URL"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Size */}
          <div>
            <label
              htmlFor="qr-size"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Size (px)
            </label>
            <input
              id="qr-size"
              inputMode="numeric"
              value={sizeInput}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^[0-9]+$/.test(v)) {
                  setSizeInput(v);
                }
              }}
              className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-2 text-sm"
              placeholder="256"
              aria-describedby="qr-size-hint"
            />
            <p id="qr-size-hint" className="sr-only">
              Choose the final exported QR size in pixels
            </p>
          </div>

          {/* Margin */}
          <div>
            <label
              htmlFor="qr-margin"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Margin
            </label>
            <input
              id="qr-margin"
              inputMode="numeric"
              value={marginInput}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^[0-9]+$/.test(v)) {
                  setMarginInput(v);
                }
              }}
              className="mt-1 w-full rounded-lg border border-neutral-200/70 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 p-2 text-sm"
              placeholder="2"
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
              <option value="L">L (low)</option>
              <option value="M">M (default)</option>
              <option value="Q">Q</option>
              <option value="H">H (highest)</option>
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
          >
            Generate QR
          </button>
          <button
            onClick={() => download("png")}
            className="rounded-lg bg-neutral-900/90 dark:bg-neutral-700 text-white px-4 py-2 text-sm"
          >
            PNG
          </button>
          <button
            onClick={() => download("jpg")}
            className="rounded-lg bg-neutral-900/90 dark:bg-neutral-700 text-white px-4 py-2 text-sm"
          >
            JPG
          </button>
          <button
            onClick={() => download("webp")}
            className="rounded-lg bg-neutral-900/90 dark:bg-neutral-700 text-white px-4 py-2 text-sm"
          >
            WEBP
          </button>
          <button
            onClick={() => download("svg")}
            className="rounded-lg bg-neutral-900/90 dark:bg-neutral-700 text-white px-4 py-2 text-sm"
          >
            SVG
          </button>
          {/* 👇 fixed contrast button */}
          <button
            type="button"
            onClick={handleShare}
            disabled={!canShare}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              canShare
                ? "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                : "bg-neutral-100 text-neutral-400 border-neutral-100 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-800 cursor-not-allowed"
            }`}
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

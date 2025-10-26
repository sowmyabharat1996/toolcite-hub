"use client";

import React, { useMemo, useRef, useState } from "react";

type OutFormat = "image/jpeg" | "image/webp" | "image/png";

// Small helper to prettify sizes
function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function ImageCompressor() {
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [imgURL, setImgURL] = useState<string>("");

  const [compressedURL, setCompressedURL] = useState<string>("");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);

  const [quality, setQuality] = useState<number>(0.8);
  const [maxW, setMaxW] = useState<number>(1600);
  const [maxH, setMaxH] = useState<number>(1600);
  const [format, setFormat] = useState<OutFormat>("image/jpeg");
  const [busy, setBusy] = useState(false);

  const origKB = useMemo(
    () => (file ? Math.round(file.size / 1024) : 0),
    [file]
  );
  const compressedKB = useMemo(
    () => (compressedBlob ? Math.round(compressedBlob.size / 1024) : 0),
    [compressedBlob]
  );
  const savedPct = useMemo(() => {
    if (!origKB || !compressedKB) return null;
    const pct = Math.max(0, Math.round(((origKB - compressedKB) / origKB) * 100));
    return pct;
  }, [origKB, compressedKB]);

  async function handleFile(f: File) {
    setFile(f);
    const url = URL.createObjectURL(f);
    setImgURL(url);
    setCompressedURL("");
    setCompressedBlob(null);
  }

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await handleFile(f);
  }

  function drawScaled(
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    let { width, height } = img;

    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  }

  async function compress() {
    if (!file) return;
    setBusy(true);
    try {
      const img = document.createElement("img");
      img.src = imgURL;
      await img.decode();

      const canvas = drawScaled(img, maxW, maxH);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(
          (b) => resolve(b),
          format,
          format === "image/png" ? undefined : quality
        )
      );

      if (!blob) {
        alert("Failed to compress image.");
        return;
      }

      setCompressedBlob(blob);
      if (compressedURL) URL.revokeObjectURL(compressedURL);
      const outUrl = URL.createObjectURL(blob);
      setCompressedURL(outUrl);
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!compressedBlob) return;
    const a = document.createElement("a");
    const ext =
      format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
    a.href = compressedURL;
    a.download = `compressed.${ext}`;
    a.click();
  }

  function resetAll() {
    setFile(null);
    setImgURL("");
    setCompressedURL("");
    setCompressedBlob(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: controls */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select image</label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={onSelect}
              className="block w-full text-sm"
            />
            {file && (
              <div className="mt-1 text-xs text-gray-500">
                {file.name} — {origKB} KB
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max width (px)</label>
              <input
                type="number"
                min={64}
                value={maxW}
                onChange={(e) => setMaxW(parseInt(e.target.value || "0", 10))}
                className="w-full rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max height (px)</label>
              <input
                type="number"
                min={64}
                value={maxH}
                onChange={(e) => setMaxH(parseInt(e.target.value || "0", 10))}
                className="w-full rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Quality{" "}
              {format !== "image/png"
                ? `(${Math.round(quality * 100)}%)`
                : "(ignored for PNG)"}
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              disabled={format === "image/png"}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Output format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as OutFormat)}
              className="w-full rounded border px-2 py-1 bg-white/60 dark:bg-neutral-800"
            >
              <option value="image/jpeg">JPG (best compatibility)</option>
              <option value="image/webp">WEBP (smaller size)</option>
              <option value="image/png">PNG (lossless)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={compress}
              disabled={!file || busy}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
            >
              {busy ? "Compressing…" : "Compress"}
            </button>
            <button
              onClick={download}
              disabled={!compressedBlob}
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
              title={compressedBlob ? `Download ${formatBytes(compressedBlob.size)}` : "Download"}
            >
              {compressedBlob ? `Download (${formatBytes(compressedBlob.size)})` : "Download"}
            </button>
            <button onClick={resetAll} className="ml-auto rounded-lg border px-3 py-2">
              Reset
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Tip: Larger max width/height gives higher quality but bigger files. WEBP usually yields
            the smallest output.
          </p>
        </div>
      </div>

      {/* Right: previews */}
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5">
        <div className="grid gap-6">
          <div>
            <div className="text-sm font-medium mb-2">
              Original {origKB ? `— ${origKB} KB` : ""}
            </div>
            <div className="aspect-square rounded-lg bg-white dark:bg-neutral-800 grid place-items-center overflow-hidden">
              {imgURL ? (
                <img src={imgURL} alt="original" className="object-contain max-h-full" />
              ) : (
                <span className="text-sm text-gray-500">No image selected</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">
              {compressedBlob ? (
                <>
                  Compressed — {formatBytes(compressedBlob.size)}{" "}
                  {savedPct !== null && (
                    <span className="text-green-600 dark:text-green-400">
                      (−{savedPct}%)
                    </span>
                  )}
                </>
              ) : (
                "Compressed"
              )}
            </div>
            <div className="aspect-square rounded-lg bg-white dark:bg-neutral-800 grid place-items-center overflow-hidden">
              {compressedURL ? (
                <img
                  src={compressedURL}
                  alt="compressed"
                  className="object-contain max-h-full"
                />
              ) : (
                <span className="text-sm text-gray-500">Run “Compress” to preview</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

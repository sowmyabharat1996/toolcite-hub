"use client";

import React, { useState, useEffect } from "react";

type Color = {
  hex: string;
  locked: boolean;
};

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState("#06A92F");
  const [palette, setPalette] = useState<Color[]>([
    { hex: "#000000", locked: false },
    { hex: "#06A92F", locked: false },
    { hex: "#20CA5F", locked: false },
    { hex: "#46E96F", locked: false },
    { hex: "#67098F", locked: false },
  ]);

  // --- Utilities ---
  const randomHex = () =>
    "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");

  const generateFromBase = () => {
    const shades = Array.from({ length: 5 }, (_, i) => ({
      hex: shadeColor(baseColor, i * 20 - 40),
      locked: palette[i]?.locked || false,
    }));
    setPalette((prev) =>
      shades.map((c, i) => (prev[i]?.locked ? prev[i] : c))
    );
  };

  const regenerate = () => {
    setPalette((prev) =>
      prev.map((c) => (c.locked ? c : { ...c, hex: randomHex() }))
    );
  };

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

  const toggleLock = (index: number) => {
    setPalette((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  // --- Smooth Toast-based Copy (no browser alert) ---
  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex);

    // Create toast
    const toast = document.createElement("div");
    toast.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
        <span style="width:16px;height:16px;border-radius:4px;background:${hex};display:inline-block"></span>
        <span>Copied ${hex.toUpperCase()}!</span>
      </div>`;
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "8px 16px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.zIndex = "9999";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => (toast.style.opacity = "1"));

    // Fade out
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 1500);
  };

  // --- Export / Download / Share ---
  const exportPalette = async (type: "json" | "png") => {
    if (type === "json") {
      const blob = new Blob([JSON.stringify(palette, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "palette.json";
      link.click();
    } else if (type === "png") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const sw = 120,
        sh = 120;
      canvas.width = palette.length * sw;
      canvas.height = sh;
      palette.forEach((c, i) => {
        ctx.fillStyle = c.hex;
        ctx.fillRect(i * sw, 0, sw, sh);
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "palette.png";
      link.click();
    }
  };

  const sharePalette = async () => {
    const hexes = palette.map((p) => p.hex).join(",");
    const url = `${window.location.origin}/tools/color-palette-generator?colors=${encodeURIComponent(
      hexes
    )}`;

    if (navigator.share) {
      await navigator.share({
        title: "My Color Palette",
        text: "Check out my color palette!",
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      const toast = document.createElement("div");
      toast.textContent = "Link copied to clipboard!";
      toast.style.position = "fixed";
      toast.style.bottom = "24px";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.background = "#333";
      toast.style.color = "#fff";
      toast.style.padding = "8px 16px";
      toast.style.borderRadius = "8px";
      toast.style.fontSize = "14px";
      toast.style.zIndex = "9999";
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      document.body.appendChild(toast);
      requestAnimationFrame(() => (toast.style.opacity = "1"));
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
      }, 1500);
    }
  };

  // --- Auto-load shared palettes via ?colors= ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const colorsParam = params.get("colors");
    if (colorsParam) {
      const colors = colorsParam.split(",").map((hex) => ({
        hex,
        locked: false,
      }));
      setPalette(colors);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
        🎨 Color Palette Generator
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Generate palettes and shades from a base color or random selection.
        Click any swatch to copy the hex code. Lock colors to keep them during
        regeneration.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <input
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="w-24 h-10 rounded-md cursor-pointer border border-gray-300"
        />
        <button
          onClick={generateFromBase}
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

        {/* Export / Share */}
        <button
          onClick={() => exportPalette("json")}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          Export JSON
        </button>
        <button
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

      {/* Palette */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {palette.map((c, i) => (
          <div
            key={i}
            className="rounded-xl shadow-sm cursor-pointer transition transform hover:scale-105"
            style={{ backgroundColor: c.hex }}
            onClick={() => copyHex(c.hex)}
          >
            <div className="p-2 bg-white/90 rounded-b-xl text-center text-sm">
              <div className="font-mono">{c.hex.toUpperCase()}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(i);
                }}
                className="mt-1 text-xs text-gray-500"
              >
                {c.locked ? "🔒" : "🔓"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-500 text-sm">
        Tip: You can mix locked and random colors for unique combinations.
      </p>
    </div>
  );
}

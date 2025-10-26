"use client";

import React, { useState } from "react";

type Color = { hex: string; locked: boolean };

function randomHex(): string {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

export default function ColorPaletteGenerator() {
  const [palette, setPalette] = useState<Color[]>([
    { hex: "#3B82F6", locked: false },
    { hex: "#10B981", locked: false },
    { hex: "#F59E0B", locked: false },
    { hex: "#EF4444", locked: false },
    { hex: "#8B5CF6", locked: false },
  ]);
  const [baseColor, setBaseColor] = useState("#3B82F6");
  const [copied, setCopied] = useState<string | null>(null);

  const regenerate = () => {
    setPalette((prev) =>
      prev.map((c) =>
        c.locked ? c : { hex: randomHex(), locked: false }
      )
    );
  };

  const toggleLock = (index: number) => {
    setPalette((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  const copyColor = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1200);
  };

  const generateFromBase = () => {
    const base = baseColor.replace("#", "");
    const baseNum = parseInt(base, 16);
    const newPalette = Array.from({ length: 5 }).map((_, i) => {
      const offset = (i - 2) * 0x202020;
      const newColor = Math.max(0, Math.min(0xffffff, baseNum + offset));
      return {
        hex: "#" + newColor.toString(16).padStart(6, "0"),
        locked: false,
      };
    });
    setPalette(newPalette);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Color Palette Generator</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Generate palettes and shades from a base color or random selection.
        Click any swatch to copy the hex code. Lock colors to keep them during regeneration.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="w-full sm:w-32 h-10 rounded-md cursor-pointer"
        />
        <button
          onClick={generateFromBase}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Generate from Base
        </button>
        <button
          onClick={regenerate}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Randomize Palette
        </button>
      </div>

      {/* Palette Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {palette.map((c, i) => (
          <div
            key={i}
            className="relative rounded-lg overflow-hidden shadow-sm transition-transform hover:scale-[1.03]"
          >
            <div
              className="h-28 cursor-pointer transition-all"
              style={{ backgroundColor: c.hex }}
              onClick={() => copyColor(c.hex)}
            />
            <div className="flex justify-between items-center px-2 py-1 bg-white dark:bg-neutral-800 text-xs font-medium">
              <span
                className={`cursor-pointer select-none ${
                  copied === c.hex ? "text-green-500" : "text-gray-700 dark:text-gray-200"
                }`}
                onClick={() => copyColor(c.hex)}
              >
                {copied === c.hex ? "Copied!" : c.hex.toUpperCase()}
              </span>
              <button
                onClick={() => toggleLock(i)}
                title={c.locked ? "Unlock" : "Lock"}
                className={`text-sm ${
                  c.locked ? "text-yellow-500" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {c.locked ? "🔒" : "🔓"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
        Tip: You can mix locked and random colors for unique combinations.
      </div>
    </div>
  );
}

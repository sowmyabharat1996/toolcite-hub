"use client";

import ToolCard from "@/components/ToolCard";
import { FaCloudSun, FaBolt, FaRuler, FaBrain, FaCompress } from "react-icons/fa";

export default function HomePage() {
  const tools = [
    {
      title: "Weather App",
      description: "Live forecasts with offline fallback and responsive design.",
      emoji: <FaCloudSun className="text-yellow-400" />,
      href: "/weather",
      soon: false,
    },
    {
      title: "Speed Test (Coming Soon)",
      description: "Measure your internet speed instantly in the browser.",
      emoji: <FaBolt className="text-orange-400" />,
      href: "#",
      soon: true,
    },
    {
      title: "Unit Converter (Coming Soon)",
      description: "Convert units for length, weight, temperature, and more.",
      emoji: <FaRuler className="text-purple-400" />,
      href: "#",
      soon: true,
    },
    {
      title: "AI Text Summarizer (Coming Soon)",
      description: "Summarize long text or notes in seconds.",
      emoji: <FaBrain className="text-pink-400" />,
      href: "#",
      soon: true,
    },
    {
      title: "Image Compressor (Coming Soon)",
      description: "Shrink images while keeping quality intact.",
      emoji: <FaCompress className="text-indigo-400" />,
      href: "#",
      soon: true,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0b0b0b] to-[#121212] text-gray-200 py-16 px-6">
      <section className="max-w-5xl mx-auto text-center mb-14">
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          ToolCite Hub
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-400 leading-relaxed">
          ToolCite Hub is a fast, free collection of smart web tools — no sign-ups, no clutter.{" "}
          <br className="hidden sm:block" />
          Just quick, reliable utilities that work on every device. We’re growing toward{" "}
          <span className="text-blue-400 font-semibold">100+ tools</span>{" "}
          designed for speed, simplicity, and everyday usefulness.
        </p>
      </section>

      {/* === GRID OF TOOLS === */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {tools.map((tool) => (
          <ToolCard
            key={tool.title}
            label={tool.title}
            description={tool.description}
            icon={tool.emoji}
            disabled={tool.soon}
            href={tool.href}
          />
        ))}
      </section>

      {/* === FOOTER === */}
      <footer className="text-center text-gray-500 text-sm mt-20 border-t border-neutral-800 pt-6">
        <p>
          © {new Date().getFullYear()} ToolCite Hub. All rights reserved. •{" "}
          <a href="/terms" className="hover:text-blue-400 transition-colors">
            Terms
          </a>{" "}
          •{" "}
          <a href="/privacy" className="hover:text-blue-400 transition-colors">
            Privacy
          </a>
        </p>
      </footer>
    </main>
  );
}

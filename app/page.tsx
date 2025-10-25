"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ToolCard from "@/components/ToolCard";
import { useSmartNav } from "@/components/useSmartNav";

export default function HomePage() {
  const { smartHref, onSmartNav } = useSmartNav();
  const [query, setQuery] = useState("");

  const tools = [
    {
      title: "Weather App",
      description: "Live forecasts with offline fallback and responsive design.",
      emoji: "🌤️",
      href: "/weather",
    },
    {
      title: "Speed Test",
      description: "Measure your internet speed instantly in the browser.",
      emoji: "⚡",
      soon: true,
    },
    {
      title: "Unit Converter",
      description: "Convert units for length, weight, temperature, and more.",
      emoji: "📏",
      soon: true,
    },
    {
      title: "AI Text Summarizer",
      description: "Summarize long text or notes in seconds.",
      emoji: "🧠",
      soon: true,
    },
    {
      title: "Image Compressor",
      description: "Shrink images while keeping quality intact.",
      emoji: "🗜️",
      soon: true,
    },
  ];

  const filteredTools = tools.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main>
      <section className="mx-auto max-w-2xl px-4 pt-10 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-500">
          ToolCite Hub
        </h1>
        <p className="mt-3 text-gray-400 leading-relaxed">
          ToolCite Hub is a fast, free collection of smart web tools — no sign-ups,
          no clutter. Just quick, reliable utilities that work on every device.
          We’re growing toward{" "}
          <span className="font-semibold text-blue-400">100+ tools</span> designed
          for speed, simplicity, and everyday usefulness.
        </p>

        <input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-6 w-full max-w-md mx-auto p-3 rounded-xl bg-neutral-900/70 text-white placeholder-gray-500 outline-none border border-neutral-700 focus:border-blue-500"
        />
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-20 grid gap-4 sm:grid-cols-2">
        {filteredTools.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <ToolCard
              title={tool.title}
              description={tool.description}
              emoji={tool.emoji}
              disabled={tool.soon}
              href={tool.href ? smartHref(tool.href) : undefined}
              onClick={
                tool.href ? () => onSmartNav(tool.href!) : undefined
              }
            />
          </motion.div>
        ))}
      </section>

      <footer className="pb-10 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} ToolCite
      </footer>
    </main>
  );
}

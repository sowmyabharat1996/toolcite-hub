// app/page.tsx
"use client";

import ToolCard from "@/components/ToolCard";
import { useSmartNav } from "@/components/useSmartNav";

type Tool = {
  title: string;
  description: string;
  emoji: string;
  href?: string; // optional if not yet live
  soon?: boolean;
};

export default function HomePage() {
  const { smartHref, onSmartNav } = useSmartNav();

  const tools: Tool[] = [
    {
      title: "Weather App",
      description: "Live forecasts with offline fallback and responsive design.",
      emoji: "🌤️",
      href: "/weather", // redirect handled by vercel.json
    },
    {
      title: "Speed Test (Coming Soon)",
      description: "Measure your internet speed instantly in the browser.",
      emoji: "⚡",
      soon: true, // ✅ not live yet
    },
    {
      title: "Unit Converter (Coming Soon)",
      description: "Convert units for length, weight, temperature, and more.",
      emoji: "📏",
      soon: true,
    },
    {
      title: "AI Text Summarizer (Coming Soon)",
      description: "Summarize long text or notes in seconds.",
      emoji: "🧠",
      soon: true,
    },
    {
      title: "Image Compressor (Coming Soon)",
      description: "Shrink images while keeping quality intact.",
      emoji: "🗜️",
      soon: true,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-neutral-950 dark:to-neutral-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="mx-auto max-w-2xl px-4 pt-12 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 dark:text-blue-400">
          ToolCite Hub
        </h1>
        <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          ToolCite Hub is a fast, free collection of smart web tools — no sign-ups,
          no clutter. Just quick, reliable utilities that work on every device.
          We’re growing toward{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            100+ tools
          </span>{" "}
          designed for speed, simplicity, and everyday usefulness.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="mx-auto max-w-2xl px-4 pb-20 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) =>
          tool.soon ? (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              emoji={tool.emoji}
              disabled // ✅ disables click
            />
          ) : (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              emoji={tool.emoji}
              href={smartHref(tool.href!)}
              onClick={() => onSmartNav(tool.href!)}
            />
          )
        )}
      </section>

      {/* Footer */}
      <footer className="pb-10 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} ToolCite
      </footer>
    </main>
  );
}

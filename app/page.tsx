// app/page.tsx
"use client";

import ToolCard from "@/components/ToolCard";
import { useSmartNav } from "@/components/useSmartNav";

export default function HomePage() {
  const { smartHref, onSmartNav } = useSmartNav();

  const tools = [
    {
      title: "Weather App",
      description:
        "Live forecasts with offline fallback and responsive design.",
      emoji: "🌤️",
      href: "/tools/weather", // ✅ canonical path — no redirect bug
    },
    {
      title: "Speed Test (Coming Soon)",
      description: "Measure your internet speed instantly in the browser.",
      emoji: "⚡",
      soon: true,
    },
    {
      title: "Unit Converter (Planned)",
      description: "Convert units for length, weight, temperature, and more.",
      emoji: "📏",
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
          ToolCite Hub is a fast, free collection of smart web tools. No sign-ups,
          no clutter — just quick, useful utilities that work on every device.
          We’re steadily growing toward{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            100+ tools
          </span>{" "}
          designed for speed, simplicity, and everyday usefulness.
        </p>
      </section>

      {/* Tool Cards */}
      <section className="mx-auto max-w-2xl px-4 pb-20 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) =>
          tool.soon ? (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              emoji={tool.emoji}
              disabled
            />
          ) : (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              emoji={tool.emoji}
              href={smartHref(tool.href)}
              onClick={() => onSmartNav(tool.href)}
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

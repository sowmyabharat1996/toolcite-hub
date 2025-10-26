"use client";

import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import { useSmartNav } from "@/components/useSmartNav";
import { TOOLS } from "@/lib/tools";

export default function HomePage() {
  const { smartHref, onSmartNav } = useSmartNav();

  // Groups in the order you want to show them
  const groups = [
    { title: "AI Productivity & Content", key: "AI Productivity & Content" as const },
    { title: "Document & File Utilities", key: "Document & File" as const },
    { title: "Developer & SEO Tools", key: "Developer & SEO" as const },
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
          <span className="font-semibold text-blue-600 dark:text-blue-400">100+ tools</span>{" "}
          designed for speed, simplicity, and everyday usefulness.
        </p>
      </section>

      {/* Tools by Category */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 space-y-10">
        {groups.map((g) => {
          const items = TOOLS.filter((t) => t.category === g.key);

          if (items.length === 0) return null;

          return (
            <div key={g.key}>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
                {g.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => {
                  const href = `/tools/${t.slug}`;
                  const comingSoon = t.status !== "live";

                  return comingSoon ? (
                    <ToolCard
                      key={t.slug}
                      title={`${t.name} (Coming Soon)`}
                      description={t.description}
                      emoji={t.icon ?? "🔧"}
                      disabled
                    />
                  ) : (
                    <ToolCard
                      key={t.slug}
                      title={t.name}
                      description={t.description}
                      emoji={t.icon ?? "🔧"}
                      href={smartHref(href)}
                      onClick={() => onSmartNav(href)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Optional: expose Weather if it's NOT in the TOOLS registry */}
        {/* Remove this block if you added "weather" into TOOLS. */}
        <div className="hidden">
          <Link href="/weather" aria-label="Weather App" />
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-10 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} ToolCite
      </footer>
    </main>
  );
}

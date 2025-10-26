// app/page.tsx
"use client";

import Link from "next/link";
import { TOOLS } from "@/lib/tools";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Card({
  title,
  desc,
  emoji,
  href,
  soon,
}: {
  title: string;
  desc: string;
  emoji?: string;
  href?: string;
  soon?: boolean;
}) {
  const classBase =
    "rounded-2xl border p-4 bg-white/70 dark:bg-neutral-900 transition shadow-sm";
  const disabled = "opacity-60 pointer-events-none";
  const inner = (
    <div className="flex gap-3">
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 text-xl">
        {emoji ?? "🧰"}
      </div>
      <div>
        <div className="font-semibold">
          {title} {soon && <span className="font-normal text-gray-500">(Coming Soon)</span>}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{desc}</div>
      </div>
    </div>
  );

  if (href && !soon) {
    return (
      <Link href={href} className={`${classBase} hover:shadow-md hover:border-blue-300`}>
        {inner}
      </Link>
    );
  }
  return <div className={`${classBase} ${soon ? disabled : ""}`}>{inner}</div>;
}

export default function HomePage() {
  const categories = [
    "AI Productivity & Content",
    "Document & File",
    "Developer & SEO",
  ] as const;

  // Helper: sort live → coming-soon, then by name
  const sortLiveFirst = (a: (typeof TOOLS)[number], b: (typeof TOOLS)[number]) => {
    const al = a.status === "live" ? 0 : 1;
    const bl = b.status === "live" ? 0 : 1;
    if (al !== bl) return al - bl;
    return a.name.localeCompare(b.name);
  };

  const toolsByCat = Object.fromEntries(
    categories.map((c) => [
      c,
      TOOLS.filter((t) => t.category === c).sort(sortLiveFirst),
    ])
  ) as Record<(typeof categories)[number], typeof TOOLS>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-neutral-950 dark:to-neutral-900 transition-colors duration-300">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-12 pb-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 dark:text-blue-400">
          ToolCite Hub
        </h1>
        <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          A fast, free collection of smart web tools — no sign-ups, no clutter.
          We’re growing toward{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">100+ tools</span>{" "}
          designed for speed, simplicity, and everyday usefulness.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        <Section title="AI Productivity & Content">
          {toolsByCat["AI Productivity & Content"].map((t) => (
            <Card
              key={t.slug}
              title={t.name}
              desc={t.description}
              emoji={t.icon}
              soon={t.status !== "live"}
              href={`/tools/${t.slug}`}
            />
          ))}
        </Section>

        <Section title="Document & File Utilities">
          {toolsByCat["Document & File"].map((t) => (
            <Card
              key={t.slug}
              title={t.name}
              desc={t.description}
              emoji={t.icon}
              soon={t.status !== "live"}
              href={`/tools/${t.slug}`}
            />
          ))}
        </Section>

        <Section title="Developer & SEO Tools">
          {toolsByCat["Developer & SEO"].map((t) => (
            <Card
              key={t.slug}
              title={t.name}
              desc={t.description}
              emoji={t.icon}
              soon={t.status !== "live"}
              href={`/tools/${t.slug}`}
            />
          ))}
        </Section>

        <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12">
          © {new Date().getFullYear()} ToolCite
        </footer>
      </div>
    </main>
  );
}

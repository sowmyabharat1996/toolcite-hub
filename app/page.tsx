// app/page.tsx
import ToolCard from "@/components/ToolCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
      <section className="mx-auto max-w-xl px-4 pt-10 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700">ToolCite Hub</h1>
        <p className="mt-3 text-gray-700">
          ToolCite Hub is a fast, free collection of smart web tools. No sign-ups,
          no clutter—just quick, useful utilities that work on every device. We’re
          steadily growing toward 100+ tools designed for speed, simplicity and everyday
          usefulness.
        </p>
      </section>

      <section className="mx-auto max-w-xl px-4 pb-16 grid gap-4">
        {/* LIVE tool → server redirect; use redirect to force full navigation */}
        <ToolCard
          href="/weather"
          label="Weather App"
          icon={<span aria-hidden>🌤️</span>}
          redirect
        />

        {/* Coming soon examples (visible but disabled) */}
        <ToolCard
          label="Speed Test (Coming Soon)"
          icon={<span aria-hidden>⚡</span>}
          disabled
        />

        <ToolCard
          label="Unit Converter (Planned)"
          icon={<span aria-hidden>📏</span>}
          disabled
        />
      </section>

      <footer className="pb-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ToolCite
      </footer>
    </main>
  );
}

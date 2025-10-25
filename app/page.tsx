import ToolCard from "@/components/ToolCard";
import { FaCloudSun, FaBolt, FaRuler, FaBrain, FaCompress } from "react-icons/fa";

export default function HomePage() {
  const tools = [
    {
      title: "Weather App",
      description: "Live forecasts with offline fallback and responsive design.",
      icon: <FaCloudSun className="text-yellow-400 text-xl" />,
      href: "/weather",
    },
    {
      title: "Speed Test (Coming Soon)",
      description: "Measure your internet speed instantly in the browser.",
      icon: <FaBolt className="text-orange-400 text-xl" />,
      soon: true,
    },
    {
      title: "Unit Converter (Coming Soon)",
      description: "Convert units for length, weight, temperature, and more.",
      icon: <FaRuler className="text-green-400 text-xl" />,
      soon: true,
    },
    {
      title: "AI Text Summarizer (Coming Soon)",
      description: "Summarize long text or notes in seconds.",
      icon: <FaBrain className="text-pink-400 text-xl" />,
      soon: true,
    },
    {
      title: "Image Compressor (Coming Soon)",
      description: "Shrink images while keeping quality intact.",
      icon: <FaCompress className="text-blue-400 text-xl" />,
      soon: true,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-100 to-sky-200 dark:from-[#0d0d0d] dark:to-[#1a1a1a] transition-colors duration-700">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 dark:text-blue-400">
          ToolCite Hub
        </h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
          ToolCite Hub is a fast, free collection of smart web tools — no sign-ups, no clutter.
          Just reliable utilities that work everywhere. We’re growing toward{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">100+ tools</span> built
          for speed, simplicity, and everyday usefulness.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 grid sm:grid-cols-2 gap-5">
        {tools.map((tool) => (
          <ToolCard
            key={tool.title}
            href={tool.href}
            label={tool.title}
            description={tool.description}
            icon={tool.icon}
            disabled={tool.soon}
          />
        ))}
      </section>
    </main>
  );
}

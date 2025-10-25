import ToolCard from "@/components/ToolCard";
import { FaCloudSun, FaBolt, FaRuler, FaBrain, FaCompress } from "react-icons/fa";

export default function HomePage() {
  const tools = [
    {
      title: "Weather App",
      description: "Live forecasts with offline fallback and responsive design.",
      icon: <FaCloudSun className="text-yellow-400 text-xl" />,
      href: "/weather",
      soon: false,
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
      icon: <FaRuler className="text-purple-400 text-xl" />,
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
      icon: <FaCompress className="text-indigo-400 text-xl" />,
      soon: true,
    },
  ];

  return (
    <main>
      {/* Hero container centered like the screenshot */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">
          ToolCite Hub
        </h1>

        <p className="mt-6 text-gray-400 max-w-3xl mx-auto leading-relaxed">
          ToolCite Hub is a fast, free collection of smart web tools — no sign-ups, no clutter.
          Just quick, reliable utilities that work on every device. We’re growing toward{" "}
          <span className="text-blue-400 font-semibold">100+ tools</span> designed for speed,
          simplicity, and everyday usefulness.
        </p>
      </section>

      {/* Card grid centered, 2 columns on md, like your screenshot */}
      <section className="max-w-6xl mx-auto px-6 pb-4 grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard
            key={tool.title}
            title={tool.title}          // ToolCard now accepts title or label
            description={tool.description}
            icon={tool.icon}            // and icon or emoji
            href={tool.href}
            disabled={tool.soon}
          />
        ))}
      </section>
    </main>
  );
}

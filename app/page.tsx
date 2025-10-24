import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-8 text-center">
      <h1 className="text-5xl font-bold text-blue-700 mb-4">⚙️ ToolCite Hub</h1>

      {/* 🧾 NEW: Short About/Intro for AdSense & SEO */}
      <div className="max-w-2xl text-gray-700 leading-relaxed mb-10">
        <p className="mb-3">
          ToolCite Hub is a fast, free, and lightweight collection of intelligent web tools 
  built for everyday tasks — no sign-ups, clutter, or downloads. Each tool is designed 
  to do one job exceptionally well and load instantly on both desktop and mobile. 
  From weather forecasts to productivity utilities, ToolCite Hub is steadily growing 
  toward 100+ smart, browser-based tools made for simplicity, speed, and everyday usefulness.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Link
          href="/weather"
          className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition"
        >
          🌤️ <span className="font-semibold">Weather App</span>
        </Link>

        <div className="p-6 bg-white rounded-2xl shadow-md opacity-90">
          ⚡ <span className="font-semibold">Speed Test (Coming Soon)</span>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-md opacity-90">
          🔁 <span className="font-semibold">Unit Converter (Planned)</span>
        </div>
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        © {new Date().getFullYear()} ToolCite. Built by Bharat 💡
      </footer>
    </main>
  );
}

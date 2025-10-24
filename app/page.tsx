import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-8 text-center">
      <h1 className="text-5xl font-bold text-blue-700 mb-6">
        ⚙️ ToolCite Hub
      </h1>
      <p className="text-gray-700 max-w-xl mb-10">
        A growing collection of smart, free web tools — built with love 💙
      </p>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Link href="/weather" className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition">
          🌤️ <span className="font-semibold">Weather App</span>
        </Link>
        <Link href="/speed" className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition">
          ⚡ <span className="font-semibold">Speed Test (Coming Soon)</span>
        </Link>
        <Link href="/converter" className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition">
          🔁 <span className="font-semibold">Unit Converter (Planned)</span>
        </Link>
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        © {new Date().getFullYear()} ToolCite. Built by Bharat 💡
      </footer>
    </main>
  );
}

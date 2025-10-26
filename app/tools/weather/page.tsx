export const metadata = {
  title: "Weather App – Live Forecasts",
  description: "Live forecasts with offline fallback and responsive design.",
};

export default function WeatherEmbed() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold">🌤️ Weather App</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Real-time forecasts with a clean, responsive interface.
      </p>

      <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border">
        <iframe
          src="https://weather-app-2-0-six.vercel.app/"
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer"
          title="Weather App"
        />
      </div>
    </main>
  );
}

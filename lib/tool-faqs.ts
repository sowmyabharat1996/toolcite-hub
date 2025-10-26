// lib/tool-faqs.ts
export const TOOL_FAQS: Record<string, { q: string; a: string }[]> = {
  weather: [
    { q: "Is the Weather App free?", a: "Yes — no sign-up required." },
    { q: "Does it work on mobile?", a: "Yes, it’s fully responsive and supports offline fallback." },
  ],
  
"image-compressor": [
  { q: "Is image compression free?", a: "Yes. All processing happens in your browser." },
  { q: "Which format is smallest?", a: "WEBP usually yields the smallest file at similar quality." },
  { q: "Does this upload my images?", a: "No — it runs locally in your browser for privacy." },
],

"regex-tester": [
  { q: "What do regex flags mean?", a: "i = ignore case, g = global (find all), m = multiline, s = dotAll, u = unicode, y = sticky." },
  { q: "Why no matches?", a: "Check your pattern, flags, and whether you need the global flag (g) to find all matches." },
  { q: "Does this run locally?", a: "Yes, all regex testing happens in your browser." },
],

  "qr-code-generator": [
    { q: "Are QR codes free to generate?", a: "Yes, and you can download PNG, JPG, WEBP, or SVG." },
    { q: "Can I change colors?", a: "Yes — pick foreground and background colors, and set margin/size." },
  ],
  // Add FAQs for other tools as they go live
};

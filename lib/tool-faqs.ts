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
    { q: "Is the regex tester free to use?", a: "Yes, 100% free and runs locally in your browser." },
    { q: "Does it support Unicode classes like \\p{L}?", a: "Yes. Turn on the 'u' flag to enable Unicode properties such as \\p{L}, \\p{N}, etc." },
    { q: "What do the flags i g m s u y do?", a: "i: ignore case, g: global, m: multiline anchors, s: dot matches newline, u: Unicode, y: sticky." },
    { q: "Is my text uploaded to a server?", a: "No. All matching happens client-side for privacy." },
    { q: "Why is my large input slow?", a: "Very large text can be heavy. The app debounces evaluation and softly warns above ~200k characters." },
  ],

"meta-og-generator": [
    { q: "What are Open Graph tags?", a: "OG tags help social platforms like Facebook, LinkedIn, and Slack render rich previews with title, description, and image." },
    { q: "Do I need Twitter-specific tags?", a: "Twitter reads OG tags, but adding Twitter Card tags ensures consistent previews across devices and card types." },
    { q: "Where do I paste these tags?", a: "Place the generated <meta> tags inside the <head> of your HTML page." },
    { q: "Can I test previews?", a: "Yes—use this tool’s live previews and external debuggers like Facebook Sharing Debugger and Twitter Card Validator." },
    { q: "Is my data stored?", a: "No. Everything runs locally in your browser." },
  ],

  "qr-code-generator": [
    { q: "Are QR codes free to generate?", a: "Yes, and you can download PNG, JPG, WEBP, or SVG." },
    { q: "Can I change colors?", a: "Yes — pick foreground and background colors, and set margin/size." },
  ],
  // Add FAQs for other tools as they go live
};

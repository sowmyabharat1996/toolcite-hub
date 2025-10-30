// components/AdSenseClient.tsx
"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function AdSenseClient() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // allow ?noads=1 for Lighthouse / your own testing
    const hasNoAds =
      typeof window !== "undefined" &&
      window.location.search.includes("noads=1");
    if (!hasNoAds) setShouldLoad(true);
  }, []);

  if (!shouldLoad) return null;

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4622190640183245"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

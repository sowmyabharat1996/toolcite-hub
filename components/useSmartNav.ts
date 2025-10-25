// components/useSmartNav.ts
"use client";

import { useRouter } from "next/navigation";

const redirectLikePaths = new Set(["/weather", "/speed"]);

export function useSmartNav() {
  const router = useRouter();

  function isRedirectLike(href: string) {
    try {
      const url = new URL(
        href,
        typeof window !== "undefined" ? window.location.origin : "https://x"
      );
      return redirectLikePaths.has(url.pathname);
    } catch {
      return redirectLikePaths.has(href);
    }
  }

  function smartHref(href: string) {
    return href;
  }

  function onSmartNav(href: string) {
    if (isRedirectLike(href)) {
      window.location.assign(href);
      return;
    }
    router.push(href, { scroll: true });
  }

  return { smartHref, onSmartNav };
}

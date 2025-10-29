"use client";

import { useEffect } from "react";

type InitialParams = Record<string, string | string[] | undefined>;

/** Set value on controlled input/select and dispatch events so React/store picks it up */
function setReactInputValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = (el as any).constructor.prototype;
  const desc =
    Object.getOwnPropertyDescriptor(proto, "value") ||
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  desc?.set?.call(el, value);
  const type = el.tagName === "SELECT" ? "change" : "input";
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

function getParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function setParams(sp: URLSearchParams) {
  const qs = sp.toString();
  const newUrl = window.location.pathname + (qs ? `?${qs}` : "");
  window.history.replaceState(null, "", newUrl);
}

export default function UrlDecodeOnce({ initial }: { initial?: InitialParams }) {
  useEffect(() => {
    const sp = getParams();
    const read = (key: string) => {
      const v = (initial?.[key] as string) ?? sp.get(key);
      return v === "" ? null : v;
    };

    const applyIf = (id: string, val: string | null | undefined) => {
      if (!val) return;
      const el = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (el) setReactInputValue(el, String(val));
    };

    // q / vol / cpc / sort
    applyIf("search-input", read("q"));
    applyIf("volume", read("vol"));
    applyIf("cpc", read("cpc"));
    applyIf("sort-mode", read("sort"));

    // df = "min-max"
    const df = read("df");
    if (df) {
      const [min, max] = df.split("-").map((n) => parseInt(n, 10));
      const minEl = document.getElementById("difficulty-min") as HTMLInputElement | null;
      const maxEl = document.getElementById("difficulty-max") as HTMLInputElement | null;
      if (minEl && Number.isFinite(min)) setReactInputValue(minEl, String(min));
      if (maxEl && Number.isFinite(max)) setReactInputValue(maxEl, String(max));
    }

    // Seed (stable for shareability)
    let seed = read("seed");
    if (!seed) {
      seed = Math.random().toString(36).slice(2, 8);
      sp.set("seed", seed);
      setParams(sp);
    }

    // Optional theme param ("dark"|"light")
    const theme = read("theme");
    if (theme === "dark" || theme === "light") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [initial]);

  return null;
}

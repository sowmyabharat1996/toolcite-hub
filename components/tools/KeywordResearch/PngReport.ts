// components/tools/KeywordResearch/PngReport.ts
"use client";

import html2canvas from "html2canvas";

export interface PngExportOptions {
  filename?: string;
  scale?: number;   // devicePixelRatio cap (e.g. 2)
  quality?: number; // kept for API parity (PNG ignores quality)
  bg?: string;      // background color while rendering
}

// Overloads so both styles compile
export function exportDashboardToPNG(root: HTMLElement): Promise<void>;
export function exportDashboardToPNG(
  root: HTMLElement,
  filename: string,
  scale?: number,
  quality?: number,
  bg?: string
): Promise<void>;
export function exportDashboardToPNG(
  root: HTMLElement,
  opts: PngExportOptions
): Promise<void>;

export async function exportDashboardToPNG(
  root: HTMLElement,
  arg2?: string | PngExportOptions,
  arg3?: number,
  arg4?: number,
  arg5?: string
): Promise<void> {
  // normalize to options object
  let opts: PngExportOptions;
  if (typeof arg2 === "string") {
    opts = { filename: arg2, scale: arg3, quality: arg4, bg: arg5 };
  } else {
    opts = arg2 ?? {};
  }

  const filename = opts.filename ?? "keyword-dashboard.png";
  const dpr =
    typeof window !== "undefined" && window.devicePixelRatio
      ? window.devicePixelRatio
      : 1;
  const scale = Math.max(1, Math.min(opts.scale ?? dpr, 2));
  const backgroundColor = opts.bg ?? "#ffffff";

  // pause any CSS animations you've gated with this flag
  root.setAttribute("data-export-paused", "1");

  try {
    const canvas = await html2canvas(
      root,
      {
        backgroundColor,
        scale,
        useCORS: true,
        logging: false,
        // keep layout correct for tall pages
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      } as any // <-- keeps TS happy across html2canvas versions
    );

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    root.removeAttribute("data-export-paused");
  }
}

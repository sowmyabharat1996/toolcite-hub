// components/tools/KeywordResearch/PngReport.ts
// Lightweight PNG export with dynamic import of html-to-image (client-only).
// Adds a simple brand header & footer onto the captured PNG.

export async function exportDashboardToPNG(
  node: HTMLElement,
  filename: string = "keyword-dashboard.png",
  brand: { title?: string; subtitle?: string; watermark?: string } = {}
) {
  if (typeof window === "undefined") return;

  // Lazy-load only on the client
  const { toPng } = await import("html-to-image");

  // Pause sticky/overflow tricks during export (you already have CSS for this)
  const prev = node.closest("body")?.getAttribute("data-export-paused");
  document.body.setAttribute("data-export-paused", "1");

  try {
    // Capture PNG of the dashboard root
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: Math.min(2, window.devicePixelRatio || 1.5),
      // Filter out any elements you explicitly mark to skip
      filter: (el) => {
        // Skip elements tagged for skipping, e.g., tooltips/portals
        const anyEl = el as HTMLElement;
        if (anyEl?.dataset?.export === "skip") return false;
        return true;
      },
    });

    // Post-process: draw onto a canvas and add header/footer branding
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const headerH = 64; // px
    const footerH = 40; // px
    const w = img.naturalWidth;
    const h = img.naturalHeight + headerH + footerH;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = "#0f172a"; // slate-900 text
    ctx.font = "600 20px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const title = brand.title || "ToolCite – Keyword Research (AI Dashboard)";
    ctx.fillText(title, 24, 40);

    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "400 14px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const subtitle =
      brand.subtitle ||
      `Exported ${new Date().toLocaleString()}  •  For internal SEO review`;
    ctx.fillText(subtitle, 24, 60);

    // Body (captured dashboard)
    ctx.drawImage(img, 0, headerH);

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "400 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const wm = brand.watermark || "© ToolCite Hub  •  Smart • Fast • Reliable";
    ctx.fillText(wm, 24, h - 14);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  } finally {
    // restore flag
    if (prev == null) document.body.removeAttribute("data-export-paused");
    else document.body.setAttribute("data-export-paused", prev);
  }
}

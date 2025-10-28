// components/tools/KeywordResearch/PdfReport.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/** Optional cover set */
export type CoverSpec =
  | boolean
  | {
      title?: string;
      subtitle?: string;
      bullets?: string[];
      watermark?: string;
    };

export interface PdfExportOptions {
  filename: string;
  brand?: string;
  cover?: CoverSpec;              // true for default cover
  autoLandscape?: boolean;        // auto pick L/P by aspect
  margin?: number;                // pt; default 36
}

type TocEntry = { title: string; page: number };

function pxToPt(px: number) {
  // jsPDF default is 72 dpi (pt)
  const PT_PER_PX = 72 / 96;
  return px * PT_PER_PX;
}

async function makeQrDataURL(text: string, size = 128): Promise<string> {
  try {
    const { toCanvas } = await import("qrcode");
    const c = document.createElement("canvas");
    await toCanvas(c, text, {
      errorCorrectionLevel: "M", width: size, margin: 1,
    } as any);
    return c.toDataURL("image/png");
  } catch {
    // Fallback tiny placeholder
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff"; g.fillRect(0,0,size,size);
    g.fillStyle = "#000"; g.fillRect(0,0,size, size/8);
    return c.toDataURL("image/png");
  }
}

function drawFooter(pdf: jsPDF, pageW: number, pageH: number, brand?: string, pageNum?: number, total?: number, qr?: string) {
  const m = 24;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  const left = brand ? `© ${brand}` : "";
  if (left) pdf.text(left, m, pageH - m + 8);

  if (pageNum && total) {
    pdf.text(`Page ${pageNum} / ${total}`, pageW - m, pageH - m + 8, { align: "right" as const });
  }

  if (qr) {
    const size = 36; // pt
    pdf.addImage(qr, "PNG", m - 8, pageH - m - size + 8, size, size);
  }
}

function drawWatermark(pdf: jsPDF, pageW: number, pageH: number, text: string) {
  pdf.saveGraphicsState();
  pdf.setTextColor(225);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(48);
  // jsPDF supports angle in options
  pdf.text(text, pageW / 2, pageH / 2, { align: "center" as const, angle: -30 });
  pdf.restoreGraphicsState();
}

function addCover(pdf: jsPDF, pageW: number, pageH: number, spec: CoverSpec | undefined, brand?: string, stats?: string[], toc?: TocEntry[]) {
  if (!spec) return;

  const cfg = typeof spec === "boolean" ? {} : spec;
  const title = cfg?.title ?? "Keyword Research — AI Dashboard";
  const subtitle = cfg?.subtitle ?? "";
  const bullets = cfg?.bullets ?? stats ?? [];
  const wm = cfg?.watermark ?? "CONFIDENTIAL • INTERNAL";

  const m = 48;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(20);
  pdf.text(title, m, m);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  if (subtitle) pdf.text(subtitle, m, m + 20);

  let y = m + 40;
  pdf.setFontSize(10);
  bullets.forEach((b) => {
    pdf.text(`• ${b}`, m, y);
    y += 14;
  });

  // ToC (if provided)
  if (toc && toc.length) {
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Contents", m, y);
    pdf.setFont("helvetica", "normal");
    y += 14;
    toc.forEach((t) => {
      pdf.text(`${t.title}`, m, y);
      pdf.text(String(t.page), pageW - m, y, { align: "right" as const });
      y += 12;
    });
  }

  // huge soft watermark
  drawWatermark(pdf, pageW, pageH, wm);

  // footer
  drawFooter(pdf, pageW, pageH, brand, 1, 1);
  pdf.addPage();
}

export async function exportDashboardToPDF(root: HTMLElement, options: PdfExportOptions) {
  const {
    filename,
    brand = "ToolCite Hub",
    cover = true,
    autoLandscape = true,
    margin = 36,
  } = options;

  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-export="section"]'));
  if (!sections.length) sections.push(root);

  // Decide orientation from first section if requested
  let orient: "p" | "l" = "p";
  if (autoLandscape && sections[0]) {
    const r = sections[0].getBoundingClientRect();
    orient = r.width > r.height * 1.15 ? "l" : "p";
  }

  const pdf = new jsPDF({ orientation: orient, unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // TOC collection (we'll rewrite page numbers after we add cover)
  const toc: TocEntry[] = [];

  // Stats for Cover (if you want – read from small cards)
  const stats: string[] = [];
  const mini = root.querySelectorAll<HTMLElement>('[data-stat]');
  mini.forEach((el) => stats.push(el.innerText.trim().replace(/\s+/g, " ")));

  // Pause transitions/positioning to avoid gaps
  root.setAttribute("data-export-paused", "1");

  // Create QR (share current URL)
  const shareUrl = (typeof window !== "undefined" && window.location?.href) || "";
  const qrData = shareUrl ? await makeQrDataURL(shareUrl, 256) : undefined;

  try {
    const scale = Math.max(1.5, Math.min(2, window.devicePixelRatio || 1.5));

    for (const section of sections) {
      const title = section.getAttribute("data-export-title") || "Section";

      // ensure in view
      section.scrollIntoView({ block: "nearest" });
      await new Promise((r) => setTimeout(r, 30));

      const canvas = await html2canvas(section, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        // TS types lag behind – cast to any to keep clean builds
        letterRendering: true as any,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      } as any);

      // Fit to page with margins
      const targetW = pageW - margin * 2;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = targetW / imgW;
      const renderH = imgH * ratio;
      const availH = pageH - margin * 2;

      const record = () => toc.push({ title, page: pdf.getNumberOfPages() });

      if (renderH <= availH) {
        // Single page
        pdf.addImage(canvas, "PNG", margin, margin, targetW, renderH);
        record();
        pdf.addPage();
      } else {
        // Multi-page tiling
        const pageCount = Math.ceil(renderH / availH);
        let firstSlice = true;
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) pdf.addPage();
          // Slice a tad taller to avoid baseline cropping
          const fudgePx = Math.ceil(2 / ratio); // ~2pt
          const sY = Math.max(0, Math.floor((i * availH) / ratio) - fudgePx);
          const sH = Math.min(imgH - sY, Math.ceil(availH / ratio) + fudgePx * 2);

          const slice = document.createElement("canvas");
          slice.width = imgW;
          slice.height = sH;
          const ctx = slice.getContext("2d")!;
          ctx.drawImage(canvas, 0, sY, imgW, sH, 0, 0, imgW, sH);

          const h = sH * ratio;
          pdf.addImage(slice, "PNG", margin, margin, targetW, h);

          if (firstSlice) { record(); firstSlice = false; }
        }
        pdf.addPage();
      }
    }

    // Remove the trailing empty page that we added after the last section
    const lastPageIdx = pdf.getNumberOfPages();
    pdf.deletePage(lastPageIdx);

    // Insert Cover at page 1 (includes watermark + ToC)
    // We need to rebuild a new doc to put cover first, or we can insert & copy pages.
    // Simpler: create a new doc and import the pages.
    const final = new jsPDF({ orientation: orient, unit: "pt", format: "a4" });
    const totalWithoutCover = pdf.getNumberOfPages();

    // Build cover (pass ToC w/ +1 page offset)
    const tocWithOffset = toc.map((t) => ({ title: t.title, page: t.page + 1 }));
    addCover(final, pageW, pageH, cover, brand, stats, tocWithOffset);

    // Append existing pages
    for (let i = 1; i <= totalWithoutCover; i++) {
      const page = (pdf as any).getPage(i); // jsPDF keeps internal structure
      (final as any).addPage(page);
    }

    // Footer + watermark on every page
    const total = final.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      final.setPage(i);
      drawWatermark(final, pageW, pageH, "CONFIDENTIAL • INTERNAL");
      drawFooter(final, pageW, pageH, brand, i, total, qrData);
    }

    final.save(filename);
  } finally {
    root.removeAttribute("data-export-paused");
  }
}

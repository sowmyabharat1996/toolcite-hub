// components/tools/KeywordResearch/PdfReport.ts
// Branded, multi-page PDF export (html2canvas + jsPDF)
// - Header + footer + diagonal watermark per page
// - Optional brand cover page
// - Auto-landscape for wide dashboards (configurable threshold)
// - Margins + smart tiling (no mid-card cuts)
// - Skips elements with data-export="skip"
// - Respects your data-export-paused flow

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Brand = {
  title?: string;          // header (left)
  subtitle?: string;       // header (right)
  footerLeft?: string;     // footer (left)
  footerRight?: string;    // footer (right, "Page x / y" is appended)
  watermark?: string;      // diagonal watermark text
};

type Cover =
  | boolean
  | {
      title?: string;
      subtitle?: string;
      bullets?: string[];     // up to ~6 recommended
      watermark?: string;     // optional different watermark on cover
    };

type PdfOptions = {
  /** If true or object, adds a brand cover page before the content */
  cover?: Cover;
  /** Enable landscape automatically when dashboard is wide (>= threshold px) */
  autoLandscape?: boolean;
  /** Pixel threshold for auto-landscape decision (default 900px) */
  landscapeThreshold?: number;
  /** Canvas scale for capture (default adaptive 1.6/1.3) */
  scale?: number;
};

// Pause CSS animations/transitions to speed up capture
function pauseAnimations(el: HTMLElement) {
  el.setAttribute("data-export-paused", "1");
  el.querySelectorAll<HTMLElement>("*").forEach((n) => {
    n.style.animationPlayState = "paused";
    n.style.transition = "none";
  });
}
function resumeAnimations(el: HTMLElement) {
  el.removeAttribute("data-export-paused");
  el.querySelectorAll<HTMLElement>("*").forEach((n) => {
    n.style.animationPlayState = "";
    n.style.transition = "";
  });
}

// Small idle wait (UI settle)
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/**
 * Export the dashboard to a branded, paginated PDF.
 * Wrap major blocks with data-export="section" to control order.
 *
 * Backward compatible:
 *   exportDashboardToPDF(root, "file.pdf", brand?)
 * New options:
 *   exportDashboardToPDF(root, "file.pdf", brand?, { cover, autoLandscape, ... })
 */
export async function exportDashboardToPDF(
  root: HTMLElement,
  filename = "keyword-dashboard.pdf",
  brand: Brand = {},
  opts: PdfOptions = {}
) {
  // Collect sections (DOM order). Fallback to whole root if none.
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-export="section"]'));
  if (sections.length === 0) sections.push(root);

  // Determine orientation
  const auto = !!opts.autoLandscape;
  const threshold = Math.max(320, opts.landscapeThreshold ?? 900);
  const maxSectionWidth = Math.max(
    root.getBoundingClientRect().width,
    ...sections.map((s) => s.getBoundingClientRect().width)
  );
  const orientation: "p" | "l" = auto && maxSectionWidth >= threshold ? "l" : "p";

  // Create PDF (A4)
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Layout bands
  const marginL = 18;
  const marginR = 18;
  const headerH = 56;
  const footerH = 36;
  const usableW = pageW - marginL - marginR;
  const usableH = pageH - headerH - footerH;

  // Branding defaults
  const title = brand.title || "ToolCite – Keyword Research (AI Dashboard)";
  const subtitle = brand.subtitle || new Date().toLocaleString();
  const footerLeft = brand.footerLeft || "© ToolCite Hub • Smart • Fast • Reliable";
  const footerRightBase = brand.footerRight || "Internal";
  const watermark = brand.watermark || "TOOLCITE • INTERNAL SEO REPORT";

  // Colors
  const colorHeader = [15, 23, 42];     // slate-900
  const colorSubtle = [100, 116, 139];  // slate-500
  const colorLine = [226, 232, 240];    // slate-200
  const colorWater = [203, 213, 225];   // slate-300

  // Capture scale (balance clarity vs memory)
  const scale = opts.scale ?? (window.devicePixelRatio > 1 ? 1.6 : 1.3);

  // Collect slices first to know page count
  type Slice = { dataUrl: string; outH: number };
  const pages: Slice[] = [];

  pauseAnimations(root);
  try {
    for (const section of sections) {
      section.scrollIntoView({ block: "center" });
      await tick(40);

      const canvas = await html2canvas(section, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        ignoreElements: (el: Element) => {
          const anyEl = el as HTMLElement;
          return anyEl?.dataset?.export === "skip";
        },
      });

      const imgWpx = canvas.width;
      const imgHpx = canvas.height;
      const ratio = usableW / imgWpx;
      const renderH = imgHpx * ratio;

      if (renderH <= usableH) {
        pages.push({ dataUrl: canvas.toDataURL("image/png", 0.96), outH: renderH });
      } else {
        // Tile vertically
        const pageCount = Math.ceil(renderH / usableH);
        for (let i = 0; i < pageCount; i++) {
          const sYpx = (i * usableH) / ratio;
          const sHpx = Math.min(imgHpx - sYpx, usableH / ratio);

          const slice = document.createElement("canvas");
          slice.width = imgWpx;
          slice.height = Math.max(1, Math.floor(sHpx));
          const ctx = slice.getContext("2d")!;
          ctx.drawImage(canvas, 0, sYpx, imgWpx, sHpx, 0, 0, imgWpx, sHpx);

          pages.push({
            dataUrl: slice.toDataURL("image/png", 0.96),
            outH: sHpx * ratio,
          });
        }
      }

      await tick(30);
    }
  } finally {
    resumeAnimations(root);
  }

  // Optional Cover Page
  const hasCover = !!opts.cover;
  if (hasCover) {
    const c = typeof opts.cover === "object" ? opts.cover : {};
    addCoverPage(pdf, {
      pageW,
      pageH,
      marginL,
      marginR,
      colorHeader,
      colorSubtle,
      colorLine,
      colorWater,
      coverTitle: c.title ?? title,
      coverSubtitle: c.subtitle ?? subtitle,
      bullets: c.bullets ?? [],
      watermark: c.watermark ?? watermark,
    });
  }

  // Draw content pages with header/footer/watermark
  const totalPages = pages.length + (hasCover ? 1 : 0);
  let pageIndex = hasCover ? 2 : 1; // human-readable (1-based)

  pages.forEach((slice, idx) => {
    if (idx > 0 || hasCover) pdf.addPage();

    drawPageFrame(pdf, {
      pageW, pageH, marginL, marginR, headerH, footerH,
      title, subtitle, footerLeft, footerRightBase, colorHeader, colorSubtle, colorLine,
      watermark,
      pageIndex,
      totalPages,
    });

    pdf.addImage(
      slice.dataUrl,
      "PNG",
      marginL,
      headerH,
      usableW,
      slice.outH,
      undefined,
      "FAST"
    );

    pageIndex++;
  });

  pdf.save(filename);
}

/* ------------------ helpers ------------------ */

function drawPageFrame(
  pdf: jsPDF,
  args: {
    pageW: number; pageH: number;
    marginL: number; marginR: number;
    headerH: number; footerH: number;
    title: string; subtitle: string;
    footerLeft: string; footerRightBase: string;
    colorHeader: number[]; colorSubtle: number[]; colorLine: number[];
    watermark: string;
    pageIndex: number; totalPages: number;
  }
) {
  const {
    pageW, pageH, marginL, marginR, headerH, footerH,
    title, subtitle, footerLeft, footerRightBase,
    colorHeader, colorSubtle, colorLine, watermark,
    pageIndex, totalPages,
  } = args;

  // Header separator
  pdf.setDrawColor(colorLine[0], colorLine[1], colorLine[2]);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, headerH - 8, pageW - marginR, headerH - 8);

  // Header text
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(colorHeader[0], colorHeader[1], colorHeader[2]);
  pdf.text(title, marginL, 28);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(colorSubtle[0], colorSubtle[1], colorSubtle[2]);
  pdf.text(subtitle, pageW - marginR, 28, { align: "right" });

  // Watermark (light)
  if (watermark) {
    try {
      // If jsPDF has GState (v2+), use opacity
      // @ts-ignore
      if (pdf.GState) {
        // @ts-ignore
        pdf.saveGraphicsState();
        // @ts-ignore
        pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }));
      }
    } catch {}
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(60);
    pdf.setTextColor(203, 213, 225); // slate-300
    const cx = pageW / 2;
    const cy = pageH / 2;
    (pdf as any).text(watermark, cx, cy, { align: "center", angle: -30 });
    try {
      // @ts-ignore
      if (pdf.restoreGraphicsState) pdf.restoreGraphicsState();
    } catch {}
  }

  // Footer separator
  pdf.setDrawColor(colorLine[0], colorLine[1], colorLine[2]);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, pageH - footerH + 8, pageW - marginR, pageH - footerH + 8);

  // Footer text
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(colorSubtle[0], colorSubtle[1], colorSubtle[2]);
  pdf.text(footerLeft, marginL, pageH - 12);

  const pageLabel = `${footerRightBase ? footerRightBase + " • " : ""}Page ${pageIndex} / ${totalPages}`;
  pdf.text(pageLabel, pageW - marginR, pageH - 12, { align: "right" });
}

function addCoverPage(
  pdf: jsPDF,
  args: {
    pageW: number; pageH: number; marginL: number; marginR: number;
    colorHeader: number[]; colorSubtle: number[]; colorLine: number[]; colorWater: number[];
    coverTitle: string; coverSubtitle: string; bullets: string[]; watermark: string;
  }
) {
  const {
    pageW, pageH, marginL, marginR,
    colorHeader, colorSubtle, colorLine, colorWater,
    coverTitle, coverSubtitle, bullets, watermark,
  } = args;

  // Clear (we're on first page already)
  // Header divider
  pdf.setDrawColor(colorLine[0], colorLine[1], colorLine[2]);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, 72, pageW - marginR, 72);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(colorHeader[0], colorHeader[1], colorHeader[2]);
  pdf.text(coverTitle, marginL, 48);

  // Subtitle
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(colorSubtle[0], colorSubtle[1], colorSubtle[2]);
  pdf.text(coverSubtitle, marginL, 92);

  // Watermark (bigger on cover)
  if (watermark) {
    try {
      // @ts-ignore
      if (pdf.GState) {
        // @ts-ignore
        pdf.saveGraphicsState();
        // @ts-ignore
        pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
      }
    } catch {}
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(72);
    pdf.setTextColor(colorWater[0], colorWater[1], colorWater[2]);
    (pdf as any).text(watermark, pageW / 2, pageH / 2, { align: "center", angle: -25 });
    try {
      // @ts-ignore
      if (pdf.restoreGraphicsState) pdf.restoreGraphicsState();
    } catch {}
  }

  // Bullet list
  if (bullets && bullets.length) {
    const startY = 132;
    let y = startY;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(colorHeader[0], colorHeader[1], colorHeader[2]);

    bullets.slice(0, 10).forEach((b) => {
      // Draw a simple dot + text
      pdf.circle(marginL + 2, y - 3.5, 1.7, "F");
      pdf.text(b, marginL + 10, y);
      y += 18;
    });
  }

  // Footer line
  pdf.setDrawColor(colorLine[0], colorLine[1], colorLine[2]);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, pageH - 44, pageW - marginR, pageH - 44);

  // Footer (date)
  const when = new Date().toLocaleString();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(colorSubtle[0], colorSubtle[1], colorSubtle[2]);
  pdf.text(`Generated: ${when}`, marginL, pageH - 28);
  pdf.text("© ToolCite Hub • Smart • Fast • Reliable", pageW - marginR, pageH - 28, { align: "right" });
}

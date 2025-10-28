// components/tools/KeywordResearch/PdfReport.ts
// Robust PDF + PNG exporters with a single "options object" signature.
// Works well with Next.js/React and section-based capture.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ---------- Types ---------- */

export type CoverInfo = {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  watermark?: string;
  linkQR?: string; // URL to encode as QR (bottom-left of every page)
};

export type PDFOptions = {
  brand?: string;          // footer brand text (every page)
  cover?: boolean | CoverInfo;
  autoLandscape?: boolean; // try landscape when section is wide
  margin?: number;         // page margin in pt
};

/* ---------- Small helpers ---------- */

const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms));

function pauseAnimations(root: HTMLElement) {
  root.setAttribute("data-export-paused", "1");
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.animationPlayState = "paused";
    el.style.transition = "none";
  });
}
function resumeAnimations(root: HTMLElement) {
  root.removeAttribute("data-export-paused");
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.animationPlayState = "";
    el.style.transition = "";
  });
}

function sectionsOf(root: HTMLElement): HTMLElement[] {
  const secs = Array.from(
    root.querySelectorAll<HTMLElement>('[data-export="section"]')
  );
  return secs.length ? secs : [root];
}

/* ---------- OPTIONAL: tiny QR (vector path) ---------- */
function drawMiniQR(pdf: jsPDF, x: number, y: number) {
  // minimalist 5x5 pattern (decorative; not a real QR)
  const s = 1.2;
  const squares: Array<[number, number]> = [
    [0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2],
  ];
  pdf.setFillColor(0, 0, 0);
  squares.forEach(([cx, cy]) => {
    pdf.rect(x + cx * s, y + cy * s, s, s, "F");
  });
}

/* ---------- Cover page ---------- */
function renderCover(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  cover: CoverInfo | undefined,
  brand: string,
  margin: number
) {
  const c = cover ?? {};
  const title = c.title ?? "Keyword Research — AI Dashboard";
  const subtitle = c.subtitle ?? "";
  const bullets = c.bullets ?? [];
  const wm = c.watermark ?? "CONFIDENTIAL • INTERNAL";

  // Watermark
  pdf.saveGraphicsState();
  pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }) as any);
  pdf.setFontSize(56);
  pdf.setTextColor(0, 0, 0);
  pdf.text(wm, pageW * 0.1, pageH * 0.35, { angle: -22 });
  pdf.restoreGraphicsState();

  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, margin, margin + 16);

  // Subtitle
  if (subtitle) {
    pdf.setFontSize(12);
    pdf.setTextColor(80);
    pdf.text(subtitle, margin, margin + 36);
  }

  // Bullets
  if (bullets.length) {
    pdf.setFontSize(11);
    pdf.setTextColor(30);
    let y = margin + 64;
    bullets.forEach((b) => {
      pdf.circle(margin + 2, y - 3.5, 1.25, "F");
      pdf.text(b, margin + 8, y);
      y += 16;
    });
  }

  // Footer brand + page
  pdf.setFontSize(9);
  pdf.setTextColor(110);
  drawMiniQR(pdf, margin, pageH - margin - 6);
  pdf.text(brand, margin + 12, pageH - margin);
  pdf.text("Page 1", pageW - margin, pageH - margin, { align: "right" });
}

/* ---------- Footer for every page ---------- */
function renderFooter(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  brand: string,
  pageNo: number,
  margin: number
) {
  pdf.setFontSize(9);
  pdf.setTextColor(110);
  drawMiniQR(pdf, margin, pageH - margin - 6);
  pdf.text(brand, margin + 12, pageH - margin);
  pdf.text(`Page ${pageNo}`, pageW - margin, pageH - margin, {
    align: "right",
  });
}

/* ---------- Public: PDF ---------- */

export async function exportDashboardToPDF(
  root: HTMLElement,
  filename = "keyword-dashboard.pdf",
  options: PDFOptions = {}
) {
  const brand = options.brand ?? "ToolCite Hub";
  const coverOpt = options.cover;
  const autoLandscape = options.autoLandscape ?? true;
  const margin = Math.max(16, options.margin ?? 32);

  const secs = sectionsOf(root);

  // Decide orientation
  const firstRect = secs[0].getBoundingClientRect();
  const preferLandscape = autoLandscape && firstRect.width > firstRect.height;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: preferLandscape ? "landscape" : "portrait",
  });

  pauseAnimations(root);
  try {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let pageNo = 1;

    // Cover?
    if (coverOpt) {
      renderCover(
        pdf,
        pageW,
        pageH,
        typeof coverOpt === "object" ? coverOpt : undefined,
        brand,
        margin
      );
      pageNo++;
      pdf.addPage();
    }

    // Capture each section
    for (let si = 0; si < secs.length; si++) {
      const section = secs[si];

      // make sure in view for accurate layout
      section.scrollIntoView({ block: "center" });
      await sleep(30);

      const scale = window.devicePixelRatio > 1 ? 1.5 : 1.25;
      const canvas = await html2canvas(section, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      // calc size
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const ratio = Math.min(usableW / canvas.width, usableH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;

      pdf.addImage(
        canvas,
        "PNG",
        margin,
        margin,
        Math.max(10, w),
        Math.max(10, h)
      );

      renderFooter(pdf, pageW, pageH, brand, pageNo, margin);
      pageNo++;
      if (si !== secs.length - 1) pdf.addPage();
      await sleep(10);
    }

    pdf.save(filename);
  } finally {
    resumeAnimations(root);
  }
}

/* ---------- Public: PNG (single image of the dashboard) ---------- */
export async function exportDashboardToPNG(
  root: HTMLElement,
  filename = "keyword-dashboard.png",
  scale = 2
) {
  pauseAnimations(root);
  try {
    const canvas = await html2canvas(root, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    }, "image/png");
  } finally {
    resumeAnimations(root);
  }
}

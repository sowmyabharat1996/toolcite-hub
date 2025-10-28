// components/tools/KeywordResearch/PdfReport.ts
// ToolCite Hub — Branded PDF Export with Cover, ToC, QR Footer, Watermark
// Fixes: per-page footer & precise pagination (no stray blank pages)

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

// ---------- tiny helpers ----------
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

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

// ---------- types ----------
type CoverOpts = {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  watermark?: string;
};
type ExportOpts = {
  filename?: string;
  brand?: string;
  cover?: false | CoverOpts;
  autoLandscape?: boolean;
  margin?: number;
};

// ---------- drawing primitives ----------
function drawWatermark(pdf: jsPDF, pageW: number, pageH: number, text?: string) {
  if (!text) return;
  try {
    (pdf as any).saveGraphicsState?.();
    if ((pdf as any).GState && (pdf as any).setGState) {
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.08 }));
    }
  } catch { /* noop */ }

  try {
    pdf.setTextColor(185);
    pdf.setFontSize(48);
    const cx = pageW / 2;
    const cy = pageH / 2;
    // rotate text via angle (works across jsPDF variants)
    (pdf as any).text(text, cx, cy, { angle: -30, align: "center" });
  } finally {
    try { (pdf as any).restoreGraphicsState?.(); } catch { /* noop */ }
  }
}

async function drawFooterWithQR(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  brand?: string,
  pageLabel?: string,
  margin = 36
) {
  // Pre-generate small QR
  const qrText = "https://toolcitehub.com";
  const qrData = await QRCode.toDataURL(qrText, { margin: 0, width: 38 });
  const size = 38;
  const x = margin;
  const y = pageH - margin - size;

  pdf.addImage(qrData, "PNG", x, y, size, size);

  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text(brand || "© ToolCite Hub • Smart • Fast • Reliable", x + size + 10, pageH - margin / 2);

  if (pageLabel) {
    pdf.text(pageLabel, pageW - margin, pageH - margin / 2, { align: "right" } as any);
  }
}

function drawCover(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  cover: CoverOpts,
  tocTitles: string[] | null
) {
  const margin = 48;

  drawWatermark(pdf, pageW, pageH, cover.watermark || "CONFIDENTIAL • INTERNAL");

  // Title + subtitle
  pdf.setFontSize(22);
  pdf.setTextColor(30);
  pdf.text(cover.title || "Keyword Research — AI Dashboard", margin, margin + 10);

  pdf.setFontSize(12);
  pdf.text(
    cover.subtitle ||
      `Seed: ${(document.querySelector("input") as HTMLInputElement | null)?.value || "n/a"} • Exported ${new Date().toLocaleString()}`,
    margin,
    margin + 30
  );

  // Bullets (quick summary)
  if (cover.bullets?.length) {
    pdf.setFontSize(10);
    cover.bullets.forEach((line, i) => pdf.text(`• ${line}`, margin, margin + 50 + i * 14));
  }

  // Table of Contents (optional)
  if (tocTitles?.length) {
    const startY = margin + 110;
    pdf.setFontSize(12);
    pdf.text("Contents", margin, startY);
    pdf.setFontSize(10);
    tocTitles.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t}`, margin + 20, startY + 15 + i * 14);
    });
  }
}

// ---------- core exporter ----------
export async function exportDashboardToPDF(root: HTMLElement, opts: ExportOpts = {}) {
  const {
    filename = "keyword-dashboard.pdf",
    brand = "ToolCite Hub",
    cover = false,
    autoLandscape = false,
    margin = 36,
  } = opts;

  // Collect exportable sections (DOM order)
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-export="section"]'));
  if (sections.length === 0) sections.push(root);

  // If charts are wide, let user opt-in to landscape
  const pdf = new jsPDF({
    orientation: autoLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Make captures smoother
  pauseAnimations(root);
  const scale = window.devicePixelRatio > 1 ? 1.5 : 1.25;

  // For a ToC on cover we’ll gather the first h1/h2/h3 of each section
  const tocTitles: string[] = sections.map(
    (s) => s.querySelector("h1,h2,h3")?.textContent?.trim() || ""
  );

  // Page counter starts at 1 (the first physical page in jsPDF)
  let pageIndex = 1;

  try {
    // ---------- COVER (optional) ----------
    if (cover) {
      drawCover(pdf, pageW, pageH, cover as CoverOpts, tocTitles.length ? tocTitles : null);
      await drawFooterWithQR(pdf, pageW, pageH, brand, `Page ${pageIndex}`, margin);

      // Only add a new page if there is content to follow
      if (sections.length > 0) {
        pdf.addPage();
        pageIndex++;
      }
    }

    // ---------- CONTENT SECTIONS ----------
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      section.scrollIntoView({ block: "center" });
      await tick(50);

      // Render to canvas
      const canvas = await html2canvas(section, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = pageW / imgW;
      const renderH = imgH * ratio;

      // Utility to commit one PDF page (image already positioned)
      const commitPage = async (img: HTMLCanvasElement, drawHeight: number) => {
        pdf.addImage(img, "PNG", 0, 0, pageW, drawHeight);
        await drawFooterWithQR(pdf, pageW, pageH, brand, `Page ${pageIndex}`, margin);
      };

      // Are there multiple tiles?
      if (renderH <= pageH) {
        // Single-page section: draw on current page
        await commitPage(canvas, renderH);

        // Add a new page if there is more content after this page
        const isLastOverall = sIdx === sections.length - 1;
        if (!isLastOverall) {
          pdf.addPage();
          pageIndex++;
        }
      } else {
        // Multi-page: tile vertically
        const pageCount = Math.ceil(renderH / pageH);
        for (let i = 0; i < pageCount; i++) {
          const sY = (i * pageH) / ratio;
          const sH = Math.min(imgH - sY, pageH / ratio);

          const slice = document.createElement("canvas");
          slice.width = imgW;
          slice.height = sH;
          const ctx = slice.getContext("2d")!;
          ctx.drawImage(canvas, 0, sY, imgW, sH, 0, 0, imgW, sH);

          await commitPage(slice, sH * ratio);

          const isLastTile = i === pageCount - 1;
          const isLastSection = sIdx === sections.length - 1;
          const isLastOverall = isLastTile && isLastSection;

          if (!isLastOverall) {
            pdf.addPage();
            pageIndex++;
          }
        }
      }

      await tick(40);
    }

    pdf.save(filename);
  } finally {
    resumeAnimations(root);
  }
}

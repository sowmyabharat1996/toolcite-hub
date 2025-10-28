// components/tools/KeywordResearch/PdfReport.ts
// ToolCite Hub — Branded PDF Export with Cover, ToC, QR Footer, Watermark
// Fixes: reserved footer band (no overlap), robust ToC titles, precise pagination

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

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
  margin?: number; // outer text margin + footer baseline padding
};

// ---------- helpers ----------
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

// ---------- drawing primitives ----------
function drawWatermark(pdf: jsPDF, pageW: number, pageH: number, text?: string) {
  if (!text) return;
  try {
    (pdf as any).saveGraphicsState?.();
    if ((pdf as any).GState && (pdf as any).setGState) {
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.08 }));
    }
  } catch {}

  try {
    pdf.setTextColor(185);
    pdf.setFontSize(48);
    const cx = pageW / 2;
    const cy = pageH / 2;
    (pdf as any).text(text, cx, cy, { angle: -30, align: "center" });
  } finally {
    try { (pdf as any).restoreGraphicsState?.(); } catch {}
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
  tocTitles: string[] | null,
  margin: number
) {
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
    margin + 32
  );

  // Bullets (summary)
  let atY = margin + 52;
  if (cover.bullets?.length) {
    pdf.setFontSize(10);
    cover.bullets.forEach((line) => {
      pdf.text(`• ${line}`, margin, atY);
      atY += 14;
    });
    atY += 10; // spacing before Contents
  }

  // Table of Contents
  if (tocTitles?.length) {
    pdf.setFontSize(12);
    pdf.text("Contents", margin, atY);
    atY += 16;
    pdf.setFontSize(10);
    tocTitles.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t}`, margin + 18, atY);
      atY += 14;
    });
  }
}

// Fetch section titles: prefer data-title, else first H1/H2/H3, else fallback
function getSectionTitles(sections: HTMLElement[]): string[] {
  const fallbacks = [
    "Summary KPIs",
    "Simulator & Filters",
    "Charts",
    "AI Insight — Easiest Wins",
    "Keyword Lists by Source",
  ];

  return sections.map((s, i) => {
    const attr = s.getAttribute("data-title")?.trim();
    if (attr) return attr;
    const h = s.querySelector("h1,h2,h3")?.textContent?.trim();
    if (h && h.length > 0) return h;
    return fallbacks[Math.min(i, fallbacks.length - 1)];
  });
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

  // Collect sections
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-export="section"]'));
  if (sections.length === 0) sections.push(root);

  // Init PDF
  const pdf = new jsPDF({
    orientation: autoLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Reserve a footer band so content never overlaps QR/page number
  const footerQRSize = 38;
  const footerReserved = footerQRSize + margin; // ~74pt by default
  const usableH = pageH - footerReserved;
  const safetyTop = 2; // tiny visual buffer on tiles

  pauseAnimations(root);
  const scale = window.devicePixelRatio > 1 ? 1.5 : 1.25;

  const tocTitles = getSectionTitles(sections);
  let pageIndex = 1;

  try {
    // COVER
    if (cover) {
      drawCover(pdf, pageW, pageH, cover as CoverOpts, tocTitles.length ? tocTitles : null, margin);
      await drawFooterWithQR(pdf, pageW, pageH, brand, `Page ${pageIndex}`, margin);
      if (sections.length > 0) {
        pdf.addPage();
        pageIndex++;
      }
    }

    // CONTENT
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      section.scrollIntoView({ block: "center" });
      await tick(40);

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

      const commitPage = async (img: HTMLCanvasElement, drawHeight: number) => {
        pdf.addImage(img, "PNG", 0, safetyTop, pageW, drawHeight - safetyTop);
        await drawFooterWithQR(pdf, pageW, pageH, brand, `Page ${pageIndex}`, margin);
      };

      if (renderH <= usableH) {
        // one page
        await commitPage(canvas, Math.min(renderH, usableH));
        const isLastOverall = sIdx === sections.length - 1;
        if (!isLastOverall) {
          pdf.addPage();
          pageIndex++;
        }
      } else {
        // tiling
        const pageCount = Math.ceil(renderH / usableH);
        for (let i = 0; i < pageCount; i++) {
          const sY = (i * usableH) / ratio;
          const sH = Math.min(imgH - sY, usableH / ratio);

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

      await tick(30);
    }

    pdf.save(filename);
  } finally {
    resumeAnimations(root);
  }
}

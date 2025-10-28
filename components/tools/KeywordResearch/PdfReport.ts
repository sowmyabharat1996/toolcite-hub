// components/tools/KeywordResearch/PdfReport.ts
// ToolCite Hub – PDF Export Engine (brand, cover, QR, ToC, watermark)

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

// Small async sleep
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// Helper: pause/resume animations for smoother capture
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

// --- Types ---
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

// Watermark (no rotate)
function drawWatermark(pdf: jsPDF, pageW: number, pageH: number, text?: string) {
  if (!text) return;
  try {
    (pdf as any).saveGraphicsState?.();
    if ((pdf as any).GState && (pdf as any).setGState) {
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.08 }));
    }
  } catch {}

  try {
    pdf.setTextColor(180);
    pdf.setFontSize(48);
    const cx = pageW / 2;
    const cy = pageH / 2;
    (pdf as any).text(text, cx, cy, { angle: -30, align: "center" });
  } finally {
    try {
      (pdf as any).restoreGraphicsState?.();
    } catch {}
  }
}

// QR footer
async function drawFooterWithQR(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  brand?: string,
  pageLabel?: string,
  margin = 36
) {
  const qrText = "https://toolcitehub.com";
  const qrData = await QRCode.toDataURL(qrText, { margin: 1, width: 40 });
  const qrSize = 40;
  const qrX = margin;
  const qrY = pageH - margin - qrSize;

  pdf.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text(
    brand || "© ToolCite Hub • Smart • Fast • Reliable",
    margin + qrSize + 10,
    pageH - margin / 2
  );
  if (pageLabel) {
    pdf.text(pageLabel, pageW - margin, pageH - margin / 2, {
      align: "right",
    } as any);
  }
}

// Cover page with ToC + watermark
function drawCover(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  cover: CoverOpts,
  tocTitles: string[] | null
) {
  const margin = 48;
  drawWatermark(pdf, pageW, pageH, cover.watermark || "CONFIDENTIAL • INTERNAL");

  pdf.setFontSize(22);
  pdf.setTextColor(30);
  pdf.text(
    cover.title || "Keyword Research — AI Dashboard",
    margin,
    margin + 10
  );

  pdf.setFontSize(12);
  pdf.text(
    cover.subtitle ||
      `Seed: ${document.querySelector("input")?.value || "n/a"} • Exported ${new Date().toLocaleString()}`,
    margin,
    margin + 30
  );

  if (cover.bullets?.length) {
    pdf.setFontSize(10);
    cover.bullets.forEach((line, i) =>
      pdf.text(`• ${line}`, margin, margin + 50 + i * 14)
    );
  }

  if (tocTitles?.length) {
    pdf.setFontSize(12);
    pdf.text("Contents", margin, margin + 110);
    pdf.setFontSize(10);
    tocTitles.forEach((t, i) =>
      pdf.text(`${i + 1}. ${t}`, margin + 20, margin + 125 + i * 14)
    );
  }
}

// --- Core exporter ---
export async function exportDashboardToPDF(
  root: HTMLElement,
  options: ExportOpts = {}
) {
  const filename = options.filename || "keyword-dashboard.pdf";
  const brand = options.brand || "ToolCite Hub";
  const margin = options.margin ?? 36;

  const sections = Array.from(
    root.querySelectorAll<HTMLElement>('[data-export="section"]')
  );
  if (sections.length === 0) sections.push(root);

  const useLandscape = options.autoLandscape && sections.length > 1;
  const pdf = new jsPDF({
    orientation: useLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  pauseAnimations(root);

  const scale = window.devicePixelRatio > 1 ? 1.5 : 1.25;
  let pageIndex = 1;
  const tocTitles: string[] = [];

  try {
    // Cover page first (optional)
    if (options.cover) {
      drawCover(pdf, pageW, pageH, options.cover as CoverOpts, tocTitles);
      await drawFooterWithQR(
        pdf,
        pageW,
        pageH,
        brand,
        `Page ${pageIndex}`,
        margin
      );
      pdf.addPage();
      pageIndex++;
    }

    // Section-by-section capture
    for (const section of sections) {
      section.scrollIntoView({ block: "center" });
      await tick(50);

      const heading =
        section.querySelector("h1,h2,h3")?.textContent?.trim() || "";
      if (heading) tocTitles.push(heading);

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

      const addTiledImage = (srcCanvas: HTMLCanvasElement) => {
        if (renderH <= pageH) {
          pdf.addImage(srcCanvas, "PNG", 0, 0, pageW, renderH);
        } else {
          const pageCount = Math.ceil(renderH / pageH);
          for (let i = 0; i < pageCount; i++) {
            if (i > 0) pdf.addPage();
            const sY = (i * pageH) / ratio;
            const sH = Math.min(imgH - sY, pageH / ratio);
            const slice = document.createElement("canvas");
            slice.width = imgW;
            slice.height = sH;
            const ctx = slice.getContext("2d")!;
            ctx.drawImage(canvas, 0, sY, imgW, sH, 0, 0, imgW, sH);
            pdf.addImage(slice, "PNG", 0, 0, pageW, sH * ratio);
            pageIndex++;
          }
        }
      };

      addTiledImage(canvas);
      await drawFooterWithQR(
        pdf,
        pageW,
        pageH,
        brand,
        `Page ${pageIndex}`,
        margin
      );
      pdf.addPage();
      pageIndex++;
      await tick(50);
    }

    pdf.save(filename);
  } finally {
    resumeAnimations(root);
  }
}

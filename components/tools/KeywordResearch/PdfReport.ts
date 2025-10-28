// components/tools/KeywordResearch/PdfReport.ts
// A lightweight, robust page-to-PDF exporter that captures the dashboard
// section-by-section to avoid main-thread stalls.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Helper: temporarily pause CSS animations/transitions to speed up capture
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

// Helper: small idle wait (lets UI settle)
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/**
 * Export the dashboard to a paginated PDF.
 * Requirements:
 *  - Wrap major blocks in a container with data-export="section".
 *    (see notes below for what to wrap)
 */
export async function exportDashboardToPDF(root: HTMLElement, filename = "keyword-dashboard.pdf") {
  // Find exportable sections (order = DOM order)
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-export="section"]'));
  if (sections.length === 0) {
    // Fallback: if no sections are marked, capture the whole root (may be heavy)
    sections.push(root);
  }

  // PDF setup (A4 portrait in points)
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  pauseAnimations(root);
  // A slightly modest scale keeps memory reasonable on long pages.
  const scale = window.devicePixelRatio > 1 ? 1.5 : 1.25;

  try {
    let first = true;

    for (const section of sections) {
      // Ensure the section is visible in the viewport for accurate layout
      section.scrollIntoView({ block: "center" });
      await tick(50);

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

      if (!first) pdf.addPage();
      first = false;

      // If the section is taller than one page, tile it downwards
      if (renderH <= pageH) {
        pdf.addImage(canvas, "PNG", 0, 0, pageW, renderH);
      } else {
        // Tile vertically
        const pageCount = Math.ceil(renderH / pageH);
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) pdf.addPage();
          const sY = (i * pageH) / ratio;             // slice start in canvas pixels
          const sH = Math.min(imgH - sY, pageH / ratio);
          const slice = document.createElement("canvas");
          slice.width = imgW;
          slice.height = sH;
          const ctx = slice.getContext("2d")!;
          ctx.drawImage(canvas, 0, sY, imgW, sH, 0, 0, imgW, sH);
          pdf.addImage(slice, "PNG", 0, 0, pageW, sH * ratio);
        }
      }

      // Yield to main thread between sections (prevents the “page not responding” dialog)
      await tick(50);
    }

    pdf.save(filename);
  } finally {
    resumeAnimations(root);
  }
}

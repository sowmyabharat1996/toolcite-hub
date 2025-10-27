// components/tools/KeywordResearch/PdfReport.ts
"use client";

export async function exportDashboardToPDF(rootEl: HTMLElement, fileName = "keyword-report.pdf") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(rootEl, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 48; // margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 24;
  if (imgHeight < pageHeight - 48) {
    pdf.addImage(imgData, "PNG", 24, y, imgWidth, imgHeight, "FAST");
  } else {
    // paginate if content is tall
    let remaining = imgHeight;
    let sY = 0;
    const pageCanvas = document.createElement("canvas");
    const ctx = pageCanvas.getContext("2d")!;
    const ratio = imgWidth / canvas.width;

    while (remaining > 0) {
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(canvas.height - sY, (pageHeight - 48) / ratio);
      ctx.drawImage(canvas, 0, sY, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
      const pageImg = pageCanvas.toDataURL("image/png");
      pdf.addImage(pageImg, "PNG", 24, 24, imgWidth, pageCanvas.height * ratio, "FAST");
      remaining -= pageCanvas.height * ratio;
      sY += pageCanvas.height;
      if (remaining > 0) pdf.addPage();
    }
  }

  pdf.save(fileName);
}

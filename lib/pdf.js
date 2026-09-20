// Branded PDF export utility — used across Sites, Labourers, Payments,
// Revenue and Estimation pages so every downloaded/printed document has a
// consistent "Vansh Construction" letterhead.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const WINE = [74, 14, 31];
const GOLD = [212, 175, 55];
const INK = [28, 22, 19];
const INK_SOFT = [101, 91, 84];

function addLetterhead(doc, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...WINE);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 30, pageWidth, 1.4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Vansh Construction", 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(241, 213, 123); // gold-light
  doc.text("Nitin Dohate", 14, 21);

  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(dateStr, pageWidth - 14, 14, { align: "right" });

  if (subtitle) {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(subtitle, 14, 40);
  }

  return 46; // y-position where the body/table should start
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    doc.setFontSize(8);
    doc.setTextColor(...INK_SOFT);
    doc.text("Vansh Construction — generated automatically", 14, pageHeight - 9);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 9, { align: "right" });
  }
}

/**
 * Export a titled table as a branded PDF.
 * @param {string} filename
 * @param {string} title - shown under the letterhead
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @param {string} [note] - optional line shown above the table
 */
export function exportTablePdf(filename, title, headers, rows, note) {
  const doc = new jsPDF();
  let y = addLetterhead(doc, title);

  if (note) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(note, 14, y);
    y += 6;
  }

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 3.5, textColor: INK },
    headStyles: { fillColor: WINE, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 245, 236] },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(filename);
}

/**
 * Export a free-form key/value summary block followed by an optional table —
 * used for the site estimate PDF.
 */
export function exportSummaryPdf(filename, title, summaryRows, table) {
  const doc = new jsPDF();
  let y = addLetterhead(doc, title);
  y += 4;

  autoTable(doc, {
    startY: y,
    body: summaryRows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10.5, cellPadding: { top: 2, bottom: 2, left: 0, right: 6 }, textColor: INK },
    columnStyles: {
      0: { fontStyle: "bold", textColor: INK_SOFT, cellWidth: 60 },
      1: { fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  if (table && table.rows?.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [table.headers],
      body: table.rows,
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 3.5, textColor: INK },
      headStyles: { fillColor: WINE, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 245, 236] },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(filename);
}

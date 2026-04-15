import { jsPDF } from 'jspdf';
import type Konva from 'konva';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_FONT_SIZE = 18;

/**
 * Export a Konva stage as a PNG image and trigger a browser download.
 *
 * Validates: Requirements 9.4
 */
export function exportPNG(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a Konva stage as a PDF with the scene heading as a title
 * and trigger a browser download.
 *
 * Validates: Requirements 9.5
 */
export function exportPDF(
  stage: Konva.Stage,
  sceneHeading: string,
  filename: string,
): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Title — scene heading
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text(sceneHeading || 'Lighting Diagram', MARGIN, MARGIN + HEADER_FONT_SIZE);

  const cursorY = MARGIN + HEADER_FONT_SIZE + 16;

  // Render stage to PNG data URL
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });

  // Fit image within usable page area while preserving aspect ratio
  const stageWidth = stage.width();
  const stageHeight = stage.height();
  const maxHeight = PAGE_HEIGHT - cursorY - MARGIN;
  const scale = Math.min(USABLE_WIDTH / stageWidth, maxHeight / stageHeight);
  const imgWidth = stageWidth * scale;
  const imgHeight = stageHeight * scale;

  doc.addImage(dataUrl, 'PNG', MARGIN, cursorY, imgWidth, imgHeight);

  const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(pdfFilename);
}

import { jsPDF } from 'jspdf';
import type { Script, ScreenplayElement, ElementType } from '@/types/screenplay';

// US Letter dimensions in points (72 pts/inch)
const PAGE_WIDTH = 612; // 8.5"
const PAGE_HEIGHT = 792; // 11"
const MARGIN_LEFT = 108; // 1.5"
const MARGIN_RIGHT = 72; // 1"
const MARGIN_TOP = 72; // 1"
const MARGIN_BOTTOM = 72; // 1"
const FONT_SIZE = 12;
const LINE_HEIGHT = 14; // ~12pt Courier line height in points
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

/** Layout config per element type: left offset (relative to MARGIN_LEFT), width fraction of usable width */
interface LayoutConfig {
  leftOffset: number;
  widthFraction: number;
  uppercase: boolean;
  bold: boolean;
  align: 'left' | 'center' | 'right';
}

const LAYOUT: Record<ElementType, LayoutConfig> = {
  SCENE_HEADING: { leftOffset: 0, widthFraction: 1, uppercase: true, bold: true, align: 'left' },
  ACTION: { leftOffset: 0, widthFraction: 1, uppercase: false, bold: false, align: 'left' },
  CHARACTER: { leftOffset: USABLE_WIDTH * 0.25, widthFraction: 0.5, uppercase: true, bold: false, align: 'center' },
  DIALOGUE: { leftOffset: USABLE_WIDTH * 0.1, widthFraction: 0.6, uppercase: false, bold: false, align: 'left' },
  PARENTHETICAL: { leftOffset: USABLE_WIDTH * 0.15, widthFraction: 0.4, uppercase: false, bold: false, align: 'left' },
  TRANSITION: { leftOffset: 0, widthFraction: 1, uppercase: true, bold: false, align: 'right' },
  TITLE_PAGE: { leftOffset: 0, widthFraction: 1, uppercase: false, bold: false, align: 'center' },
};

function addPageNumber(doc: jsPDF, pageNum: number): void {
  doc.setFont('Courier', 'normal');
  doc.setFontSize(FONT_SIZE);
  const text = `${pageNum}.`;
  const x = PAGE_WIDTH - MARGIN_RIGHT;
  const y = MARGIN_TOP / 2;
  doc.text(text, x, y, { align: 'right' });
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/**
 * Export a Script to PDF as a Blob.
 * Uses built-in Courier font (not Courier Prime for simplicity with jsPDF).
 */
export async function exportPDF(script: Script): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Separate title page elements from screenplay elements
  const titleElements = script.elements.filter(el => el.type === 'TITLE_PAGE');
  const screenplayElements = script.elements.filter(el => el.type !== 'TITLE_PAGE');

  // --- Title Page (page 1) ---
  doc.setFont('Courier', 'normal');
  doc.setFontSize(FONT_SIZE);

  if (titleElements.length > 0) {
    let y = PAGE_HEIGHT / 3; // Start title content ~1/3 down the page
    for (const el of titleElements) {
      const lines = wrapText(doc, el.text, USABLE_WIDTH);
      for (const line of lines) {
        doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
        y += LINE_HEIGHT;
      }
      y += LINE_HEIGHT; // Extra spacing between title elements
    }
  } else {
    // Even with no title elements, render the script title centered
    const y = PAGE_HEIGHT / 3;
    doc.setFont('Courier', 'bold');
    doc.text(script.title || 'Untitled', PAGE_WIDTH / 2, y, { align: 'center' });
    doc.setFont('Courier', 'normal');
  }

  // --- Screenplay pages (starting page 2) ---
  doc.addPage();
  let currentPage = 2;
  addPageNumber(doc, currentPage);
  let cursorY = MARGIN_TOP;

  for (const el of screenplayElements) {
    const layout = LAYOUT[el.type];
    const text = layout.uppercase ? el.text.toUpperCase() : el.text;
    const maxWidth = USABLE_WIDTH * layout.widthFraction;

    doc.setFont('Courier', layout.bold ? 'bold' : 'normal');
    doc.setFontSize(FONT_SIZE);

    const lines = wrapText(doc, text, maxWidth);

    // Check if we need a new page
    const blockHeight = lines.length * LINE_HEIGHT + LINE_HEIGHT; // include spacing
    if (cursorY + blockHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      currentPage++;
      addPageNumber(doc, currentPage);
      cursorY = MARGIN_TOP;
    }

    const baseX = MARGIN_LEFT + layout.leftOffset;

    for (const line of lines) {
      let x = baseX;
      let align: 'left' | 'center' | 'right' = 'left';

      if (layout.align === 'center') {
        x = baseX + maxWidth / 2;
        align = 'center';
      } else if (layout.align === 'right') {
        x = MARGIN_LEFT + USABLE_WIDTH;
        align = 'right';
      }

      doc.text(line, x, cursorY, { align });
      cursorY += LINE_HEIGHT;
    }

    // Add spacing after each element
    cursorY += LINE_HEIGHT * 0.5;
  }

  return doc.output('blob');
}

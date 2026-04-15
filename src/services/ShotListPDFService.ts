import { jsPDF } from 'jspdf';
import type { ShotList, ShotEntry } from '@/types/productionTools';

// US Letter dimensions in points (72 pts/inch)
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_FONT_SIZE = 18;
const SUBHEADER_FONT_SIZE = 13;
const TABLE_FONT_SIZE = 9;
const ROW_HEIGHT = 20;

const COLUMNS = [
  { header: '#', width: 24 },
  { header: 'Type', width: 64 },
  { header: 'Description', width: 120 },
  { header: 'Angle', width: 60 },
  { header: 'Movement', width: 68 },
  { header: 'Lens', width: 48 },
  { header: 'Notes', width: USABLE_WIDTH - 24 - 64 - 120 - 60 - 68 - 48 },
];

function drawTableHeader(doc: jsPDF, y: number): number {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(TABLE_FONT_SIZE);
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y, USABLE_WIDTH, ROW_HEIGHT, 'F');

  let x = MARGIN;
  for (const col of COLUMNS) {
    doc.text(col.header, x + 3, y + 14);
    x += col.width;
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(MARGIN, y + ROW_HEIGHT, MARGIN + USABLE_WIDTH, y + ROW_HEIGHT);

  return y + ROW_HEIGHT;
}

function formatShotType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

function drawEntryRow(doc: jsPDF, entry: ShotEntry, y: number, isEven: boolean): number {
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(TABLE_FONT_SIZE);

  if (isEven) {
    doc.setFillColor(250, 250, 250);
    doc.rect(MARGIN, y, USABLE_WIDTH, ROW_HEIGHT, 'F');
  }

  const cellPadding = 3;
  const values = [
    String(entry.shotNumber),
    formatShotType(entry.shotType),
    entry.description,
    entry.cameraAngle,
    entry.cameraMovement,
    entry.lens,
    entry.notes,
  ];

  let x = MARGIN;
  for (let i = 0; i < COLUMNS.length; i++) {
    const colWidth = COLUMNS[i].width;
    const text = truncateText(doc, values[i], colWidth - cellPadding * 2);
    doc.text(text, x + cellPadding, y + 14);
    x += colWidth;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, y + ROW_HEIGHT, MARGIN + USABLE_WIDTH, y + ROW_HEIGHT);

  return y + ROW_HEIGHT;
}

/**
 * Generate a PDF for a shot list and trigger a browser download.
 *
 * Validates: Requirements 4.1, 4.2, 4.3
 */
export function exportShotListPDF(shotList: ShotList, entries: ShotEntry[]): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Header — project title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text(shotList.title || 'Untitled Shot List', MARGIN, MARGIN + HEADER_FONT_SIZE);

  let cursorY = MARGIN + HEADER_FONT_SIZE + 8;

  // Subheader — scene heading (if linked)
  if (shotList.sceneHeading) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(SUBHEADER_FONT_SIZE);
    doc.text(shotList.sceneHeading, MARGIN, cursorY + SUBHEADER_FONT_SIZE);
    cursorY += SUBHEADER_FONT_SIZE + 12;
  }

  cursorY += 8;

  // Table header
  cursorY = drawTableHeader(doc, cursorY);

  // Table rows
  const sorted = [...entries].sort((a, b) => a.shotNumber - b.shotNumber);

  for (let i = 0; i < sorted.length; i++) {
    // Check if we need a new page
    if (cursorY + ROW_HEIGHT > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
      cursorY = drawTableHeader(doc, cursorY);
    }

    cursorY = drawEntryRow(doc, sorted[i], cursorY, i % 2 === 0);
  }

  // Trigger browser download
  const filename = `${(shotList.title || 'shot-list').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

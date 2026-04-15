import { jsPDF } from 'jspdf';
import type { AgreementTemplate, AgreementInstance } from '@/types/productionTools';

const PAGE_WIDTH = 612;
const MARGIN = 40;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_FONT_SIZE = 18;
const LABEL_FONT_SIZE = 11;
const VALUE_FONT_SIZE = 11;
const LINE_HEIGHT = 16;
const SIGNATURE_WIDTH = 200;
const SIGNATURE_HEIGHT = 80;

/**
 * Generate a PDF for a completed agreement and trigger a browser download.
 *
 * Validates: Requirements 7.3, 7.5
 */
export function exportAgreementPDF(
  template: AgreementTemplate,
  instance: AgreementInstance,
  signatureDataUrl?: string | null,
): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Header — template name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text(template.name, MARGIN, MARGIN + HEADER_FONT_SIZE);

  let cursorY = MARGIN + HEADER_FONT_SIZE + 24;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, cursorY, MARGIN + USABLE_WIDTH, cursorY);
  cursorY += 16;

  // Field labels and values
  doc.setFontSize(LABEL_FONT_SIZE);

  for (const field of template.fields) {
    // Check if we need a new page
    if (cursorY + LINE_HEIGHT * 3 > 792 - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
    }

    // Label
    doc.setFont('Helvetica', 'bold');
    doc.text(`${field.label}:`, MARGIN, cursorY + LABEL_FONT_SIZE);
    cursorY += LINE_HEIGHT;

    // Value
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(VALUE_FONT_SIZE);
    const value = instance.fieldValues[field.key] || '—';

    // Wrap long text values
    const lines = doc.splitTextToSize(value, USABLE_WIDTH);
    for (const line of lines) {
      if (cursorY + LINE_HEIGHT > 792 - MARGIN) {
        doc.addPage();
        cursorY = MARGIN;
      }
      doc.text(line, MARGIN, cursorY + VALUE_FONT_SIZE);
      cursorY += LINE_HEIGHT;
    }

    cursorY += 8; // spacing between fields
  }

  // Signature section
  if (signatureDataUrl) {
    // Check if signature fits on current page
    if (cursorY + SIGNATURE_HEIGHT + 40 > 792 - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
    }

    cursorY += 16;
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, cursorY, MARGIN + USABLE_WIDTH, cursorY);
    cursorY += 16;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(LABEL_FONT_SIZE);
    doc.text('Signature:', MARGIN, cursorY + LABEL_FONT_SIZE);
    cursorY += LINE_HEIGHT + 4;

    try {
      doc.addImage(signatureDataUrl, 'PNG', MARGIN, cursorY, SIGNATURE_WIDTH, SIGNATURE_HEIGHT);
    } catch {
      // If image fails to load, add placeholder text
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(VALUE_FONT_SIZE);
      doc.text('[Signature image unavailable]', MARGIN, cursorY + VALUE_FONT_SIZE);
    }
  }

  // Trigger browser download
  const filename = `${(template.name || 'agreement').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

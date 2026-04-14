import type { IExportManager } from '@/types/services';
import type { Script, ScreenplayElement } from '@/types/screenplay';
import type { Tier } from '@/types/subscription';
import { AppError } from '@/types/errors';
import { exportPDF } from './pdfExport';
import { exportFDX, parseFDX } from './fdxExport';
import { exportFountain, parseFountain } from './fountainExport';

/**
 * ExportManager implements IExportManager.
 * Tier-gates FDX and Fountain exports (free tier → throw error).
 * Triggers file download on successful export.
 */
export class ExportManager implements IExportManager {
  private tier: Tier;

  constructor(tier: Tier = 'free') {
    this.tier = tier;
  }

  setTier(tier: Tier): void {
    this.tier = tier;
  }

  async exportPDF(script: Script): Promise<Blob> {
    try {
      const blob = await exportPDF(script);
      triggerDownload(blob, `${sanitizeFilename(script.title)}.pdf`, 'application/pdf');
      return blob;
    } catch (err) {
      throw new AppError(
        `PDF export failed: ${err instanceof Error ? err.message : String(err)}`,
        'EXPORT_FAILED',
        'Failed to export PDF. Please try again.',
      );
    }
  }

  async exportFDX(script: Script): Promise<string> {
    this.assertPaidTier('fdx_export');
    try {
      const fdxString = exportFDX(script.elements);
      const blob = new Blob([fdxString], { type: 'application/xml' });
      triggerDownload(blob, `${sanitizeFilename(script.title)}.fdx`, 'application/xml');
      return fdxString;
    } catch (err) {
      throw new AppError(
        `FDX export failed: ${err instanceof Error ? err.message : String(err)}`,
        'EXPORT_FAILED',
        'Failed to export FDX. Please try again.',
      );
    }
  }

  async exportFountain(script: Script): Promise<string> {
    this.assertPaidTier('fountain_export');
    try {
      const fountainString = exportFountain(script.elements);
      const blob = new Blob([fountainString], { type: 'text/plain' });
      triggerDownload(blob, `${sanitizeFilename(script.title)}.fountain`, 'text/plain');
      return fountainString;
    } catch (err) {
      throw new AppError(
        `Fountain export failed: ${err instanceof Error ? err.message : String(err)}`,
        'EXPORT_FAILED',
        'Failed to export Fountain. Please try again.',
      );
    }
  }

  parseFountain(fountain: string): ScreenplayElement[] {
    return parseFountain(fountain);
  }

  parseFDX(fdx: string): ScreenplayElement[] {
    return parseFDX(fdx);
  }

  private assertPaidTier(feature: string): void {
    if (this.tier === 'free') {
      throw new AppError(
        `Feature "${feature}" requires a paid subscription`,
        'EXPORT_FAILED',
        `Exporting to this format requires a Writer or Pro subscription.`,
      );
    }
  }
}

function sanitizeFilename(title: string): string {
  return (title || 'Untitled').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Untitled';
}

function triggerDownload(blob: Blob, filename: string, _mimeType: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock jsPDF before importing the service
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockAddImage = vi.fn();

vi.mock('jspdf', () => {
  return {
    jsPDF: class MockJsPDF {
      save = mockSave;
      text = mockText;
      setFont = mockSetFont;
      setFontSize = mockSetFontSize;
      addImage = mockAddImage;
    },
  };
});

import { exportPNG, exportPDF } from './LightingExportService';

function createMockStage(width = 800, height = 600) {
  return {
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,FAKE'),
    width: vi.fn().mockReturnValue(width),
    height: vi.fn().mockReturnValue(height),
  } as unknown as import('konva').default.Stage;
}

describe('LightingExportService', () => {
  let appendSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = clickSpy;
      }
      return node;
    });
    removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.clearAllMocks();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  describe('exportPNG', () => {
    it('renders stage to data URL and triggers download', () => {
      const stage = createMockStage();
      exportPNG(stage, 'my-diagram');

      expect(stage.toDataURL).toHaveBeenCalledWith({ pixelRatio: 2 });
      expect(appendSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('appends .png extension when missing', () => {
      const stage = createMockStage();
      exportPNG(stage, 'diagram');

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.download).toBe('diagram.png');
    });

    it('does not double .png extension', () => {
      const stage = createMockStage();
      exportPNG(stage, 'diagram.png');

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.download).toBe('diagram.png');
    });
  });

  describe('exportPDF', () => {
    it('creates PDF with scene heading and embedded image', () => {
      const stage = createMockStage();
      exportPDF(stage, 'INT. OFFICE - DAY', 'lighting');

      expect(stage.toDataURL).toHaveBeenCalledWith({ pixelRatio: 2 });
      expect(mockSetFont).toHaveBeenCalledWith('Helvetica', 'bold');
      expect(mockSetFontSize).toHaveBeenCalledWith(18);
      expect(mockText).toHaveBeenCalledWith('INT. OFFICE - DAY', 40, 58);
      expect(mockAddImage).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalledWith('lighting.pdf');
    });

    it('uses fallback title when sceneHeading is empty', () => {
      const stage = createMockStage();
      exportPDF(stage, '', 'diagram');

      expect(mockText).toHaveBeenCalledWith('Lighting Diagram', 40, 58);
    });

    it('does not double .pdf extension', () => {
      const stage = createMockStage();
      exportPDF(stage, 'Scene 1', 'output.pdf');

      expect(mockSave).toHaveBeenCalledWith('output.pdf');
    });

    it('preserves aspect ratio when embedding image', () => {
      const stage = createMockStage(800, 600);
      exportPDF(stage, 'Scene', 'test');

      // addImage(dataUrl, format, x, y, width, height)
      const args = mockAddImage.mock.calls[0];
      const w = args[4] as number;
      const h = args[5] as number;
      // Image should fit within usable area
      expect(w).toBeLessThanOrEqual(532); // PAGE_WIDTH - 2*MARGIN
      expect(h).toBeLessThanOrEqual(678); // PAGE_HEIGHT - cursorY - MARGIN
      // Aspect ratio preserved
      expect(Math.abs(w / h - 800 / 600)).toBeLessThan(0.01);
    });
  });
});

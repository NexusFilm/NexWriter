import { describe, it, expect, vi } from 'vitest';

// Mock jsPDF before importing the service
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockRect = vi.fn();
const mockLine = vi.fn();
const mockAddPage = vi.fn();
const mockGetTextWidth = vi.fn().mockReturnValue(10);

vi.mock('jspdf', () => {
  return {
    jsPDF: class MockJsPDF {
      text = mockText;
      setFont = mockSetFont;
      setFontSize = mockSetFontSize;
      setFillColor = mockSetFillColor;
      setDrawColor = mockSetDrawColor;
      rect = mockRect;
      line = mockLine;
      addPage = mockAddPage;
      save = mockSave;
      getTextWidth = mockGetTextWidth;
    },
  };
});

import { exportShotListPDF } from './ShotListPDFService';
import type { ShotList, ShotEntry } from '@/types/productionTools';

function makeShotList(overrides: Partial<ShotList> = {}): ShotList {
  return {
    id: 'list-1',
    userId: 'user-1',
    scriptId: 'script-1',
    sceneHeading: null,
    title: 'Test Shot List',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeShotEntry(overrides: Partial<ShotEntry> = {}): ShotEntry {
  return {
    id: 'entry-1',
    shotListId: 'list-1',
    shotNumber: 1,
    shotType: 'wide',
    description: 'Establishing shot of the house',
    cameraAngle: 'Eye level',
    cameraMovement: 'Static',
    lens: '24mm',
    notes: 'Golden hour',
    referenceImagePath: null,
    shotOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ShotListPDFService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a PDF and triggers download with the shot list title as filename', () => {
    const shotList = makeShotList({ title: 'My Shot List' });
    const entries = [makeShotEntry()];

    exportShotListPDF(shotList, entries);

    expect(mockSave).toHaveBeenCalledWith('My_Shot_List.pdf');
  });

  it('renders the project title as header', () => {
    const shotList = makeShotList({ title: 'Action Sequence' });

    exportShotListPDF(shotList, []);

    expect(mockText).toHaveBeenCalledWith(
      'Action Sequence',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('renders the scene heading as subheader when present', () => {
    const shotList = makeShotList({ sceneHeading: 'INT. KITCHEN - NIGHT' });

    exportShotListPDF(shotList, []);

    expect(mockText).toHaveBeenCalledWith(
      'INT. KITCHEN - NIGHT',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('does not render scene heading when null', () => {
    const shotList = makeShotList({ sceneHeading: null });

    exportShotListPDF(shotList, []);

    const textCalls = mockText.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).not.toContain(null);
  });

  it('renders all shot entry fields in the table', () => {
    const entry = makeShotEntry({
      shotNumber: 3,
      shotType: 'close-up',
      description: 'Hero reaction',
      cameraAngle: 'Low angle',
      cameraMovement: 'Dolly in',
      lens: '85mm',
      notes: 'Dramatic',
    });

    exportShotListPDF(makeShotList(), [entry]);

    const textCalls = mockText.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('3');
    expect(textCalls).toContain('Close Up');
    expect(textCalls).toContain('Hero reaction');
    expect(textCalls).toContain('Low angle');
    expect(textCalls).toContain('Dolly in');
    expect(textCalls).toContain('85mm');
    expect(textCalls).toContain('Dramatic');
  });

  it('handles empty entries array without error', () => {
    expect(() => exportShotListPDF(makeShotList(), [])).not.toThrow();
    expect(mockSave).toHaveBeenCalled();
  });

  it('uses fallback filename when title is empty', () => {
    const shotList = makeShotList({ title: '' });

    exportShotListPDF(shotList, []);

    expect(mockSave).toHaveBeenCalledWith('shot-list.pdf');
  });

  it('sorts entries by shot number', () => {
    const entries = [
      makeShotEntry({ id: 'e2', shotNumber: 2, description: 'Second' }),
      makeShotEntry({ id: 'e1', shotNumber: 1, description: 'First' }),
    ];

    exportShotListPDF(makeShotList(), entries);

    const descCalls = mockText.mock.calls
      .map((c: unknown[]) => c[0])
      .filter((t: string) => t === 'First' || t === 'Second');
    expect(descCalls).toEqual(['First', 'Second']);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jsPDF before importing the service
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetDrawColor = vi.fn();
const mockLine = vi.fn();
const mockAddPage = vi.fn();
const mockAddImage = vi.fn();
const mockSplitTextToSize = vi.fn((text: string) => [text]);

vi.mock('jspdf', () => {
  return {
    jsPDF: class MockJsPDF {
      text = mockText;
      setFont = mockSetFont;
      setFontSize = mockSetFontSize;
      setDrawColor = mockSetDrawColor;
      line = mockLine;
      addPage = mockAddPage;
      save = mockSave;
      addImage = mockAddImage;
      splitTextToSize = mockSplitTextToSize;
    },
  };
});

import { exportAgreementPDF } from './AgreementPDFService';
import type { AgreementTemplate, AgreementInstance } from '@/types/productionTools';

function makeTemplate(overrides: Partial<AgreementTemplate> = {}): AgreementTemplate {
  return {
    id: 'tpl-1',
    userId: null,
    templateType: 'model_release',
    name: 'Model Release',
    fields: [
      { key: 'model_name', label: 'Model Name', type: 'text', required: true },
      { key: 'production_title', label: 'Production Title', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
    ],
    storagePath: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeInstance(overrides: Partial<AgreementInstance> = {}): AgreementInstance {
  return {
    id: 'inst-1',
    userId: 'user-1',
    templateId: 'tpl-1',
    fieldValues: {
      model_name: 'Jane Doe',
      production_title: 'My Film',
      date: '2024-06-15',
    },
    signaturePath: null,
    status: 'signed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('AgreementPDFService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a PDF and triggers download with the template name as filename', () => {
    exportAgreementPDF(makeTemplate(), makeInstance());

    expect(mockSave).toHaveBeenCalledWith('Model_Release.pdf');
  });

  it('renders the template name as header', () => {
    exportAgreementPDF(makeTemplate({ name: 'Location Release' }), makeInstance());

    expect(mockText).toHaveBeenCalledWith(
      'Location Release',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('renders all field labels and values', () => {
    exportAgreementPDF(makeTemplate(), makeInstance());

    const textCalls = mockText.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('Model Name:');
    expect(textCalls).toContain('Jane Doe');
    expect(textCalls).toContain('Production Title:');
    expect(textCalls).toContain('My Film');
    expect(textCalls).toContain('Date:');
    expect(textCalls).toContain('2024-06-15');
  });

  it('renders em dash for missing field values', () => {
    const instance = makeInstance({ fieldValues: {} });

    exportAgreementPDF(makeTemplate(), instance);

    const textCalls = mockText.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('—');
  });

  it('adds signature image when signatureDataUrl is provided', () => {
    const dataUrl = 'data:image/png;base64,abc123';

    exportAgreementPDF(makeTemplate(), makeInstance(), dataUrl);

    expect(mockAddImage).toHaveBeenCalledWith(
      dataUrl,
      'PNG',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('does not add signature image when signatureDataUrl is null', () => {
    exportAgreementPDF(makeTemplate(), makeInstance(), null);

    expect(mockAddImage).not.toHaveBeenCalled();
  });

  it('handles empty fields array without error', () => {
    const template = makeTemplate({ fields: [] });

    expect(() => exportAgreementPDF(template, makeInstance())).not.toThrow();
    expect(mockSave).toHaveBeenCalled();
  });

  it('uses fallback filename when template name is empty', () => {
    exportAgreementPDF(makeTemplate({ name: '' }), makeInstance());

    expect(mockSave).toHaveBeenCalledWith('agreement.pdf');
  });
});

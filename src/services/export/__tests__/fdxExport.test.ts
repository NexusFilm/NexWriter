import { describe, it, expect } from 'vitest';
import { exportFDX, parseFDX } from '../fdxExport';
import type { ScreenplayElement } from '@/types/screenplay';

describe('FDX Export', () => {
  const sampleElements: ScreenplayElement[] = [
    { id: '1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
    { id: '2', type: 'ACTION', text: 'John walks in.', order: 1 },
    { id: '3', type: 'CHARACTER', text: 'JOHN', order: 2 },
    { id: '4', type: 'DIALOGUE', text: 'Hello there.', order: 3 },
  ];

  it('exports valid XML with FinalDraft root', () => {
    const fdx = exportFDX(sampleElements);
    expect(fdx).toContain('<FinalDraft');
    expect(fdx).toContain('<Content>');
    expect(fdx).toContain('</FinalDraft>');
  });

  it('maps element types to FDX paragraph types', () => {
    const fdx = exportFDX(sampleElements);
    expect(fdx).toContain('Type="Scene Heading"');
    expect(fdx).toContain('Type="Action"');
    expect(fdx).toContain('Type="Character"');
    expect(fdx).toContain('Type="Dialogue"');
  });

  it('preserves element text in Text nodes', () => {
    const fdx = exportFDX(sampleElements);
    expect(fdx).toContain('INT. OFFICE - DAY');
    expect(fdx).toContain('John walks in.');
    expect(fdx).toContain('JOHN');
    expect(fdx).toContain('Hello there.');
  });

  it('exports empty array as valid XML', () => {
    const fdx = exportFDX([]);
    expect(fdx).toContain('<FinalDraft');
    expect(fdx).toContain('<Content/>');
  });
});

describe('FDX Parser', () => {
  it('round-trips sample elements', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
      { id: '2', type: 'ACTION', text: 'John walks in.', order: 1 },
      { id: '3', type: 'CHARACTER', text: 'JOHN', order: 2 },
      { id: '4', type: 'PARENTHETICAL', text: 'smiling', order: 3 },
      { id: '5', type: 'DIALOGUE', text: 'Hello there.', order: 4 },
      { id: '6', type: 'TRANSITION', text: 'CUT TO:', order: 5 },
    ];
    const fdx = exportFDX(elements);
    const parsed = parseFDX(fdx);
    expect(parsed).toEqual(elements);
  });

  it('handles TITLE_PAGE elements', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'TITLE_PAGE', text: 'My Screenplay', order: 0 },
    ];
    const fdx = exportFDX(elements);
    const parsed = parseFDX(fdx);
    expect(parsed).toEqual(elements);
  });

  it('returns empty array for empty content', () => {
    const fdx = exportFDX([]);
    const parsed = parseFDX(fdx);
    expect(parsed).toEqual([]);
  });
});

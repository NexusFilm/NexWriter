import { describe, it, expect } from 'vitest';
import { exportFountain, parseFountain } from '../fountainExport';
import type { ScreenplayElement } from '@/types/screenplay';

describe('Fountain Export', () => {
  it('exports scene headings with INT./EXT. as uppercase', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
    ];
    const result = exportFountain(elements);
    expect(result).toBe('INT. OFFICE - DAY');
  });

  it('exports scene headings without INT./EXT. with . prefix', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'SCENE_HEADING', text: 'THE BEACH', order: 0 },
    ];
    const result = exportFountain(elements);
    expect(result).toBe('.THE BEACH');
  });

  it('exports character names in uppercase', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'CHARACTER', text: 'JOHN', order: 0 },
      { id: '2', type: 'DIALOGUE', text: 'Hello.', order: 1 },
    ];
    const result = exportFountain(elements);
    expect(result).toContain('JOHN');
    expect(result).toContain('Hello.');
  });

  it('exports transitions with > prefix', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'TRANSITION', text: 'CUT TO:', order: 0 },
    ];
    const result = exportFountain(elements);
    expect(result).toBe('>CUT TO:');
  });

  it('exports parentheticals wrapped in parens', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'CHARACTER', text: 'JOHN', order: 0 },
      { id: '2', type: 'PARENTHETICAL', text: 'smiling', order: 1 },
      { id: '3', type: 'DIALOGUE', text: 'Hi.', order: 2 },
    ];
    const result = exportFountain(elements);
    expect(result).toContain('(smiling)');
  });

  it('does not double-wrap parentheticals already in parens', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'CHARACTER', text: 'JOHN', order: 0 },
      { id: '2', type: 'PARENTHETICAL', text: '(smiling)', order: 1 },
      { id: '3', type: 'DIALOGUE', text: 'Hi.', order: 2 },
    ];
    const result = exportFountain(elements);
    expect(result).toContain('(smiling)');
    expect(result).not.toContain('((smiling))');
  });

  it('exports title page elements with Title: prefix', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'TITLE_PAGE', text: 'My Script', order: 0 },
    ];
    const result = exportFountain(elements);
    expect(result).toBe('Title: My Script');
  });

  it('separates blocks with blank lines', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
      { id: '2', type: 'ACTION', text: 'John enters.', order: 1 },
    ];
    const result = exportFountain(elements);
    expect(result).toBe('INT. OFFICE - DAY\n\nJohn enters.');
  });

  it('does not add blank line between character and dialogue', () => {
    const elements: ScreenplayElement[] = [
      { id: '1', type: 'CHARACTER', text: 'JOHN', order: 0 },
      { id: '2', type: 'DIALOGUE', text: 'Hello.', order: 1 },
    ];
    const result = exportFountain(elements);
    expect(result).toBe('JOHN\nHello.');
  });
});

describe('Fountain Parser', () => {
  it('parses scene headings with INT./EXT.', () => {
    const result = parseFountain('INT. OFFICE - DAY');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('SCENE_HEADING');
    expect(result[0].text).toBe('INT. OFFICE - DAY');
  });

  it('parses forced scene headings with . prefix', () => {
    const result = parseFountain('.THE BEACH');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('SCENE_HEADING');
    expect(result[0].text).toBe('THE BEACH');
  });

  it('parses transitions with > prefix', () => {
    const result = parseFountain('>CUT TO:');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('TRANSITION');
    expect(result[0].text).toBe('CUT TO:');
  });

  it('parses character + dialogue blocks', () => {
    const result = parseFountain('JOHN\nHello there.');
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('CHARACTER');
    expect(result[0].text).toBe('JOHN');
    expect(result[1].type).toBe('DIALOGUE');
    expect(result[1].text).toBe('Hello there.');
  });

  it('parses parentheticals within dialogue blocks', () => {
    const result = parseFountain('JOHN\n(smiling)\nHello.');
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('CHARACTER');
    expect(result[1].type).toBe('PARENTHETICAL');
    expect(result[1].text).toBe('(smiling)');
    expect(result[2].type).toBe('DIALOGUE');
  });

  it('parses title page lines', () => {
    const result = parseFountain('Title: My Script');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('TITLE_PAGE');
    expect(result[0].text).toBe('My Script');
  });

  it('parses action as default', () => {
    const result = parseFountain('John walks into the room.');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('ACTION');
  });

  it('handles empty input', () => {
    const result = parseFountain('');
    expect(result).toHaveLength(0);
  });
});

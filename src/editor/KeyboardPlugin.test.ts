import { describe, it, expect } from 'vitest';
import {
  cycleElementType,
  getNextElementTypeOnEnter,
  ELEMENT_TYPE_CYCLE,
} from './KeyboardPlugin';
import type { ElementType } from '../types/screenplay';

describe('cycleElementType', () => {
  it('cycles SCENE_HEADING → ACTION', () => {
    expect(cycleElementType('SCENE_HEADING')).toBe('ACTION');
  });

  it('cycles ACTION → CHARACTER', () => {
    expect(cycleElementType('ACTION')).toBe('CHARACTER');
  });

  it('cycles CHARACTER → DIALOGUE', () => {
    expect(cycleElementType('CHARACTER')).toBe('DIALOGUE');
  });

  it('cycles DIALOGUE → PARENTHETICAL', () => {
    expect(cycleElementType('DIALOGUE')).toBe('PARENTHETICAL');
  });

  it('cycles PARENTHETICAL → TRANSITION', () => {
    expect(cycleElementType('PARENTHETICAL')).toBe('TRANSITION');
  });

  it('cycles TRANSITION → SCENE_HEADING (wraps around)', () => {
    expect(cycleElementType('TRANSITION')).toBe('SCENE_HEADING');
  });

  it('cycles TITLE_PAGE (not in cycle) → SCENE_HEADING', () => {
    expect(cycleElementType('TITLE_PAGE')).toBe('SCENE_HEADING');
  });

  it('returns to original type after 6 full cycles', () => {
    for (const startType of ELEMENT_TYPE_CYCLE) {
      let current: ElementType = startType;
      for (let i = 0; i < 6; i++) {
        current = cycleElementType(current);
      }
      expect(current).toBe(startType);
    }
  });
});

describe('getNextElementTypeOnEnter', () => {
  it('returns ACTION when block is empty (regardless of current type)', () => {
    const types: ElementType[] = [
      'SCENE_HEADING', 'ACTION', 'CHARACTER', 'DIALOGUE',
      'PARENTHETICAL', 'TRANSITION', 'TITLE_PAGE',
    ];
    for (const t of types) {
      expect(getNextElementTypeOnEnter(t, true)).toBe('ACTION');
    }
  });

  it('returns DIALOGUE after CHARACTER', () => {
    expect(getNextElementTypeOnEnter('CHARACTER', false)).toBe('DIALOGUE');
  });

  it('returns CHARACTER after DIALOGUE', () => {
    expect(getNextElementTypeOnEnter('DIALOGUE', false)).toBe('CHARACTER');
  });

  it('returns SCENE_HEADING after TRANSITION', () => {
    expect(getNextElementTypeOnEnter('TRANSITION', false)).toBe('SCENE_HEADING');
  });

  it('returns ACTION after ACTION', () => {
    expect(getNextElementTypeOnEnter('ACTION', false)).toBe('ACTION');
  });

  it('returns ACTION for SCENE_HEADING (default case)', () => {
    expect(getNextElementTypeOnEnter('SCENE_HEADING', false)).toBe('ACTION');
  });

  it('returns ACTION for PARENTHETICAL (default case)', () => {
    expect(getNextElementTypeOnEnter('PARENTHETICAL', false)).toBe('ACTION');
  });

  it('returns ACTION for TITLE_PAGE (default case)', () => {
    expect(getNextElementTypeOnEnter('TITLE_PAGE', false)).toBe('ACTION');
  });
});

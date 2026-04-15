import { describe, it, expect } from 'vitest';
import { renumberShots } from './renumberShots';
import type { ShotEntry } from '../types/productionTools';

function makeShotEntry(overrides: Partial<ShotEntry> = {}): ShotEntry {
  return {
    id: 'entry-1',
    shotListId: 'list-1',
    shotNumber: 99,
    shotType: 'wide',
    description: '',
    cameraAngle: '',
    cameraMovement: '',
    lens: '',
    notes: '',
    referenceImagePath: null,
    shotOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('renumberShots', () => {
  it('returns an empty array when given an empty array', () => {
    expect(renumberShots([])).toEqual([]);
  });

  it('assigns shotNumber 1 to a single entry', () => {
    const entries = [makeShotEntry({ shotNumber: 5 })];
    const result = renumberShots(entries);
    expect(result).toHaveLength(1);
    expect(result[0].shotNumber).toBe(1);
  });

  it('assigns sequential 1-based shotNumbers to multiple entries', () => {
    const entries = [
      makeShotEntry({ id: 'a', shotNumber: 10 }),
      makeShotEntry({ id: 'b', shotNumber: 20 }),
      makeShotEntry({ id: 'c', shotNumber: 30 }),
    ];
    const result = renumberShots(entries);
    expect(result.map((e) => e.shotNumber)).toEqual([1, 2, 3]);
  });

  it('preserves all other fields', () => {
    const entry = makeShotEntry({ id: 'x', description: 'hero shot', lens: '50mm' });
    const result = renumberShots([entry]);
    expect(result[0].id).toBe('x');
    expect(result[0].description).toBe('hero shot');
    expect(result[0].lens).toBe('50mm');
  });

  it('does not mutate the original array', () => {
    const entries = [makeShotEntry({ shotNumber: 7 })];
    renumberShots(entries);
    expect(entries[0].shotNumber).toBe(7);
  });
});

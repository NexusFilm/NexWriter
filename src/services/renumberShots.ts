import type { ShotEntry } from '../types/productionTools';

/**
 * Pure function: given an ordered array of shot entries, returns new entries
 * with shotNumber reassigned sequentially starting from 1.
 * Used after delete and drag-and-drop reorder operations.
 */
export function renumberShots(entries: ShotEntry[]): ShotEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    shotNumber: index + 1,
  }));
}

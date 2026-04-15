import { describe, it, expect, beforeEach } from 'vitest';
import { useShotListStore } from './shotListStore';
import type { ShotList, ShotEntry } from '@/types/productionTools';

const makeShotList = (overrides?: Partial<ShotList>): ShotList => ({
  id: 'list-1',
  userId: 'user-1',
  scriptId: 'script-1',
  sceneHeading: 'INT. OFFICE - DAY',
  title: 'Office Scene Shots',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeEntry = (overrides?: Partial<ShotEntry>): ShotEntry => ({
  id: 'entry-1',
  shotListId: 'list-1',
  shotNumber: 1,
  shotType: 'wide',
  description: 'Establishing shot',
  cameraAngle: 'eye level',
  cameraMovement: 'static',
  lens: '24mm',
  notes: '',
  referenceImagePath: null,
  shotOrder: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ShotListStore', () => {
  beforeEach(() => {
    useShotListStore.setState({
      currentList: null,
      entries: [],
      loading: false,
    });
  });

  it('starts with null currentList, empty entries, and loading false', () => {
    const state = useShotListStore.getState();
    expect(state.currentList).toBeNull();
    expect(state.entries).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('setCurrentList sets the current shot list', () => {
    const list = makeShotList();
    useShotListStore.getState().setCurrentList(list);
    expect(useShotListStore.getState().currentList).toEqual(list);
  });

  it('setEntries replaces all entries', () => {
    const entries = [
      makeEntry({ id: 'e1', shotOrder: 0 }),
      makeEntry({ id: 'e2', shotOrder: 1 }),
    ];
    useShotListStore.getState().setEntries(entries);
    expect(useShotListStore.getState().entries).toEqual(entries);
  });

  it('addEntry appends an entry', () => {
    const e1 = makeEntry({ id: 'e1' });
    const e2 = makeEntry({ id: 'e2', shotNumber: 2, shotOrder: 1 });

    useShotListStore.getState().addEntry(e1);
    useShotListStore.getState().addEntry(e2);

    const entries = useShotListStore.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe('e1');
    expect(entries[1].id).toBe('e2');
  });

  it('updateEntry merges updates into the matching entry', () => {
    const e1 = makeEntry({ id: 'e1', description: 'Original' });
    useShotListStore.getState().setEntries([e1]);

    useShotListStore.getState().updateEntry('e1', { description: 'Updated', lens: '50mm' });

    const updated = useShotListStore.getState().entries[0];
    expect(updated.description).toBe('Updated');
    expect(updated.lens).toBe('50mm');
    expect(updated.id).toBe('e1');
  });

  it('updateEntry does not affect other entries', () => {
    const e1 = makeEntry({ id: 'e1', description: 'First' });
    const e2 = makeEntry({ id: 'e2', description: 'Second' });
    useShotListStore.getState().setEntries([e1, e2]);

    useShotListStore.getState().updateEntry('e1', { description: 'Changed' });

    const entries = useShotListStore.getState().entries;
    expect(entries[0].description).toBe('Changed');
    expect(entries[1].description).toBe('Second');
  });

  it('removeEntry removes the matching entry', () => {
    const entries = [
      makeEntry({ id: 'e1' }),
      makeEntry({ id: 'e2' }),
      makeEntry({ id: 'e3' }),
    ];
    useShotListStore.getState().setEntries(entries);

    useShotListStore.getState().removeEntry('e2');

    const remaining = useShotListStore.getState().entries;
    expect(remaining).toHaveLength(2);
    expect(remaining.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('removeEntry with non-existent id does not change entries', () => {
    const entries = [makeEntry({ id: 'e1' })];
    useShotListStore.getState().setEntries(entries);

    useShotListStore.getState().removeEntry('non-existent');

    expect(useShotListStore.getState().entries).toHaveLength(1);
  });

  it('reorderEntries reorders entries by the given id order and updates shotOrder', () => {
    const entries = [
      makeEntry({ id: 'e1', shotOrder: 0 }),
      makeEntry({ id: 'e2', shotOrder: 1 }),
      makeEntry({ id: 'e3', shotOrder: 2 }),
    ];
    useShotListStore.getState().setEntries(entries);

    useShotListStore.getState().reorderEntries(['e3', 'e1', 'e2']);

    const reordered = useShotListStore.getState().entries;
    expect(reordered.map((e) => e.id)).toEqual(['e3', 'e1', 'e2']);
    expect(reordered[0].shotOrder).toBe(0);
    expect(reordered[1].shotOrder).toBe(1);
    expect(reordered[2].shotOrder).toBe(2);
  });

  it('reorderEntries ignores ids not present in entries', () => {
    const entries = [
      makeEntry({ id: 'e1', shotOrder: 0 }),
      makeEntry({ id: 'e2', shotOrder: 1 }),
    ];
    useShotListStore.getState().setEntries(entries);

    useShotListStore.getState().reorderEntries(['e2', 'non-existent', 'e1']);

    const reordered = useShotListStore.getState().entries;
    expect(reordered.map((e) => e.id)).toEqual(['e2', 'e1']);
    expect(reordered[0].shotOrder).toBe(0);
    expect(reordered[1].shotOrder).toBe(1);
  });
});

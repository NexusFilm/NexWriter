import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutosaveManager, resolveConflictPure } from './AutosaveManager';
import type { ScreenplayElement, Script, ScriptVersion } from '@/types/screenplay';
import type { IScriptRepository } from '@/types/repositories';
import type { Tier } from '@/types/subscription';

// --- Helpers ---

function makeElement(overrides: Partial<ScreenplayElement> = {}): ScreenplayElement {
  return {
    id: 'el-1',
    type: 'ACTION',
    text: 'Hello world',
    order: 0,
    ...overrides,
  };
}

function makeScript(overrides: Partial<Script> = {}): Script {
  return {
    id: 'script-1',
    userId: 'user-1',
    title: 'Test Script',
    elements: [makeElement()],
    pageCount: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

function createMockRepo(): IScriptRepository {
  return {
    getScripts: vi.fn(),
    getScript: vi.fn().mockResolvedValue(makeScript()),
    createScript: vi.fn(),
    updateScript: vi.fn().mockResolvedValue(undefined),
    duplicateScript: vi.fn(),
    deleteScript: vi.fn(),
    getVersions: vi.fn(),
    createVersion: vi.fn().mockResolvedValue({
      id: 'v-1',
      scriptId: 'script-1',
      elements: [],
      createdAt: '2024-01-01T12:00:00Z',
    } as ScriptVersion),
    restoreVersion: vi.fn(),
  };
}

// --- localStorage mock ---

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

// --- Tests ---

describe('resolveConflictPure', () => {
  const localElements = [makeElement({ id: 'local', text: 'local' })];
  const cloudElements = [makeElement({ id: 'cloud', text: 'cloud' })];

  it('returns local elements when local timestamp is greater', () => {
    const result = resolveConflictPure(localElements, 2000, cloudElements, 1000);
    expect(result).toBe(localElements);
  });

  it('returns cloud elements when cloud timestamp is greater', () => {
    const result = resolveConflictPure(localElements, 1000, cloudElements, 2000);
    expect(result).toBe(cloudElements);
  });

  it('returns cloud elements on tie (cloud preferred)', () => {
    const result = resolveConflictPure(localElements, 1000, cloudElements, 1000);
    expect(result).toBe(cloudElements);
  });
});

describe('AutosaveManager', () => {
  let repo: IScriptRepository;
  let tier: Tier;
  let statusChanges: string[];
  let offlineCalled: boolean;
  let manager: AutosaveManager;
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.useFakeTimers();
    storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true, configurable: true });
    repo = createMockRepo();
    tier = 'writer';
    statusChanges = [];
    offlineCalled = false;
    manager = new AutosaveManager(
      repo,
      () => tier,
      (status) => statusChanges.push(status),
      () => { offlineCalled = true; },
    );
  });

  afterEach(() => {
    manager.stop();
    vi.useRealTimers();
  });

  describe('Layer 1: localStorage with debounce', () => {
    it('saves to localStorage after 1500ms debounce', () => {
      manager.start('script-1');
      const elements = [makeElement()];
      manager.onContentChange(elements);

      // Not saved yet
      expect(storageMock._store['draftkit:draft:script-1']).toBeUndefined();

      vi.advanceTimersByTime(1500);

      const stored = JSON.parse(storageMock._store['draftkit:draft:script-1']);
      expect(stored.elements).toEqual(elements);
      expect(typeof stored.timestamp).toBe('number');
    });

    it('resets debounce timer on subsequent changes', () => {
      manager.start('script-1');
      manager.onContentChange([makeElement({ text: 'first' })]);

      vi.advanceTimersByTime(1000);
      expect(storageMock._store['draftkit:draft:script-1']).toBeUndefined();

      const secondElements = [makeElement({ text: 'second' })];
      manager.onContentChange(secondElements);

      vi.advanceTimersByTime(1000);
      // Still not saved (only 1000ms since last change)
      expect(storageMock._store['draftkit:draft:script-1']).toBeUndefined();

      vi.advanceTimersByTime(500);
      const stored = JSON.parse(storageMock._store['draftkit:draft:script-1']);
      expect(stored.elements).toEqual(secondElements);
    });

    it('sets status to unsaved on content change, saved after debounce', () => {
      manager.start('script-1');
      manager.onContentChange([makeElement()]);
      expect(statusChanges).toContain('unsaved');

      vi.advanceTimersByTime(1500);
      expect(statusChanges[statusChanges.length - 1]).toBe('saved');
    });

    it('logs warning on localStorage failure (does not throw)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      storageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      manager.start('script-1');
      manager.onContentChange([makeElement()]);
      vi.advanceTimersByTime(1500);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Layer 2: Cloud sync', () => {
    it('syncs to Supabase every 45s for paid tiers', async () => {
      manager.start('script-1');
      const elements = [makeElement()];
      manager.onContentChange(elements);
      vi.advanceTimersByTime(1500); // flush debounce

      // Advance to 45s
      await vi.advanceTimersByTimeAsync(45_000);

      expect(repo.updateScript).toHaveBeenCalledWith('script-1', { elements });
    });

    it('syncs to cloud for free tier too', async () => {
      tier = 'free';
      manager.start('script-1');
      const elements = [makeElement()];
      manager.onContentChange(elements);
      vi.advanceTimersByTime(1500);

      await vi.advanceTimersByTimeAsync(45_000);

      expect(repo.updateScript).toHaveBeenCalledWith('script-1', { elements });
    });

    it('retries with exponential backoff on failure then calls onOffline', async () => {
      (repo.updateScript as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

      manager.start('script-1');
      manager.onContentChange([makeElement()]);
      vi.advanceTimersByTime(1500);

      // Trigger cloud sync at 45s
      await vi.advanceTimersByTimeAsync(45_000);
      // 1st retry delay: 1s
      await vi.advanceTimersByTimeAsync(1000);
      // 2nd retry delay: 2s
      await vi.advanceTimersByTimeAsync(2000);
      // 3rd retry delay: 4s
      await vi.advanceTimersByTimeAsync(4000);

      expect(repo.updateScript).toHaveBeenCalledTimes(3);
      expect(offlineCalled).toBe(true);
    });
  });

  describe('Layer 3: Version snapshots', () => {
    it('creates version snapshot every 10 minutes', async () => {
      manager.start('script-1');
      manager.onContentChange([makeElement()]);
      vi.advanceTimersByTime(1500);

      await vi.advanceTimersByTimeAsync(600_000);

      expect(repo.createVersion).toHaveBeenCalledWith('script-1', [makeElement()]);
    });

    it('skips on failure without throwing', async () => {
      (repo.createVersion as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

      manager.start('script-1');
      manager.onContentChange([makeElement()]);
      vi.advanceTimersByTime(1500);

      // Should not throw
      await vi.advanceTimersByTimeAsync(600_000);

      expect(repo.createVersion).toHaveBeenCalledTimes(1);
    });
  });

  describe('start / stop', () => {
    it('clears timers and flushes pending debounce on stop', () => {
      manager.start('script-1');
      manager.onContentChange([makeElement({ text: 'pending' })]);

      // Stop before debounce fires — should flush
      manager.stop();

      const stored = JSON.parse(storageMock._store['draftkit:draft:script-1']);
      expect(stored.elements[0].text).toBe('pending');
    });

    it('resets state on start (clears previous timers)', async () => {
      manager.start('script-1');
      manager.onContentChange([makeElement()]);
      vi.advanceTimersByTime(1500);

      // Start with a new script
      manager.start('script-2');
      manager.onContentChange([makeElement({ text: 'new' })]);
      vi.advanceTimersByTime(1500);

      expect(storageMock._store['draftkit:draft:script-2']).toBeDefined();
    });
  });

  describe('getLocalDraft', () => {
    it('returns parsed draft from localStorage', () => {
      const elements = [makeElement()];
      storageMock._store['draftkit:draft:script-1'] = JSON.stringify({ elements, timestamp: 12345 });

      const draft = manager.getLocalDraft('script-1');
      expect(draft).toEqual({ elements, timestamp: 12345 });
    });

    it('returns null when no draft exists', () => {
      expect(manager.getLocalDraft('nonexistent')).toBeNull();
    });

    it('returns null on malformed JSON', () => {
      storageMock._store['draftkit:draft:script-1'] = 'not-json';
      expect(manager.getLocalDraft('script-1')).toBeNull();
    });

    it('returns null when stored data is missing required fields', () => {
      storageMock._store['draftkit:draft:script-1'] = JSON.stringify({ foo: 'bar' });
      expect(manager.getLocalDraft('script-1')).toBeNull();
    });
  });

  describe('resolveConflict', () => {
    it('returns cloud elements when no local draft exists', async () => {
      const cloudScript = makeScript({ elements: [makeElement({ text: 'cloud' })] });
      (repo.getScript as ReturnType<typeof vi.fn>).mockResolvedValue(cloudScript);

      const result = await manager.resolveConflict('script-1');
      expect(result).toEqual(cloudScript.elements);
    });

    it('returns local elements when local is newer', async () => {
      const localElements = [makeElement({ text: 'local' })];
      const cloudTime = new Date('2024-01-01T12:00:00Z').getTime();
      storageMock._store['draftkit:draft:script-1'] = JSON.stringify({
        elements: localElements,
        timestamp: cloudTime + 1000,
      });

      const result = await manager.resolveConflict('script-1');
      expect(result).toEqual(localElements);
    });

    it('returns cloud elements when timestamps are equal', async () => {
      const cloudScript = makeScript({
        updatedAt: '2024-06-01T00:00:00Z',
        elements: [makeElement({ text: 'cloud' })],
      });
      (repo.getScript as ReturnType<typeof vi.fn>).mockResolvedValue(cloudScript);

      const cloudTime = new Date('2024-06-01T00:00:00Z').getTime();
      storageMock._store['draftkit:draft:script-1'] = JSON.stringify({
        elements: [makeElement({ text: 'local' })],
        timestamp: cloudTime,
      });

      const result = await manager.resolveConflict('script-1');
      expect(result).toEqual(cloudScript.elements);
    });
  });
});

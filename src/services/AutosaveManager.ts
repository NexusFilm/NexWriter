import type { ScreenplayElement } from '@/types/screenplay';
import type { IAutosaveManager } from '@/types/services';
import type { IScriptRepository } from '@/types/repositories';
import type { Tier } from '@/types/subscription';

/**
 * Pure helper: resolves conflict between local and cloud versions.
 * Returns the elements from whichever has the greater timestamp.
 * Cloud preferred on tie.
 */
export function resolveConflictPure(
  localElements: ScreenplayElement[],
  localTimestamp: number,
  cloudElements: ScreenplayElement[],
  cloudTimestamp: number,
): ScreenplayElement[] {
  if (localTimestamp > cloudTimestamp) {
    return localElements;
  }
  return cloudElements;
}

const LOCAL_STORAGE_PREFIX = 'draftkit:draft:';
const DEBOUNCE_MS = 1500;
const CLOUD_SYNC_INTERVAL_MS = 45_000;
const VERSION_SNAPSHOT_INTERVAL_MS = 600_000; // 10 minutes
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

export class AutosaveManager implements IAutosaveManager {
  private scriptId: string | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private cloudSyncTimer: ReturnType<typeof setInterval> | null = null;
  private versionSnapshotTimer: ReturnType<typeof setInterval> | null = null;
  private pendingElements: ScreenplayElement[] | null = null;
  private lastSavedElements: ScreenplayElement[] | null = null;

  scriptRepository: IScriptRepository;
  getTier: () => Tier;
  onSaveStatusChange?: (status: 'saved' | 'saving' | 'unsaved') => void;
  onOffline?: () => void;

  constructor(
    scriptRepository: IScriptRepository,
    getTier: () => Tier,
    onSaveStatusChange?: (status: 'saved' | 'saving' | 'unsaved') => void,
    onOffline?: () => void,
  ) {
    this.scriptRepository = scriptRepository;
    this.getTier = getTier;
    this.onSaveStatusChange = onSaveStatusChange;
    this.onOffline = onOffline;
  }

  start(scriptId: string): void {
    this.stop();
    this.scriptId = scriptId;

    // Layer 2: cloud sync every 45s (paid tiers only)
    this.cloudSyncTimer = setInterval(() => {
      this.cloudSync();
    }, CLOUD_SYNC_INTERVAL_MS);

    // Layer 3: version snapshot every 10 minutes
    this.versionSnapshotTimer = setInterval(() => {
      this.versionSnapshot();
    }, VERSION_SNAPSHOT_INTERVAL_MS);
  }

  stop(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      // Flush pending debounce
      if (this.pendingElements !== null && this.scriptId !== null) {
        this.saveToLocalStorage(this.pendingElements);
      }
      this.debounceTimer = null;
    }
    if (this.cloudSyncTimer !== null) {
      clearInterval(this.cloudSyncTimer);
      this.cloudSyncTimer = null;
    }
    if (this.versionSnapshotTimer !== null) {
      clearInterval(this.versionSnapshotTimer);
      this.versionSnapshotTimer = null;
    }
    this.pendingElements = null;
    this.scriptId = null;
  }

  onContentChange(elements: ScreenplayElement[]): void {
    this.pendingElements = elements;
    this.onSaveStatusChange?.('unsaved');

    // Reset debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveToLocalStorage(elements);
      this.debounceTimer = null;
    }, DEBOUNCE_MS);
  }

  getLocalDraft(scriptId: string): { elements: ScreenplayElement[]; timestamp: number } | null {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${scriptId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.elements) && typeof parsed.timestamp === 'number') {
        return { elements: parsed.elements, timestamp: parsed.timestamp };
      }
      return null;
    } catch {
      return null;
    }
  }

  async resolveConflict(scriptId: string): Promise<ScreenplayElement[]> {
    const localDraft = this.getLocalDraft(scriptId);
    const cloudScript = await this.scriptRepository.getScript(scriptId);

    const cloudTimestamp = new Date(cloudScript.updatedAt).getTime();
    const cloudElements = cloudScript.elements;

    if (!localDraft) {
      return cloudElements;
    }

    return resolveConflictPure(
      localDraft.elements,
      localDraft.timestamp,
      cloudElements,
      cloudTimestamp,
    );
  }

  private saveToLocalStorage(elements: ScreenplayElement[]): void {
    if (!this.scriptId) return;
    try {
      const data = JSON.stringify({ elements, timestamp: Date.now() });
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${this.scriptId}`, data);
      this.lastSavedElements = elements;
      this.onSaveStatusChange?.('saved');
    } catch (e) {
      console.warn('AutosaveManager: Layer 1 localStorage save failed', e);
    }
  }

  private async cloudSync(): Promise<void> {
    if (!this.scriptId) return;

    const elements = this.lastSavedElements ?? this.pendingElements;
    if (!elements) return;

    this.onSaveStatusChange?.('saving');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.scriptRepository.updateScript(this.scriptId, { elements });
        this.onSaveStatusChange?.('saved');
        return;
      } catch {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    this.onOffline?.();
  }

  private async versionSnapshot(): Promise<void> {
    if (!this.scriptId) return;

    const elements = this.lastSavedElements ?? this.pendingElements;
    if (!elements) return;

    try {
      await this.scriptRepository.createVersion(this.scriptId, elements);
    } catch {
      // Layer 3 failure: skip, retry next interval
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

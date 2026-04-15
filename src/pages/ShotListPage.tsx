import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useShotListStore } from '@/stores/shotListStore';
import { ShotListRepository } from '@/repositories/ShotListRepository';
import { ScriptRepository } from '@/repositories/ScriptRepository';
import { renumberShots } from '@/services/renumberShots';
import { parseScenes, type ParsedScene } from '@/services/SceneParser';
import { ShotListToolbar } from '@/components/shotlist/ShotListToolbar';
import { ShotEntryTable } from '@/components/shotlist/ShotEntryTable';
import { ShotEntryCard } from '@/components/shotlist/ShotEntryCard';
import type { ShotEntry, ShotType } from '@/types/productionTools';
import styles from './ShotListPage.module.css';

const shotListRepo = new ShotListRepository();
const scriptRepo = new ScriptRepository();

export function ShotListPage() {
  const { scriptId } = useParams<{ scriptId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const currentList = useShotListStore((s) => s.currentList);
  const entries = useShotListStore((s) => s.entries);
  const setCurrentList = useShotListStore((s) => s.setCurrentList);
  const setEntries = useShotListStore((s) => s.setEntries);
  const addEntry = useShotListStore((s) => s.addEntry);
  const updateEntry = useShotListStore((s) => s.updateEntry);
  const removeEntry = useShotListStore((s) => s.removeEntry);
  const reorderEntries = useShotListStore((s) => s.reorderEntries);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<ParsedScene[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);

  // Read ?scene= query param on mount
  const initialScene = useMemo(() => {
    const param = searchParams.get('scene');
    return param ? Number(param) : null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load screenplay scenes on mount
  useEffect(() => {
    if (!scriptId) return;
    let cancelled = false;

    async function loadScenes() {
      try {
        const script = await scriptRepo.getScript(scriptId!);
        if (cancelled) return;
        const parsed = parseScenes(script.elements ?? []);
        setScenes(parsed);

        // Auto-select scene from URL param
        if (initialScene !== null && parsed.some((s) => s.index === initialScene)) {
          setSelectedSceneIndex(initialScene);
        }
      } catch {
        // Scenes failed to load — non-fatal, toolbar will be empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadScenes();
    return () => { cancelled = true; };
  }, [scriptId, initialScene]);

  // Load or create shot list when scene selection changes
  useEffect(() => {
    if (!user || !scriptId || selectedSceneIndex === null) {
      setCurrentList(null);
      setEntries([]);
      return;
    }

    const scene = scenes.find((s) => s.index === selectedSceneIndex);
    if (!scene) return;

    let cancelled = false;

    async function loadOrCreateList() {
      try {
        const lists = await shotListRepo.getShotLists(user!.id, scriptId);
        if (cancelled) return;

        const existing = lists.find((l) => l.sceneHeading === scene!.text);
        if (existing) {
          setCurrentList(existing);
          const shotEntries = await shotListRepo.getShotEntries(existing.id);
          if (!cancelled) setEntries(shotEntries);
        } else {
          // Create a new shot list for this scene
          const newList = await shotListRepo.createShotList({
            userId: user!.id,
            scriptId: scriptId!,
            sceneHeading: scene!.text,
            title: `Shot List — Scene ${scene!.index}: ${scene!.text}`,
          });
          if (!cancelled) {
            setCurrentList(newList);
            setEntries([]);
          }
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load shot list');
        }
      }
    }

    loadOrCreateList();
    return () => { cancelled = true; };
  }, [user, scriptId, selectedSceneIndex, scenes, setCurrentList, setEntries]);

  const handleSceneChange = useCallback((sceneIndex: number | null) => {
    setSelectedSceneIndex(sceneIndex);
    if (sceneIndex !== null) {
      setSearchParams({ scene: String(sceneIndex) });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  const handleAddEntry = useCallback(async () => {
    if (!currentList) return;
    const nextNumber = entries.length + 1;
    try {
      const newEntry = await shotListRepo.insertShotEntry({
        shotListId: currentList.id,
        shotNumber: nextNumber,
        shotType: 'wide' as ShotType,
        description: '',
        cameraAngle: '',
        cameraMovement: '',
        lens: '',
        cameraDesignation: '',
        notes: '',
        referenceImagePath: null,
        shotOrder: entries.length,
      });
      addEntry(newEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shot');
    }
  }, [currentList, entries.length, addEntry]);

  const handleUpdateEntry = useCallback(
    async (id: string, updates: Partial<ShotEntry>) => {
      updateEntry(id, updates);
      try {
        await shotListRepo.updateShotEntry(id, updates);
      } catch {
        // Optimistic update — silently fail on persist error
      }
    },
    [updateEntry],
  );

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      removeEntry(id);
      try {
        await shotListRepo.deleteShotEntry(id);
      } catch {
        // Entry already removed from UI
      }
      // Renumber remaining entries
      const remaining = entries.filter((e) => e.id !== id);
      const renumbered = renumberShots(remaining);
      setEntries(renumbered);
      // Persist renumbered order
      if (currentList) {
        shotListRepo.reorderShotEntries(
          currentList.id,
          renumbered.map((e) => e.id),
        ).catch(() => {});
      }
    },
    [entries, removeEntry, setEntries, currentList],
  );

  const handleReorder = useCallback(
    async (orderedIds: string[]) => {
      reorderEntries(orderedIds);
      const reordered = orderedIds
        .map((id) => entries.find((e) => e.id === id))
        .filter(Boolean) as ShotEntry[];
      const renumbered = renumberShots(reordered);
      setEntries(renumbered);
      if (currentList) {
        try {
          await shotListRepo.reorderShotEntries(currentList.id, orderedIds);
        } catch {
          // Silently fail
        }
      }
    },
    [entries, reorderEntries, setEntries, currentList],
  );

  const handleExportPDF = useCallback(() => {
    // PDF export placeholder
  }, []);

  const selectedScene = scenes.find((s) => s.index === selectedSceneIndex);

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to={`/editor/${scriptId}`} className={styles.backLink}>
          ← Back to Editor
        </Link>
        <h1 className={styles.title}>Shot List</h1>
      </div>

      {selectedScene && (
        <div className={styles.sceneLabel}>
          Scene {selectedScene.index}: {selectedScene.text}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <ShotListToolbar
        scenes={scenes}
        selectedSceneIndex={selectedSceneIndex}
        onSceneChange={handleSceneChange}
        onExportPDF={handleExportPDF}
        onAddEntry={handleAddEntry}
      />

      {selectedSceneIndex === null ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎬</div>
          <p className={styles.emptyText}>
            Select a scene above to start planning your shots.
          </p>
        </div>
      ) : !currentList || entries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <p className={styles.emptyText}>
            No shots yet. Click "+ Add Shot" to add your first entry.
          </p>
        </div>
      ) : (
        <>
          <ShotEntryTable
            entries={entries}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onReorder={handleReorder}
          />
          <ShotEntryCard
            entries={entries}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onReorder={handleReorder}
          />
        </>
      )}
    </div>
  );
}

import { useCallback, useRef, useState } from 'react';
import type { ShotEntry, ShotType } from '@/types/productionTools';
import { ShotTypeSelect } from './ShotTypeSelect';
import { CameraSelect } from './CameraSelect';
import { MovementSelect } from './MovementSelect';
import styles from './ShotListPage.module.css';

interface ShotEntryCardProps {
  entries: ShotEntry[];
  onUpdateEntry: (id: string, updates: Partial<ShotEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function ShotEntryCard({
  entries,
  onUpdateEntry,
  onDeleteEntry,
  onReorder,
}: ShotEntryCardProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIdx === null || dragOverIdx.current === null || dragIdx === dragOverIdx.current) {
      setDragIdx(null);
      return;
    }
    const ids = entries.map((en) => en.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(dragOverIdx.current, 0, moved);
    onReorder(ids);
    setDragIdx(null);
    dragOverIdx.current = null;
  }, [dragIdx, entries, onReorder]);

  const handleBlur = useCallback(
    (id: string, field: keyof ShotEntry, value: string) => {
      onUpdateEntry(id, { [field]: value });
    },
    [onUpdateEntry],
  );

  return (
    <div className={styles.cardList}>
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          className={`${styles.card} ${dragIdx === idx ? styles.cardDragging : ''}`}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={handleDrop}
          onDragEnd={() => setDragIdx(null)}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardShotNum}>Shot {entry.shotNumber}</span>
            <div className={styles.cardActions}>
              <span className={styles.dragHandle} aria-label="Drag to reorder">⠿</span>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => onDeleteEntry(entry.id)}
                aria-label="Delete shot"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.cardField}>
            <label className={styles.cardLabel}>Type</label>
            <ShotTypeSelect
              value={entry.shotType}
              onChange={(v: ShotType) => onUpdateEntry(entry.id, { shotType: v })}
            />
          </div>

          <div className={styles.cardField}>
            <label className={styles.cardLabel}>Camera</label>
            <CameraSelect
              value={entry.cameraDesignation}
              onChange={(v) => onUpdateEntry(entry.id, { cameraDesignation: v })}
            />
          </div>

          <div className={styles.cardField}>
            <label className={styles.cardLabel}>Description</label>
            <input
              className={styles.cardInput}
              defaultValue={entry.description}
              onBlur={(e) => handleBlur(entry.id, 'description', e.target.value)}
            />
          </div>

          <div className={styles.cardField}>
            <label className={styles.cardLabel}>Movement</label>
            <MovementSelect
              value={entry.cameraMovement}
              onChange={(v) => onUpdateEntry(entry.id, { cameraMovement: v })}
            />
          </div>

          <div className={styles.cardField}>
            <label className={styles.cardLabel}>Lens</label>
            <input
              className={styles.cardInput}
              defaultValue={entry.lens}
              onBlur={(e) => handleBlur(entry.id, 'lens', e.target.value)}
              placeholder="e.g. 50mm"
            />
          </div>

          <div className={styles.cardField}>
            <label className={styles.cardLabel}>Notes</label>
            <input
              className={styles.cardInput}
              defaultValue={entry.notes}
              onBlur={(e) => handleBlur(entry.id, 'notes', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

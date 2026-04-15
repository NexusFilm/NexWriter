import { useCallback, useRef, useState } from 'react';
import type { ShotEntry, ShotType } from '@/types/productionTools';
import { ShotTypeSelect } from './ShotTypeSelect';
import { CameraSelect } from './CameraSelect';
import { MovementSelect } from './MovementSelect';
import styles from './ShotListPage.module.css';

interface ShotEntryTableProps {
  entries: ShotEntry[];
  onUpdateEntry: (id: string, updates: Partial<ShotEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function ShotEntryTable({
  entries,
  onUpdateEntry,
  onDeleteEntry,
  onReorder,
}: ShotEntryTableProps) {
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
    const ids = entries.map((e) => e.id);
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
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>#</th>
            <th>Type</th>
            <th>Camera</th>
            <th>Description</th>
            <th>Movement</th>
            <th>Lens</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr
              key={entry.id}
              className={dragIdx === idx ? styles.tableRowDragging : styles.tableRow}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              onDragEnd={() => setDragIdx(null)}
            >
              <td>
                <span className={styles.dragHandle} aria-label="Drag to reorder">⠿</span>
              </td>
              <td>
                <span className={styles.shotNumber}>{entry.shotNumber}</span>
              </td>
              <td>
                <ShotTypeSelect
                  value={entry.shotType}
                  onChange={(v: ShotType) => onUpdateEntry(entry.id, { shotType: v })}
                />
              </td>
              <td>
                <CameraSelect
                  value={entry.cameraDesignation}
                  onChange={(v) => onUpdateEntry(entry.id, { cameraDesignation: v })}
                />
              </td>
              <td>
                <input
                  className={styles.inlineInput}
                  defaultValue={entry.description}
                  onBlur={(e) => handleBlur(entry.id, 'description', e.target.value)}
                  aria-label="Description"
                />
              </td>
              <td>
                <MovementSelect
                  value={entry.cameraMovement}
                  onChange={(v) => onUpdateEntry(entry.id, { cameraMovement: v })}
                />
              </td>
              <td>
                <input
                  className={styles.inlineInput}
                  defaultValue={entry.lens}
                  onBlur={(e) => handleBlur(entry.id, 'lens', e.target.value)}
                  aria-label="Lens"
                  placeholder="e.g. 50mm"
                />
              </td>
              <td>
                <input
                  className={styles.inlineInput}
                  defaultValue={entry.notes}
                  onBlur={(e) => handleBlur(entry.id, 'notes', e.target.value)}
                  aria-label="Notes"
                />
              </td>
              <td>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label="Delete shot"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

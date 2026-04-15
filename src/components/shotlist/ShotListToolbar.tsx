import type { ParsedScene } from '@/services/SceneParser';
import styles from './ShotListPage.module.css';

interface ShotListToolbarProps {
  scenes: ParsedScene[];
  selectedSceneIndex: number | null;
  onSceneChange: (sceneIndex: number | null) => void;
  onExportPDF: () => void;
  onAddEntry: () => void;
}

export function ShotListToolbar({
  scenes,
  selectedSceneIndex,
  onSceneChange,
  onExportPDF,
  onAddEntry,
}: ShotListToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <select
        className={styles.sceneSelect}
        value={selectedSceneIndex ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onSceneChange(val === '' ? null : Number(val));
        }}
        aria-label="Select scene"
      >
        <option value="">— Select a scene —</option>
        {scenes.map((s) => (
          <option key={s.index} value={s.index}>
            Scene {s.index}: {s.text || 'Untitled'}
          </option>
        ))}
      </select>
      <div className={styles.toolbarActions}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onExportPDF}
          aria-label="Export shot list as PDF"
        >
          Export PDF
        </button>
        <button
          type="button"
          className={styles.toolbarBtnPrimary}
          onClick={onAddEntry}
          disabled={selectedSceneIndex === null}
        >
          + Add Shot
        </button>
      </div>
    </div>
  );
}

import type { ParsedScene } from '@/services/SceneParser';
import styles from './ScenePanel.module.css';

interface ScenePanelProps {
  scenes: ParsedScene[];
  onSceneClick: (elementId: string) => void;
}

export function ScenePanel({ scenes, onSceneClick }: ScenePanelProps) {
  if (scenes.length === 0) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.heading}>Scenes</h3>
        <p className={styles.empty}>No scenes yet</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Scenes</h3>
      <ol className={styles.list}>
        {scenes.map((scene) => (
          <li key={scene.elementId}>
            <button
              className={styles.entry}
              onClick={() => onSceneClick(scene.elementId)}
              type="button"
            >
              <span className={styles.index}>{scene.index}.</span>
              <span className={styles.text}>{scene.text || 'Untitled scene'}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

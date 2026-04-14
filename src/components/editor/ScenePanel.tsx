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
        <p className={styles.empty}>No scenes yet. Add a Scene Heading to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Scenes</h3>
      <div className={styles.list}>
        {scenes.map((scene) => (
          <button
            key={scene.elementId}
            className={styles.card}
            onClick={() => onSceneClick(scene.elementId)}
            type="button"
          >
            <div className={styles.cardHeader}>
              <span className={styles.index}>{scene.index}</span>
              <span className={styles.cardTitle}>{scene.text || 'Untitled scene'}</span>
            </div>
            {scene.preview && (
              <p className={styles.cardPreview}>{scene.preview}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { ParsedScene } from '@/services/SceneParser';
import styles from './ScenePanel.module.css';

interface ScenePanelProps {
  scenes: ParsedScene[];
  onSceneClick: (elementId: string) => void;
  scriptId?: string;
}

export function ScenePanel({ scenes, onSceneClick, scriptId }: ScenePanelProps) {
  const navigate = useNavigate();

  const handlePushToShots = (e: MouseEvent<HTMLButtonElement>, sceneIndex: number) => {
    e.stopPropagation();
    if (!scriptId) return;
    navigate(`/shots/${scriptId}?scene=${sceneIndex}`);
  };

  const handleSceneKeyDown = (e: KeyboardEvent<HTMLDivElement>, elementId: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onSceneClick(elementId);
  };

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
          <div
            key={scene.elementId}
            className={styles.card}
            onClick={() => onSceneClick(scene.elementId)}
            onKeyDown={(e) => handleSceneKeyDown(e, scene.elementId)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.cardHeader}>
              <span className={styles.index}>{scene.index}</span>
              <span className={styles.cardTitle}>{scene.text || 'Untitled scene'}</span>
              {scriptId && (
                <button
                  type="button"
                  className={styles.pushBtn}
                  onClick={(e) => handlePushToShots(e, scene.index)}
                  title="Push to Shot List"
                >
                  📋 Shots
                </button>
              )}
            </div>
            {scene.preview && (
              <p className={styles.cardPreview}>{scene.preview}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Framework, Beat } from '@/types/blueprint';
import styles from './FrameworkSelector.module.css';

interface FrameworkSelectorProps {
  frameworks: Framework[];
  beats: Beat[];
  selectedId: string | null;
  onSelect: (framework: Framework) => void;
}

export function FrameworkSelector({
  frameworks,
  beats,
  selectedId,
  onSelect,
}: FrameworkSelectorProps) {
  const selected = frameworks.find((fw) => fw.id === selectedId) ?? null;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Choose a Story Framework</h2>
      <p className={styles.subheading}>
        Select a narrative structure to guide your outline.
      </p>

      <div className={styles.grid}>
        {frameworks.map((fw) => (
          <button
            key={fw.id}
            type="button"
            className={
              fw.id === selectedId ? styles.cardSelected : styles.card
            }
            onClick={() => onSelect(fw)}
            aria-pressed={fw.id === selectedId}
          >
            <p className={styles.cardName}>
              {fw.name}
              {fw.isDefault && (
                <span className={styles.badge}>Recommended</span>
              )}
            </p>
            <p className={styles.cardDesc}>{fw.description}</p>
            <span className={styles.beatCount}>
              {fw.beatCount} beat{fw.beatCount !== 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className={styles.detail}>
          <h3 className={styles.detailName}>{selected.name}</h3>
          <p className={styles.detailDesc}>{selected.description}</p>
          {beats.length > 0 && (
            <ol className={styles.beatList}>
              {beats.map((beat, i) => (
                <li key={beat.id} className={styles.beatItem}>
                  <span className={styles.beatIndex}>{i + 1}.</span>
                  {beat.name}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

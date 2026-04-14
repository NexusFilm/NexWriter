import type { ParsedCharacter } from '@/services/CharacterParser';
import styles from './CharacterTracker.module.css';

interface CharacterTrackerProps {
  characters: ParsedCharacter[];
  onCharacterClick: (elementId: string) => void;
}

export function CharacterTracker({ characters, onCharacterClick }: CharacterTrackerProps) {
  if (characters.length === 0) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.heading}>Characters</h3>
        <p className={styles.empty}>No characters yet</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Characters</h3>
      <ul className={styles.list}>
        {characters.map((char) => (
          <li key={char.name}>
            <button
              className={styles.entry}
              onClick={() => onCharacterClick(char.firstElementId)}
              type="button"
            >
              <span className={styles.name}>{char.name}</span>
              <span className={styles.count}>{char.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

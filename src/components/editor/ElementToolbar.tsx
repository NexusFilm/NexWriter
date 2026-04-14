import type { ElementType } from '@/types/screenplay';
import styles from './ElementToolbar.module.css';

interface ElementToolbarProps {
  activeElementType: ElementType | null;
  onElementTypeClick: (type: ElementType) => void;
}

interface ElementButton {
  type: ElementType;
  icon: string;
  label: string;
}

const ELEMENT_BUTTONS: ElementButton[] = [
  { type: 'SCENE_HEADING', icon: '🎬', label: 'Scene' },
  { type: 'ACTION', icon: '📝', label: 'Action' },
  { type: 'CHARACTER', icon: '👤', label: 'Char' },
  { type: 'DIALOGUE', icon: '💬', label: 'Dialog' },
  { type: 'PARENTHETICAL', icon: '( )', label: 'Paren' },
  { type: 'TRANSITION', icon: '➡️', label: 'Trans' },
];

const NOTE_BUTTON = { icon: '📌', label: 'Note' };

export function ElementToolbar({ activeElementType, onElementTypeClick }: ElementToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Element types">
      {ELEMENT_BUTTONS.map((btn) => (
        <button
          key={btn.type}
          className={activeElementType === btn.type ? styles.btnActive : styles.btn}
          onClick={() => onElementTypeClick(btn.type)}
          title={btn.label}
          type="button"
          aria-pressed={activeElementType === btn.type}
        >
          <span className={styles.icon}>{btn.icon}</span>
          <span className={styles.label}>{btn.label}</span>
        </button>
      ))}
      <div className={styles.divider} />
      <button
        className={styles.btn}
        title="Note (coming soon)"
        type="button"
        disabled
        style={{ opacity: 0.4 }}
      >
        <span className={styles.icon}>{NOTE_BUTTON.icon}</span>
        <span className={styles.label}>{NOTE_BUTTON.label}</span>
      </button>
    </div>
  );
}

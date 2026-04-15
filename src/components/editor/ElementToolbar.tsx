import type { ElementType } from '@/types/screenplay';
import styles from './ElementToolbar.module.css';

interface ElementToolbarProps {
  activeElementType: ElementType | null;
  onElementTypeClick: (type: ElementType) => void;
}

/* Clean SVG icons — nostalgic typewriter feel */
const SceneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const ActionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="18" y2="12" /><line x1="3" y1="18" x2="15" y2="18" />
  </svg>
);

const CharacterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const DialogueIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ParenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3C6 7 6 17 9 21" /><path d="M15 3c3 4 3 14 0 18" />
  </svg>
);

const TransitionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

interface ElementButton {
  type: ElementType;
  icon: React.ReactNode;
  label: string;
}

const ELEMENT_BUTTONS: ElementButton[] = [
  { type: 'SCENE_HEADING', icon: <SceneIcon />, label: 'Scene' },
  { type: 'ACTION', icon: <ActionIcon />, label: 'Action' },
  { type: 'CHARACTER', icon: <CharacterIcon />, label: 'Char' },
  { type: 'DIALOGUE', icon: <DialogueIcon />, label: 'Dialog' },
  { type: 'PARENTHETICAL', icon: <ParenIcon />, label: 'Paren' },
  { type: 'TRANSITION', icon: <TransitionIcon />, label: 'Trans' },
];

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
        style={{ opacity: 0.35 }}
      >
        <span className={styles.icon}><NoteIcon /></span>
        <span className={styles.label}>Note</span>
      </button>
    </div>
  );
}

import { useState, useCallback, useRef, type KeyboardEvent, type FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import type { SaveStatus } from '@/types/ui';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  title: string;
  pageCount: number;
  saveStatus: SaveStatus;
  sidebarOpen: boolean;
  scriptId?: string;
  onTitleChange: (newTitle: string) => void;
  onToggleSidebar: () => void;
}

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  saved: 'Saved',
  saving: 'Saving\u2026',
  unsaved: 'Unsaved changes',
};

export function EditorToolbar({
  title,
  pageCount,
  saveStatus,
  sidebarOpen,
  scriptId,
  onTitleChange,
  onToggleSidebar,
}: EditorToolbarProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const lastCommitted = useRef(title);

  // Sync incoming title prop when it changes externally
  if (title !== lastCommitted.current) {
    lastCommitted.current = title;
    setLocalTitle(title);
  }

  const commitTitle = useCallback(() => {
    const trimmed = localTitle.trim();
    if (trimmed.length > 0 && trimmed !== lastCommitted.current) {
      lastCommitted.current = trimmed;
      onTitleChange(trimmed);
    } else {
      setLocalTitle(lastCommitted.current);
    }
  }, [localTitle, onTitleChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    },
    [],
  );

  const handleBlur = useCallback(
    (_e: FocusEvent<HTMLInputElement>) => {
      commitTitle();
    },
    [commitTitle],
  );

  const statusClass =
    saveStatus === 'saved'
      ? styles.saved
      : saveStatus === 'saving'
        ? styles.saving
        : styles.unsaved;

  const toggleClass = sidebarOpen
    ? `${styles.panelToggle} ${styles.panelToggleActive}`
    : styles.panelToggle;

  return (
    <div className={styles.toolbar}>
      <Link to="/" className={styles.backLink} aria-label="Back to dashboard">
        ←
      </Link>
      <input
        className={styles.titleInput}
        type="text"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Script title"
      />
      <div className={styles.spacer} />
      <div className={styles.meta}>
        <span className={styles.pageCount}>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </span>
        <span className={`${styles.saveStatus} ${statusClass}`}>
          {SAVE_STATUS_LABELS[saveStatus]}
        </span>
        <div className={styles.divider} />
        {scriptId && (
          <Link to={`/history/${scriptId}`} className={styles.historyLink} aria-label="Version history">
            History
          </Link>
        )}
        <button
          className={toggleClass}
          onClick={onToggleSidebar}
          aria-label="Toggle side panel"
          aria-pressed={sidebarOpen}
          type="button"
        >
          ☰
        </button>
      </div>
    </div>
  );
}

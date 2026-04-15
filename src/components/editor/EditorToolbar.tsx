import { useState, useCallback, useRef, type KeyboardEvent, type FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import type { SaveStatus } from '@/types/ui';
import type { ElementType } from '@/types/screenplay';
import type { Editor } from '@tiptap/react';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  title: string;
  pageCount: number;
  saveStatus: SaveStatus;
  sidebarOpen: boolean;
  scriptId?: string;
  editor: Editor | null;
  activeElementType: ElementType | null;
  onTitleChange: (newTitle: string) => void;
  onToggleSidebar: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  saved: 'Saved',
  saving: 'Saving\u2026',
  unsaved: 'Unsaved changes',
};

const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  SCENE_HEADING: 'Scene Heading',
  ACTION: 'Action',
  CHARACTER: 'Character',
  DIALOGUE: 'Dialogue',
  PARENTHETICAL: 'Parenthetical',
  TRANSITION: 'Transition',
  TITLE_PAGE: 'Title Page',
};

export function EditorToolbar({
  title,
  pageCount,
  saveStatus,
  sidebarOpen,
  scriptId,
  editor,
  activeElementType,
  onTitleChange,
  onToggleSidebar,
  onExport,
  onShare,
}: EditorToolbarProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const lastCommitted = useRef(title);

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
      if (e.key === 'Enter') e.currentTarget.blur();
    },
    [],
  );

  const handleBlur = useCallback(
    (_e: FocusEvent<HTMLInputElement>) => { commitTitle(); },
    [commitTitle],
  );

  const statusClass =
    saveStatus === 'saved' ? styles.saved
    : saveStatus === 'saving' ? styles.saving
    : styles.unsaved;

  const toggleClass = sidebarOpen
    ? `${styles.panelToggle} ${styles.panelToggleActive}`
    : styles.panelToggle;

  const isBold = editor?.isActive('bold') ?? false;
  const isItalic = editor?.isActive('italic') ?? false;
  const isUnderline = editor?.isActive('underline') ?? false;

  return (
    <div className={styles.toolbar}>
      {/* Left section */}
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

      <div className={styles.divider} />

      {/* Undo / Redo */}
      <button
        className={styles.fmtBtn}
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
        title="Undo"
        type="button"
        aria-label="Undo"
      >↩</button>
      <button
        className={styles.fmtBtn}
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
        title="Redo"
        type="button"
        aria-label="Redo"
      >↪</button>

      <div className={styles.divider} />

      {/* Formatting */}
      <button
        className={isBold ? styles.fmtBtnActive : styles.fmtBtn}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        title="Bold"
        type="button"
        aria-label="Bold"
        aria-pressed={isBold}
      ><strong>B</strong></button>
      <button
        className={isItalic ? styles.fmtBtnActive : styles.fmtBtn}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        title="Italic"
        type="button"
        aria-label="Italic"
        aria-pressed={isItalic}
      ><em>I</em></button>
      <button
        className={isUnderline ? styles.fmtBtnActive : styles.fmtBtn}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        title="Underline"
        type="button"
        aria-label="Underline"
        aria-pressed={isUnderline}
      ><span style={{ textDecoration: 'underline' }}>U</span></button>

      <div className={styles.divider} />

      {/* Current element type indicator */}
      {activeElementType && (
        <span className={styles.elementIndicator}>
          {ELEMENT_TYPE_LABELS[activeElementType]}
        </span>
      )}

      <div className={styles.spacer} />

      {/* Right section */}
      <div className={styles.meta}>
        <span className={styles.pageCount}>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </span>
        <span className={`${styles.saveStatus} ${statusClass}`}>
          {SAVE_STATUS_LABELS[saveStatus]}
        </span>
        <div className={styles.divider} />
        {onExport && (
          <button className={styles.toolbarBtn} onClick={onExport} type="button">
            Export
          </button>
        )}
        {onShare && (
          <button className={styles.shareBtn} onClick={onShare} type="button">
            Share
          </button>
        )}
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

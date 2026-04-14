import { useState, useRef, useEffect, useCallback } from 'react';
import type { Script } from '@/types/screenplay';
import styles from './ScriptCard.module.css';

interface ScriptCardProps {
  script: Script;
  onNavigate: (scriptId: string) => void;
  onRename: (scriptId: string, newTitle: string) => Promise<void>;
  onDuplicate: (scriptId: string) => Promise<void>;
  onDelete: (scriptId: string) => Promise<void>;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ScriptCard({
  script,
  onNavigate,
  onRename,
  onDuplicate,
  onDelete,
}: ScriptCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(script.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Focus input when renaming
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const handleCardClick = useCallback(() => {
    if (!renaming && !confirmDelete && !menuOpen) {
      onNavigate(script.id);
    }
  }, [renaming, confirmDelete, menuOpen, onNavigate, script.id]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  }, []);

  const handleRenameStart = useCallback(() => {
    setRenameValue(script.title);
    setRenaming(true);
    setMenuOpen(false);
  }, [script.title]);

  const handleRenameCommit = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== script.title) {
      await onRename(script.id, trimmed);
    }
    setRenaming(false);
  }, [renameValue, script.title, script.id, onRename]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRenameCommit();
      } else if (e.key === 'Escape') {
        setRenaming(false);
      }
    },
    [handleRenameCommit],
  );

  const handleDuplicate = useCallback(async () => {
    setMenuOpen(false);
    await onDuplicate(script.id);
  }, [onDuplicate, script.id]);

  const handleDeleteRequest = useCallback(() => {
    setMenuOpen(false);
    setConfirmDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setConfirmDelete(false);
    await onDelete(script.id);
  }, [onDelete, script.id]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      aria-label={`Open script ${script.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !renaming) handleCardClick();
      }}
    >
      <div className={styles.thumbnail}>
        <span className={styles.thumbnailIcon}>📄</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.header}>
          {renaming ? (
            <input
              ref={inputRef}
              className={styles.titleInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              aria-label="Rename script"
            />
          ) : (
            <span className={styles.title}>{script.title}</span>
          )}
          <button
            className={styles.menuBtn}
            onClick={handleMenuToggle}
            aria-label="Script actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            ⋮
          </button>
        </div>

        <div className={styles.meta}>
          <span>{script.pageCount} {script.pageCount === 1 ? 'page' : 'pages'}</span>
          <span className={styles.metaDot}>·</span>
          <span>{formatRelativeTime(script.updatedAt)}</span>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.contextMenu} role="menu">
          <button className={styles.menuItem} role="menuitem" onClick={handleRenameStart}>
            Rename
          </button>
          <button className={styles.menuItem} role="menuitem" onClick={handleDuplicate}>
            Duplicate
          </button>
          <button className={styles.menuItemDanger} role="menuitem" onClick={handleDeleteRequest}>
            Delete
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={(e) => e.stopPropagation()}>
          <span className={styles.confirmText}>Delete "{script.title}"?</span>
          <div className={styles.confirmActions}>
            <button className={styles.confirmDeleteBtn} onClick={handleDeleteConfirm}>
              Delete
            </button>
            <button className={styles.confirmCancelBtn} onClick={handleDeleteCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

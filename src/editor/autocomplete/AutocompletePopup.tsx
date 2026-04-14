import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  subscribeAutocomplete,
  getAutocompleteState,
  setSelectedIndex,
  type AutocompleteState,
  type Suggestion,
} from './autocompleteState';
import styles from './AutocompletePopup.module.css';

interface AutocompletePopupProps {
  /** Called when the user clicks a suggestion. The parent should call acceptSuggestion. */
  onAccept: (suggestion: Suggestion) => void;
}

export function AutocompletePopup({ onAccept }: AutocompletePopupProps) {
  const [state, setState] = useState<AutocompleteState>(getAutocompleteState);
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return subscribeAutocomplete(setState);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [state.selectedIndex]);

  const handleClick = useCallback(
    (suggestion: Suggestion) => {
      onAccept(suggestion);
    },
    [onAccept],
  );

  if (!state.visible || state.suggestions.length === 0 || !state.coords) {
    return null;
  }

  const { top, left, bottom } = state.coords;

  // Position below the cursor line; if near bottom of viewport, show above
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - bottom;
  const showAbove = spaceBelow < 200;

  const style: React.CSSProperties = {
    left: `${left}px`,
    ...(showAbove
      ? { bottom: `${viewportHeight - top + 4}px` }
      : { top: `${bottom + 4}px` }),
  };

  return createPortal(
    <div
      ref={popupRef}
      className={styles.popup}
      style={style}
      role="listbox"
      aria-label="Autocomplete suggestions"
    >
      {state.suggestions.map((suggestion, index) => {
        const isSelected = index === state.selectedIndex;
        return (
          <button
            key={suggestion.text + index}
            ref={isSelected ? selectedRef : undefined}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
            role="option"
            aria-selected={isSelected}
            onMouseEnter={() => setSelectedIndex(index)}
            onMouseDown={(e) => {
              e.preventDefault();
              handleClick(suggestion);
            }}
          >
            <span className={styles.itemLabel}>{suggestion.label}</span>
            {suggestion.category && (
              <span className={styles.itemCategory}>{suggestion.category}</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

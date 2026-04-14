/**
 * Shared autocomplete state using a simple event emitter pattern.
 * Both the TipTap extension and the React popup component subscribe to this.
 */

import type { ElementType } from '@/types/screenplay';

export interface Suggestion {
  text: string;           // The suggestion text to insert
  label: string;          // Display label in the popup
  category: string;       // Category label (e.g., "Scene Heading", "Transition")
  targetElementType?: ElementType;  // If set, convert the block to this type when accepted
  priority: number;       // Higher = shown first (0-100)
}

export interface AutocompleteState {
  visible: boolean;
  suggestions: Suggestion[];
  selectedIndex: number;
  /** Screen coordinates for popup positioning */
  coords: { top: number; left: number; bottom: number } | null;
  /** The full text of the current block (used for replacement) */
  blockText: string;
}

type Listener = (state: AutocompleteState) => void;

const listeners = new Set<Listener>();

let currentState: AutocompleteState = {
  visible: false,
  suggestions: [],
  selectedIndex: 0,
  coords: null,
  blockText: '',
};

function emit() {
  for (const listener of listeners) {
    listener(currentState);
  }
}

export function getAutocompleteState(): AutocompleteState {
  return currentState;
}

export function showAutocomplete(
  suggestions: Suggestion[],
  coords: { top: number; left: number; bottom: number },
  blockText: string,
) {
  currentState = {
    visible: true,
    suggestions,
    selectedIndex: 0,
    coords,
    blockText,
  };
  emit();
}

export function hideAutocomplete() {
  if (!currentState.visible) return;
  currentState = {
    visible: false,
    suggestions: [],
    selectedIndex: 0,
    coords: null,
    blockText: '',
  };
  emit();
}

export function setSelectedIndex(index: number) {
  if (index === currentState.selectedIndex) return;
  currentState = { ...currentState, selectedIndex: index };
  emit();
}

export function subscribeAutocomplete(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

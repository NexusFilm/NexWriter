import type { ElementType } from '@/types/screenplay';
import type { Suggestion } from './autocompleteState';
import {
  CROSS_ELEMENT_PATTERNS,
  SCENE_HEADING_PREFIXES,
  SCENE_LOCATIONS,
  SCENE_TIMES,
  TRANSITIONS,
  CHARACTER_EXTENSIONS,
  PARENTHETICALS,
  ACTION_STARTERS,
} from './screenplayDictionary';

const MAX_SUGGESTIONS = 8;

/** Human-readable category labels for element types */
const CATEGORY_LABELS: Record<ElementType, string> = {
  SCENE_HEADING: 'Scene Heading',
  ACTION: 'Action',
  CHARACTER: 'Character',
  DIALOGUE: 'Dialogue',
  PARENTHETICAL: 'Parenthetical',
  TRANSITION: 'Transition',
  TITLE_PAGE: 'Title Page',
};

/**
 * Determines which phase of a scene heading the user is in:
 * - 'prefix': typing INT./EXT. etc.
 * - 'location': after a prefix, typing a location
 * - 'time': after a location, typing time of day
 */
function getSceneHeadingPhase(text: string): 'prefix' | 'location' | 'time' {
  const upper = text.toUpperCase().trimStart();
  const prefixPattern = /^(INT\.\/?EXT\.|EXT\.\/?INT\.|INT\.|EXT\.|I\/E\.)\s+/i;
  const prefixMatch = upper.match(prefixPattern);

  if (!prefixMatch) {
    return 'prefix';
  }

  const afterPrefix = upper.slice(prefixMatch[0].length);
  if (/\s-\s/.test(afterPrefix)) {
    return 'time';
  }

  return 'location';
}

/**
 * Gets the search term for the current phase of scene heading input.
 */
function getSceneHeadingSearchTerm(text: string, phase: 'prefix' | 'location' | 'time'): string {
  const upper = text.toUpperCase().trimStart();

  if (phase === 'prefix') {
    return upper;
  }

  const prefixPattern = /^(INT\.\/?EXT\.|EXT\.\/?INT\.|INT\.|EXT\.|I\/E\.)\s+/i;
  const prefixMatch = upper.match(prefixPattern);
  if (!prefixMatch) return upper;

  const afterPrefix = upper.slice(prefixMatch[0].length);

  if (phase === 'time') {
    const dashIdx = afterPrefix.lastIndexOf(' - ');
    if (dashIdx >= 0) {
      return afterPrefix.slice(dashIdx + 1).trimStart();
    }
    return '';
  }

  return afterPrefix;
}

/**
 * Filters candidates by prefix match and returns Suggestion objects.
 */
function filterAndRankToSuggestions(
  candidates: string[],
  searchTerm: string,
  category: string,
  priority: number,
  targetElementType?: ElementType,
): Suggestion[] {
  if (searchTerm.length === 0) {
    return candidates.slice(0, MAX_SUGGESTIONS).map((c) => ({
      text: c,
      label: c,
      category,
      priority,
      targetElementType,
    }));
  }

  const term = searchTerm.toUpperCase();
  const matches = candidates.filter((c) => c.toUpperCase().startsWith(term));

  // Don't suggest if the only match is exactly what's typed
  if (matches.length === 1 && matches[0].toUpperCase() === term) {
    return [];
  }

  matches.sort((a, b) => {
    const aExact = a.startsWith(searchTerm) ? 0 : 1;
    const bExact = b.startsWith(searchTerm) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.localeCompare(b);
  });

  return matches.slice(0, MAX_SUGGESTIONS).map((c) => ({
    text: c,
    label: c,
    category,
    priority,
    targetElementType,
  }));
}

/**
 * Pass 1: Cross-element pattern detection.
 * Checks typed text against known screenplay patterns regardless of current element type.
 */
function getCrossElementSuggestions(
  text: string,
  currentElementType: ElementType,
  existingCharacters: string[],
): Suggestion[] {
  const trimmed = text.trimStart();
  if (trimmed.length < 1) return [];

  const lower = trimmed.toLowerCase();
  const suggestions: Suggestion[] = [];

  // Match against cross-element patterns
  for (const pat of CROSS_ELEMENT_PATTERNS) {
    if (pat.pattern.startsWith(lower) || lower.startsWith(pat.pattern)) {
      // Only suggest if the typed text is a prefix of the pattern or vice versa
      if (pat.pattern.startsWith(lower) && pat.suggestion.toUpperCase() !== trimmed.toUpperCase()) {
        const category = currentElementType === pat.targetType
          ? '' // Hide category when already in the right block type
          : CATEGORY_LABELS[pat.targetType];
        suggestions.push({
          text: pat.suggestion,
          label: pat.suggestion,
          category,
          targetElementType: currentElementType === pat.targetType ? undefined : pat.targetType,
          priority: pat.targetType === 'SCENE_HEADING' ? 100 : 90,
        });
      }
    }
  }

  // ALL CAPS text (2+ chars) matching a previously-used character name
  const upper = trimmed.toUpperCase();
  if (trimmed.length >= 2 && trimmed === upper) {
    for (const charName of existingCharacters) {
      const charUpper = charName.toUpperCase();
      if (charUpper.startsWith(upper) && charUpper !== upper) {
        const category = currentElementType === 'CHARACTER'
          ? ''
          : CATEGORY_LABELS.CHARACTER;
        suggestions.push({
          text: charUpper,
          label: charUpper,
          category,
          targetElementType: currentElementType === 'CHARACTER' ? undefined : 'CHARACTER',
          priority: 85,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Pass 2: Element-type-specific suggestions (existing logic, lower priority).
 */
function getElementTypeSuggestions(
  text: string,
  elementType: ElementType,
  existingCharacters: string[],
): Suggestion[] {
  const trimmed = text.trimStart();
  const category = CATEGORY_LABELS[elementType] ?? '';

  switch (elementType) {
    case 'SCENE_HEADING': {
      const phase = getSceneHeadingPhase(trimmed);
      const searchTerm = getSceneHeadingSearchTerm(trimmed, phase);

      if (phase === 'prefix') {
        if (searchTerm.length === 0) return [];
        return filterAndRankToSuggestions(SCENE_HEADING_PREFIXES, searchTerm, category, 70);
      }
      if (phase === 'location') {
        return filterAndRankToSuggestions(SCENE_LOCATIONS, searchTerm, category, 70);
      }
      if (phase === 'time') {
        if (searchTerm.length === 0) {
          return SCENE_TIMES.slice(0, MAX_SUGGESTIONS).map((c) => ({
            text: c, label: c, category, priority: 70,
          }));
        }
        return filterAndRankToSuggestions(SCENE_TIMES, searchTerm, category, 70);
      }
      return [];
    }

    case 'TRANSITION': {
      if (trimmed.length < 1) return [];
      return filterAndRankToSuggestions(TRANSITIONS, trimmed, category, 70);
    }

    case 'CHARACTER': {
      const upperTrimmed = trimmed.toUpperCase();
      const charNames = existingCharacters.map((c) => c.toUpperCase());

      const matchedChar = charNames.find(
        (name) => upperTrimmed.startsWith(name + ' ') || upperTrimmed === name + ' ',
      );

      if (matchedChar) {
        const afterName = trimmed.slice(matchedChar.length).trimStart();
        const fullSuggestions = CHARACTER_EXTENSIONS.map((ext) => matchedChar + ' ' + ext);
        if (afterName.length === 0) {
          return fullSuggestions.slice(0, MAX_SUGGESTIONS).map((c) => ({
            text: c, label: c, category, priority: 70,
          }));
        }
        return filterAndRankToSuggestions(fullSuggestions, trimmed, category, 70);
      }

      if (trimmed.length < 1) return [];
      const allCandidates = [...new Set([...charNames])];
      return filterAndRankToSuggestions(allCandidates, upperTrimmed, category, 70);
    }

    case 'PARENTHETICAL': {
      if (trimmed.length < 1) return [];
      return filterAndRankToSuggestions(PARENTHETICALS, trimmed, category, 70);
    }

    case 'ACTION': {
      if (trimmed.length < 1) return [];
      return filterAndRankToSuggestions(ACTION_STARTERS, trimmed, category, 70);
    }

    default:
      return [];
  }
}

/**
 * Core autocomplete engine. Two-pass system:
 * 1. Cross-element pattern detection (highest priority)
 * 2. Element-type-specific suggestions (lower priority)
 * Merges, deduplicates, sorts by priority desc, returns top 8.
 */
export function getSuggestions(
  text: string,
  elementType: ElementType,
  existingCharacters: string[] = [],
): Suggestion[] {
  const pass1 = getCrossElementSuggestions(text, elementType, existingCharacters);
  const pass2 = getElementTypeSuggestions(text, elementType, existingCharacters);

  // Merge and deduplicate by suggestion text (keep higher priority)
  const seen = new Map<string, Suggestion>();
  for (const s of [...pass1, ...pass2]) {
    const key = s.text.toUpperCase();
    const existing = seen.get(key);
    if (!existing || s.priority > existing.priority) {
      seen.set(key, s);
    }
  }

  const merged = Array.from(seen.values());
  merged.sort((a, b) => b.priority - a.priority);

  return merged.slice(0, MAX_SUGGESTIONS);
}

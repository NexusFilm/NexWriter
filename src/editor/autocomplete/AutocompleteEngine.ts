import type { ElementType } from '@/types/screenplay';
import {
  SCENE_HEADING_PREFIXES,
  SCENE_LOCATIONS,
  SCENE_TIMES,
  TRANSITIONS,
  CHARACTER_EXTENSIONS,
  PARENTHETICALS,
  ACTION_STARTERS,
} from './screenplayDictionary';

const MAX_SUGGESTIONS = 8;

/**
 * Determines which phase of a scene heading the user is in:
 * - 'prefix': typing INT./EXT. etc.
 * - 'location': after a prefix, typing a location
 * - 'time': after a location, typing time of day
 */
function getSceneHeadingPhase(text: string): 'prefix' | 'location' | 'time' {
  const upper = text.toUpperCase().trimStart();

  // Check if we already have a prefix followed by content that looks like it has a location
  const prefixPattern = /^(INT\.\/?EXT\.|EXT\.\/?INT\.|INT\.|EXT\.|I\/E\.)\s+/i;
  const prefixMatch = upper.match(prefixPattern);

  if (!prefixMatch) {
    return 'prefix';
  }

  // We have a prefix. Check if there's location content after it.
  const afterPrefix = upper.slice(prefixMatch[0].length);

  // If the text after prefix contains " - " or ends with a space after some location text
  // and the last segment starts with "- ", we're in time phase
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
    // Get the part after the last space that follows the location
    const dashIdx = afterPrefix.lastIndexOf(' - ');
    if (dashIdx >= 0) {
      return afterPrefix.slice(dashIdx + 1).trimStart();
    }
    // User just typed a space after location, suggest times
    return '';
  }

  // Location phase: return what's after the prefix
  return afterPrefix;
}

/**
 * Filters and ranks suggestions based on a search term using case-insensitive prefix matching.
 * Returns at most MAX_SUGGESTIONS results, ranked by:
 * 1. Exact prefix match first
 * 2. Alphabetical order
 */
function filterAndRank(candidates: string[], searchTerm: string): string[] {
  if (searchTerm.length === 0) {
    return candidates.slice(0, MAX_SUGGESTIONS);
  }

  const term = searchTerm.toUpperCase();

  const matches = candidates.filter((c) =>
    c.toUpperCase().startsWith(term),
  );

  // Don't suggest if the only match is exactly what's typed
  if (matches.length === 1 && matches[0].toUpperCase() === term) {
    return [];
  }

  // Sort: exact case match first, then alphabetical
  matches.sort((a, b) => {
    const aExact = a.startsWith(searchTerm) ? 0 : 1;
    const bExact = b.startsWith(searchTerm) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.localeCompare(b);
  });

  return matches.slice(0, MAX_SUGGESTIONS);
}

/**
 * Core autocomplete engine. Given the current text, element type, and existing
 * character names from the script, returns a ranked list of suggestions.
 */
export function getSuggestions(
  text: string,
  elementType: ElementType,
  existingCharacters: string[] = [],
): string[] {
  const trimmed = text.trimStart();

  switch (elementType) {
    case 'SCENE_HEADING': {
      const phase = getSceneHeadingPhase(trimmed);
      const searchTerm = getSceneHeadingSearchTerm(trimmed, phase);

      if (phase === 'prefix') {
        // Even single char "i" should trigger for scene headings
        if (searchTerm.length === 0) return [];
        return filterAndRank(SCENE_HEADING_PREFIXES, searchTerm);
      }

      if (phase === 'location') {
        return filterAndRank(SCENE_LOCATIONS, searchTerm);
      }

      if (phase === 'time') {
        // For time suggestions, match against the "- " prefix
        if (searchTerm.length === 0) {
          return SCENE_TIMES.slice(0, MAX_SUGGESTIONS);
        }
        return filterAndRank(SCENE_TIMES, searchTerm);
      }

      return [];
    }

    case 'TRANSITION': {
      if (trimmed.length < 1) return [];
      return filterAndRank(TRANSITIONS, trimmed);
    }

    case 'CHARACTER': {
      // Merge existing character names with extensions
      // If text contains a space and starts with a known character, suggest extensions
      const upperTrimmed = trimmed.toUpperCase();
      const charNames = existingCharacters.map((c) => c.toUpperCase());

      // Check if user has typed a full character name and is adding an extension
      const matchedChar = charNames.find(
        (name) => upperTrimmed.startsWith(name + ' ') || upperTrimmed === name + ' ',
      );

      if (matchedChar) {
        const afterName = trimmed.slice(matchedChar.length).trimStart();
        const fullSuggestions = CHARACTER_EXTENSIONS.map(
          (ext) => matchedChar + ' ' + ext,
        );
        if (afterName.length === 0) {
          return fullSuggestions.slice(0, MAX_SUGGESTIONS);
        }
        return filterAndRank(fullSuggestions, trimmed);
      }

      // Otherwise suggest character names
      if (trimmed.length < 1) return [];
      const allCandidates = [...new Set([...charNames])];
      return filterAndRank(allCandidates, upperTrimmed);
    }

    case 'PARENTHETICAL': {
      if (trimmed.length < 1) return [];
      return filterAndRank(PARENTHETICALS, trimmed);
    }

    case 'ACTION': {
      if (trimmed.length < 1) return [];
      return filterAndRank(ACTION_STARTERS, trimmed);
    }

    default:
      return [];
  }
}

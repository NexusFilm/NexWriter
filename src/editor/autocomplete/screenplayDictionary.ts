import type { ElementType } from '@/types/screenplay';

/**
 * Comprehensive dictionary of screenplay terms organized by element type.
 * Used by the AutocompleteEngine to provide context-aware suggestions.
 */

/**
 * Cross-element patterns: recognized regardless of current element type.
 * When matched, the suggestion includes a targetType to convert the block.
 */
export interface CrossElementPattern {
  pattern: string;
  suggestion: string;
  targetType: ElementType;
}

export const CROSS_ELEMENT_PATTERNS: CrossElementPattern[] = [
  // Scene heading triggers
  { pattern: 'int', suggestion: 'INT.', targetType: 'SCENE_HEADING' },
  { pattern: 'interior', suggestion: 'INT.', targetType: 'SCENE_HEADING' },
  { pattern: 'ext', suggestion: 'EXT.', targetType: 'SCENE_HEADING' },
  { pattern: 'exterior', suggestion: 'EXT.', targetType: 'SCENE_HEADING' },
  { pattern: 'i/e', suggestion: 'INT./EXT.', targetType: 'SCENE_HEADING' },

  // Transition triggers
  { pattern: 'fade in', suggestion: 'FADE IN:', targetType: 'TRANSITION' },
  { pattern: 'fade out', suggestion: 'FADE OUT.', targetType: 'TRANSITION' },
  { pattern: 'fade to', suggestion: 'FADE TO:', targetType: 'TRANSITION' },
  { pattern: 'cut to', suggestion: 'CUT TO:', targetType: 'TRANSITION' },
  { pattern: 'dissolve', suggestion: 'DISSOLVE TO:', targetType: 'TRANSITION' },
  { pattern: 'smash cut', suggestion: 'SMASH CUT TO:', targetType: 'TRANSITION' },
  { pattern: 'match cut', suggestion: 'MATCH CUT TO:', targetType: 'TRANSITION' },
  { pattern: 'jump cut', suggestion: 'JUMP CUT TO:', targetType: 'TRANSITION' },
  { pattern: 'wipe', suggestion: 'WIPE TO:', targetType: 'TRANSITION' },
  { pattern: 'intercut', suggestion: 'INTERCUT:', targetType: 'TRANSITION' },
];

export const SCENE_HEADING_PREFIXES: string[] = [
  'INT.',
  'EXT.',
  'INT./EXT.',
  'EXT./INT.',
  'I/E.',
];

export const SCENE_LOCATIONS: string[] = [
  'OFFICE',
  'HOUSE',
  'BEDROOM',
  'KITCHEN',
  'LIVING ROOM',
  'BATHROOM',
  'HALLWAY',
  'CAR',
  'RESTAURANT',
  'BAR',
  'HOSPITAL',
  'SCHOOL',
  'PARK',
  'STREET',
  'ALLEY',
  'ROOFTOP',
  'BASEMENT',
  'GARAGE',
  'WAREHOUSE',
  'CHURCH',
  'COURTROOM',
  'PRISON',
  'APARTMENT',
  'HOTEL ROOM',
  'LOBBY',
  'ELEVATOR',
  'STAIRWELL',
  'PARKING LOT',
  'BEACH',
  'FOREST',
  'BRIDGE',
  'SUBWAY',
  'AIRPORT',
  'TRAIN STATION',
];

export const SCENE_TIMES: string[] = [
  '- DAY',
  '- NIGHT',
  '- MORNING',
  '- EVENING',
  '- DAWN',
  '- DUSK',
  '- CONTINUOUS',
  '- LATER',
  '- MOMENTS LATER',
  '- SAME TIME',
];

export const TRANSITIONS: string[] = [
  'CUT TO:',
  'CUT TO BLACK:',
  'CROSSFADE:',
  'FADE IN:',
  'FADE OUT.',
  'FADE TO:',
  'FADE TO BLACK.',
  'DISSOLVE TO:',
  'DISSOLVE TO BLACK:',
  'SMASH CUT TO:',
  'SLOW FADE TO:',
  'MATCH CUT TO:',
  'JUMP CUT TO:',
  'WIPE TO:',
  'INTERCUT:',
  'TIME CUT:',
];

export const CHARACTER_EXTENSIONS: string[] = [
  '(V.O.)',
  '(O.S.)',
  '(O.C.)',
  "(CONT'D)",
];

export const PARENTHETICALS: string[] = [
  '(beat)',
  '(pause)',
  '(to ',
  '(into phone)',
  '(whispering)',
  '(shouting)',
  '(laughing)',
  '(crying)',
  '(angry)',
  '(sarcastic)',
  '(sotto voce)',
  '(re: ',
  '(continuing)',
  '(in ',
];

export const ACTION_STARTERS: string[] = [
  'We see',
  'ANGLE ON',
  'CLOSE ON',
  'WIDE SHOT',
  'INSERT',
  'BACK TO SCENE',
  'SERIES OF SHOTS:',
  'MONTAGE:',
  'END MONTAGE',
  'FLASHBACK:',
  'END FLASHBACK',
  'DREAM SEQUENCE:',
  'END DREAM SEQUENCE',
  'SUPER:',
  'TITLE CARD:',
  'CHYRON:',
];

/**
 * Returns the base dictionary suggestions for a given element type.
 */
export function getDictionaryForType(elementType: ElementType): string[] {
  switch (elementType) {
    case 'SCENE_HEADING':
      return SCENE_HEADING_PREFIXES;
    case 'TRANSITION':
      return TRANSITIONS;
    case 'CHARACTER':
      return CHARACTER_EXTENSIONS;
    case 'PARENTHETICAL':
      return PARENTHETICALS;
    case 'ACTION':
      return ACTION_STARTERS;
    default:
      return [];
  }
}

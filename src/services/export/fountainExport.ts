import type { ScreenplayElement } from '@/types/screenplay';

const SCENE_HEADING_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E.', 'E/I.'];

/**
 * Export ScreenplayElement[] to Fountain markup string.
 *
 * Fountain format rules:
 * - SCENE_HEADING: prefix with `.` if not starting with INT./EXT., otherwise raw uppercase
 * - CHARACTER: uppercase name followed by newline
 * - DIALOGUE: text below character (no blank line between character and dialogue)
 * - PARENTHETICAL: wrapped in parens below character/dialogue
 * - TRANSITION: suffixed with `TO:` or prefixed with `>`
 * - ACTION: plain text with blank line separation
 * - TITLE_PAGE: key:value pairs at the top
 */
export function exportFountain(elements: ScreenplayElement[]): string {
  const lines: string[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const prevEl = i > 0 ? elements[i - 1] : null;

    // Add blank line separator before elements (except dialogue/parenthetical following character)
    const isDialogueBlock =
      (el.type === 'DIALOGUE' || el.type === 'PARENTHETICAL') &&
      prevEl &&
      (prevEl.type === 'CHARACTER' || prevEl.type === 'DIALOGUE' || prevEl.type === 'PARENTHETICAL');

    if (i > 0 && !isDialogueBlock) {
      lines.push('');
    }

    switch (el.type) {
      case 'SCENE_HEADING': {
        const upper = el.text.toUpperCase();
        const hasPrefix = SCENE_HEADING_PREFIXES.some(p => upper.startsWith(p));
        if (hasPrefix) {
          lines.push(upper);
        } else {
          lines.push(`.${el.text}`);
        }
        break;
      }
      case 'CHARACTER':
        lines.push(el.text.toUpperCase());
        break;
      case 'DIALOGUE':
        lines.push(el.text);
        break;
      case 'PARENTHETICAL': {
        const text = el.text;
        // Ensure wrapped in parens
        if (text.startsWith('(') && text.endsWith(')')) {
          lines.push(text);
        } else {
          lines.push(`(${text})`);
        }
        break;
      }
      case 'TRANSITION': {
        // Use > prefix for forced transition
        lines.push(`>${el.text}`);
        break;
      }
      case 'ACTION':
        lines.push(el.text);
        break;
      case 'TITLE_PAGE':
        // Fountain title page uses key:value format; we store as plain text
        lines.push(`Title: ${el.text}`);
        break;
    }
  }

  return lines.join('\n');
}

/**
 * Parse a Fountain markup string back to ScreenplayElement[].
 */
export function parseFountain(fountain: string): ScreenplayElement[] {
  const elements: ScreenplayElement[] = [];
  const rawLines = fountain.split('\n');

  // Group lines into logical blocks separated by blank lines,
  // but keep dialogue blocks (non-blank lines after a character) together
  let i = 0;
  let order = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    // Skip blank lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Title page line
    if (line.startsWith('Title: ')) {
      elements.push({
        id: `fountain-${order}`,
        type: 'TITLE_PAGE',
        text: line.slice(7),
        order: order++,
      });
      i++;
      continue;
    }

    // Forced scene heading (starts with .)
    if (line.startsWith('.') && line.length > 1 && !line.startsWith('..')) {
      elements.push({
        id: `fountain-${order}`,
        type: 'SCENE_HEADING',
        text: line.slice(1),
        order: order++,
      });
      i++;
      continue;
    }

    // Scene heading (starts with INT./EXT. etc.)
    const upperLine = line.toUpperCase();
    if (SCENE_HEADING_PREFIXES.some(p => upperLine.startsWith(p))) {
      elements.push({
        id: `fountain-${order}`,
        type: 'SCENE_HEADING',
        text: line,
        order: order++,
      });
      i++;
      continue;
    }

    // Forced transition (starts with >)
    if (line.startsWith('>')) {
      elements.push({
        id: `fountain-${order}`,
        type: 'TRANSITION',
        text: line.slice(1),
        order: order++,
      });
      i++;
      continue;
    }

    // Character: all uppercase line (not a scene heading, not a transition)
    // followed by dialogue or parenthetical on the next non-blank line
    if (isCharacterLine(line, rawLines, i)) {
      elements.push({
        id: `fountain-${order}`,
        type: 'CHARACTER',
        text: line,
        order: order++,
      });
      i++;

      // Parse dialogue block (dialogue and parentheticals)
      while (i < rawLines.length && rawLines[i].trim() !== '') {
        const dLine = rawLines[i];
        if (dLine.startsWith('(') && dLine.endsWith(')')) {
          elements.push({
            id: `fountain-${order}`,
            type: 'PARENTHETICAL',
            text: dLine,
            order: order++,
          });
        } else {
          elements.push({
            id: `fountain-${order}`,
            type: 'DIALOGUE',
            text: dLine,
            order: order++,
          });
        }
        i++;
      }
      continue;
    }

    // Default: ACTION
    elements.push({
      id: `fountain-${order}`,
      type: 'ACTION',
      text: line,
      order: order++,
    });
    i++;
  }

  return elements;
}

/**
 * Determine if a line is a CHARACTER line in Fountain.
 * A character line is all uppercase and is followed by non-blank content (dialogue).
 */
function isCharacterLine(line: string, allLines: string[], index: number): boolean {
  // Must be all uppercase (letters only, ignoring non-alpha chars)
  const letters = line.replace(/[^A-Za-z]/g, '');
  if (letters.length === 0) return false;
  if (letters !== letters.toUpperCase()) return false;

  // Must have a following non-blank line (dialogue)
  const nextIndex = index + 1;
  if (nextIndex >= allLines.length) return false;
  return allLines[nextIndex].trim() !== '';
}

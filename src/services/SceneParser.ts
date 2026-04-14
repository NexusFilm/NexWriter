import type { ScreenplayElement } from '@/types/screenplay';

export interface ParsedScene {
  index: number;
  text: string;
  elementId: string;
  /** Preview of the first few lines of content under this scene heading */
  preview: string;
}

/**
 * Parses SCENE_HEADING elements from a screenplay, returning them
 * in original order with 1-based index numbering.
 * Includes a preview of the content following each scene heading.
 */
export function parseScenes(elements: ScreenplayElement[]): ParsedScene[] {
  let idx = 0;
  const sceneIndices: number[] = [];

  // Find indices of all scene headings
  elements.forEach((el, i) => {
    if (el.type === 'SCENE_HEADING') {
      sceneIndices.push(i);
    }
  });

  return sceneIndices.map((sceneIdx, si) => {
    const el = elements[sceneIdx];
    const nextSceneIdx = si + 1 < sceneIndices.length ? sceneIndices[si + 1] : elements.length;

    // Collect text from elements between this heading and the next
    const previewLines: string[] = [];
    for (let j = sceneIdx + 1; j < nextSceneIdx && previewLines.length < 3; j++) {
      const text = elements[j].text.trim();
      if (text) {
        previewLines.push(text.length > 60 ? text.slice(0, 60) + '…' : text);
      }
    }

    return {
      index: ++idx,
      text: el.text,
      elementId: el.id,
      preview: previewLines.join(' / '),
    };
  });
}

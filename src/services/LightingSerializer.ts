import type { DiagramElement, ILightingSerializer } from '../types/productionTools';

/**
 * Pure serialization/deserialization for lighting diagram state.
 * Converts DiagramElement[] + canvas dimensions to/from JSON strings
 * with round-trip consistency.
 */

interface SerializedDiagram {
  elements: DiagramElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export function serialize(
  elements: DiagramElement[],
  canvasWidth: number,
  canvasHeight: number,
): string {
  const payload: SerializedDiagram = { elements, canvasWidth, canvasHeight };
  return JSON.stringify(payload);
}

export function deserialize(
  json: string,
): { elements: DiagramElement[]; canvasWidth: number; canvasHeight: number } {
  const parsed: SerializedDiagram = JSON.parse(json);
  return {
    elements: parsed.elements,
    canvasWidth: parsed.canvasWidth,
    canvasHeight: parsed.canvasHeight,
  };
}

export const LightingSerializer: ILightingSerializer = {
  serialize,
  deserialize,
};

import { describe, it, expect } from 'vitest';
import { serialize, deserialize, LightingSerializer } from './LightingSerializer';
import type { DiagramElement } from '../types/productionTools';

describe('LightingSerializer', () => {
  const sampleElements: DiagramElement[] = [
    {
      id: 'el-1',
      type: 'lighting_symbol',
      symbolType: 'key_light',
      x: 100,
      y: 200,
      rotation: 45,
      label: 'Key Light',
      width: 40,
      height: 40,
    },
    {
      id: 'el-2',
      type: 'camera',
      x: 300,
      y: 400,
      rotation: 0,
      label: 'Camera A',
    },
    {
      id: 'el-3',
      type: 'actor',
      x: 500,
      y: 350,
      rotation: 0,
      label: 'Actor 1',
    },
  ];

  describe('serialize', () => {
    it('returns a valid JSON string', () => {
      const json = serialize(sampleElements, 800, 600);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes elements, canvasWidth, and canvasHeight', () => {
      const json = serialize(sampleElements, 800, 600);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('elements');
      expect(parsed).toHaveProperty('canvasWidth', 800);
      expect(parsed).toHaveProperty('canvasHeight', 600);
    });

    it('serializes an empty elements array', () => {
      const json = serialize([], 1024, 768);
      const parsed = JSON.parse(json);
      expect(parsed.elements).toEqual([]);
      expect(parsed.canvasWidth).toBe(1024);
      expect(parsed.canvasHeight).toBe(768);
    });
  });

  describe('deserialize', () => {
    it('parses a valid JSON string back to elements and dimensions', () => {
      const json = JSON.stringify({
        elements: sampleElements,
        canvasWidth: 800,
        canvasHeight: 600,
      });
      const result = deserialize(json);
      expect(result.elements).toEqual(sampleElements);
      expect(result.canvasWidth).toBe(800);
      expect(result.canvasHeight).toBe(600);
    });

    it('throws on invalid JSON', () => {
      expect(() => deserialize('not-json')).toThrow();
    });
  });

  describe('round-trip', () => {
    it('serialize then deserialize produces equivalent state', () => {
      const json = serialize(sampleElements, 800, 600);
      const result = deserialize(json);
      expect(result.elements).toEqual(sampleElements);
      expect(result.canvasWidth).toBe(800);
      expect(result.canvasHeight).toBe(600);
    });

    it('round-trips with elements containing optional fields', () => {
      const elements: DiagramElement[] = [
        {
          id: 'wall-1',
          type: 'wall',
          x: 0,
          y: 0,
          rotation: 90,
          label: 'North Wall',
          width: 200,
          height: 10,
        },
        {
          id: 'light-1',
          type: 'lighting_symbol',
          symbolType: 'fill_light',
          x: 50,
          y: 75,
          rotation: 0,
          label: 'Fill',
        },
      ];
      const json = serialize(elements, 1920, 1080);
      const result = deserialize(json);
      expect(result.elements).toEqual(elements);
    });

    it('round-trips an empty diagram', () => {
      const json = serialize([], 400, 300);
      const result = deserialize(json);
      expect(result.elements).toEqual([]);
      expect(result.canvasWidth).toBe(400);
      expect(result.canvasHeight).toBe(300);
    });
  });

  describe('LightingSerializer object', () => {
    it('implements ILightingSerializer interface', () => {
      expect(typeof LightingSerializer.serialize).toBe('function');
      expect(typeof LightingSerializer.deserialize).toBe('function');
    });

    it('works the same as standalone functions', () => {
      const json = LightingSerializer.serialize(sampleElements, 800, 600);
      const result = LightingSerializer.deserialize(json);
      expect(result.elements).toEqual(sampleElements);
    });
  });
});

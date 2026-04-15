import { describe, it, expect, beforeEach } from 'vitest';
import { useLightingStore } from './lightingStore';
import type { LightingDiagram, DiagramElement } from '@/types/productionTools';

const makeDiagram = (overrides?: Partial<LightingDiagram>): LightingDiagram => ({
  id: 'diag-1',
  userId: 'user-1',
  scriptId: 'script-1',
  sceneIndex: 0,
  sceneHeading: 'INT. STUDIO - DAY',
  elements: [],
  canvasWidth: 800,
  canvasHeight: 600,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeElement = (overrides?: Partial<DiagramElement>): DiagramElement => ({
  id: 'el-1',
  type: 'lighting_symbol',
  symbolType: 'key_light',
  x: 100,
  y: 200,
  rotation: 0,
  label: 'Key Light',
  ...overrides,
});

describe('useLightingStore', () => {
  beforeEach(() => {
    useLightingStore.setState({ diagram: null, selectedElementId: null });
  });

  it('initializes with null diagram and no selection', () => {
    const state = useLightingStore.getState();
    expect(state.diagram).toBeNull();
    expect(state.selectedElementId).toBeNull();
  });

  it('setDiagram sets the diagram and clears selection', () => {
    useLightingStore.getState().selectElement('some-id');
    const diagram = makeDiagram();
    useLightingStore.getState().setDiagram(diagram);
    const state = useLightingStore.getState();
    expect(state.diagram).toEqual(diagram);
    expect(state.selectedElementId).toBeNull();
  });

  it('addElement appends an element to the diagram', () => {
    useLightingStore.getState().setDiagram(makeDiagram());
    const element = makeElement();
    useLightingStore.getState().addElement(element);
    expect(useLightingStore.getState().diagram!.elements).toEqual([element]);
  });

  it('addElement does nothing when diagram is null', () => {
    useLightingStore.getState().addElement(makeElement());
    expect(useLightingStore.getState().diagram).toBeNull();
  });

  it('updateElement updates matching element properties', () => {
    const el = makeElement();
    useLightingStore.getState().setDiagram(makeDiagram({ elements: [el] }));
    useLightingStore.getState().updateElement('el-1', { x: 300, y: 400 });
    const updated = useLightingStore.getState().diagram!.elements[0];
    expect(updated.x).toBe(300);
    expect(updated.y).toBe(400);
    expect(updated.label).toBe('Key Light');
  });

  it('updateElement does nothing when diagram is null', () => {
    useLightingStore.getState().updateElement('el-1', { x: 300 });
    expect(useLightingStore.getState().diagram).toBeNull();
  });

  it('removeElement removes the element by id', () => {
    const el1 = makeElement({ id: 'el-1' });
    const el2 = makeElement({ id: 'el-2', label: 'Fill Light' });
    useLightingStore.getState().setDiagram(makeDiagram({ elements: [el1, el2] }));
    useLightingStore.getState().removeElement('el-1');
    const elements = useLightingStore.getState().diagram!.elements;
    expect(elements).toHaveLength(1);
    expect(elements[0].id).toBe('el-2');
  });

  it('removeElement clears selection when removing the selected element', () => {
    const el = makeElement();
    useLightingStore.getState().setDiagram(makeDiagram({ elements: [el] }));
    useLightingStore.getState().selectElement('el-1');
    useLightingStore.getState().removeElement('el-1');
    expect(useLightingStore.getState().selectedElementId).toBeNull();
  });

  it('removeElement preserves selection when removing a different element', () => {
    const el1 = makeElement({ id: 'el-1' });
    const el2 = makeElement({ id: 'el-2' });
    useLightingStore.getState().setDiagram(makeDiagram({ elements: [el1, el2] }));
    useLightingStore.getState().selectElement('el-2');
    useLightingStore.getState().removeElement('el-1');
    expect(useLightingStore.getState().selectedElementId).toBe('el-2');
  });

  it('removeElement does nothing when diagram is null', () => {
    useLightingStore.getState().removeElement('el-1');
    expect(useLightingStore.getState().diagram).toBeNull();
  });

  it('selectElement sets the selected element id', () => {
    useLightingStore.getState().selectElement('el-1');
    expect(useLightingStore.getState().selectedElementId).toBe('el-1');
  });

  it('selectElement clears selection with null', () => {
    useLightingStore.getState().selectElement('el-1');
    useLightingStore.getState().selectElement(null);
    expect(useLightingStore.getState().selectedElementId).toBeNull();
  });
});

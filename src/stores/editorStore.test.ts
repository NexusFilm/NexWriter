import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editorStore';
import type { ScreenplayElement } from '@/types/screenplay';

const makeElement = (
  id: string,
  type: ScreenplayElement['type'] = 'ACTION',
  text = '',
  order = 0,
): ScreenplayElement => ({ id, type, text, order });

describe('EditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      script: null,
      elements: [],
      saveStatus: 'saved',
      activePanelTab: null,
      showBlueprintAnnotations: true,
    });
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useEditorStore.getState();
      expect(state.script).toBeNull();
      expect(state.elements).toEqual([]);
      expect(state.saveStatus).toBe('saved');
      expect(state.activePanelTab).toBeNull();
      expect(state.showBlueprintAnnotations).toBe(true);
    });
  });

  describe('setElements', () => {
    it('replaces the entire elements array', () => {
      const els = [makeElement('a', 'ACTION', 'hello', 0), makeElement('b', 'DIALOGUE', 'world', 1)];
      useEditorStore.getState().setElements(els);
      expect(useEditorStore.getState().elements).toEqual(els);
    });

    it('replaces previous elements completely', () => {
      useEditorStore.getState().setElements([makeElement('a')]);
      useEditorStore.getState().setElements([makeElement('b')]);
      expect(useEditorStore.getState().elements).toHaveLength(1);
      expect(useEditorStore.getState().elements[0].id).toBe('b');
    });
  });

  describe('updateElement', () => {
    it('merges partial updates into the matching element', () => {
      useEditorStore.getState().setElements([
        makeElement('a', 'ACTION', 'original', 0),
        makeElement('b', 'DIALOGUE', 'keep', 1),
      ]);
      useEditorStore.getState().updateElement('a', { text: 'updated', type: 'CHARACTER' });
      const el = useEditorStore.getState().elements[0];
      expect(el.text).toBe('updated');
      expect(el.type).toBe('CHARACTER');
      expect(el.id).toBe('a');
    });

    it('does not modify other elements', () => {
      useEditorStore.getState().setElements([
        makeElement('a', 'ACTION', 'one', 0),
        makeElement('b', 'DIALOGUE', 'two', 1),
      ]);
      useEditorStore.getState().updateElement('a', { text: 'changed' });
      expect(useEditorStore.getState().elements[1].text).toBe('two');
    });

    it('does nothing if id is not found', () => {
      const els = [makeElement('a', 'ACTION', 'text', 0)];
      useEditorStore.getState().setElements(els);
      useEditorStore.getState().updateElement('nonexistent', { text: 'nope' });
      expect(useEditorStore.getState().elements).toEqual(els);
    });
  });

  describe('insertElement', () => {
    it('inserts after the specified element', () => {
      useEditorStore.getState().setElements([
        makeElement('a', 'ACTION', 'first', 0),
        makeElement('c', 'ACTION', 'third', 1),
      ]);
      useEditorStore.getState().insertElement('a', makeElement('b', 'DIALOGUE', 'second', 99));
      const els = useEditorStore.getState().elements;
      expect(els).toHaveLength(3);
      expect(els[0].id).toBe('a');
      expect(els[1].id).toBe('b');
      expect(els[2].id).toBe('c');
    });

    it('reorders elements after insertion', () => {
      useEditorStore.getState().setElements([makeElement('a', 'ACTION', '', 0)]);
      useEditorStore.getState().insertElement('a', makeElement('b', 'ACTION', '', 99));
      const els = useEditorStore.getState().elements;
      expect(els[0].order).toBe(0);
      expect(els[1].order).toBe(1);
    });

    it('appends to end if afterId is not found', () => {
      useEditorStore.getState().setElements([makeElement('a', 'ACTION', '', 0)]);
      useEditorStore.getState().insertElement('nonexistent', makeElement('b', 'ACTION', '', 5));
      const els = useEditorStore.getState().elements;
      expect(els).toHaveLength(2);
      expect(els[1].id).toBe('b');
    });
  });

  describe('deleteElement', () => {
    it('removes the element with the given id', () => {
      useEditorStore.getState().setElements([
        makeElement('a', 'ACTION', '', 0),
        makeElement('b', 'DIALOGUE', '', 1),
        makeElement('c', 'CHARACTER', '', 2),
      ]);
      useEditorStore.getState().deleteElement('b');
      const els = useEditorStore.getState().elements;
      expect(els).toHaveLength(2);
      expect(els.map((e) => e.id)).toEqual(['a', 'c']);
    });

    it('reorders remaining elements', () => {
      useEditorStore.getState().setElements([
        makeElement('a', 'ACTION', '', 0),
        makeElement('b', 'DIALOGUE', '', 1),
        makeElement('c', 'CHARACTER', '', 2),
      ]);
      useEditorStore.getState().deleteElement('a');
      const els = useEditorStore.getState().elements;
      expect(els[0].order).toBe(0);
      expect(els[1].order).toBe(1);
    });

    it('does nothing if id is not found', () => {
      useEditorStore.getState().setElements([makeElement('a', 'ACTION', '', 0)]);
      useEditorStore.getState().deleteElement('nonexistent');
      expect(useEditorStore.getState().elements).toHaveLength(1);
    });
  });

  describe('cycleElementType', () => {
    it('cycles SCENE_HEADING to ACTION', () => {
      useEditorStore.getState().setElements([makeElement('a', 'SCENE_HEADING', '', 0)]);
      useEditorStore.getState().cycleElementType('a');
      expect(useEditorStore.getState().elements[0].type).toBe('ACTION');
    });

    it('cycles ACTION to CHARACTER', () => {
      useEditorStore.getState().setElements([makeElement('a', 'ACTION', '', 0)]);
      useEditorStore.getState().cycleElementType('a');
      expect(useEditorStore.getState().elements[0].type).toBe('CHARACTER');
    });

    it('cycles TRANSITION back to SCENE_HEADING', () => {
      useEditorStore.getState().setElements([makeElement('a', 'TRANSITION', '', 0)]);
      useEditorStore.getState().cycleElementType('a');
      expect(useEditorStore.getState().elements[0].type).toBe('SCENE_HEADING');
    });

    it('does not modify other elements', () => {
      useEditorStore.getState().setElements([
        makeElement('a', 'ACTION', '', 0),
        makeElement('b', 'DIALOGUE', '', 1),
      ]);
      useEditorStore.getState().cycleElementType('a');
      expect(useEditorStore.getState().elements[1].type).toBe('DIALOGUE');
    });

    it('does nothing if id is not found', () => {
      useEditorStore.getState().setElements([makeElement('a', 'ACTION', '', 0)]);
      useEditorStore.getState().cycleElementType('nonexistent');
      expect(useEditorStore.getState().elements[0].type).toBe('ACTION');
    });
  });

  describe('setSaveStatus', () => {
    it('sets save status to saving', () => {
      useEditorStore.getState().setSaveStatus('saving');
      expect(useEditorStore.getState().saveStatus).toBe('saving');
    });

    it('sets save status to unsaved', () => {
      useEditorStore.getState().setSaveStatus('unsaved');
      expect(useEditorStore.getState().saveStatus).toBe('unsaved');
    });

    it('sets save status to saved', () => {
      useEditorStore.getState().setSaveStatus('unsaved');
      useEditorStore.getState().setSaveStatus('saved');
      expect(useEditorStore.getState().saveStatus).toBe('saved');
    });
  });
});

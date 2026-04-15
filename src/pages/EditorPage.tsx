import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ScriptRepository } from '@/repositories/ScriptRepository';
import { AutosaveManager } from '@/services/AutosaveManager';
import { editorStateToElements, elementsToEditorState } from '@/editor/serialization';
import type { TipTapDocJSON } from '@/editor/serialization';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ElementToolbar } from '@/components/editor/ElementToolbar';
import { SidePanel } from '@/components/editor/SidePanel';
import { ScreenplayEditor } from '@/editor/ScreenplayEditor';
import { computePageCount } from '@/utils/pageCount';
import { parseScenes } from '@/services/SceneParser';
import { parseCharacters } from '@/services/CharacterParser';
import type { ElementType } from '@/types/screenplay';
import type { Editor } from '@tiptap/react';
import { ShareModal } from '@/components/ShareModal';
import styles from './EditorPage.module.css';

const scriptRepo = new ScriptRepository();

export function EditorPage() {
  const { scriptId } = useParams<{ scriptId: string }>();

  const script = useEditorStore((s) => s.script);
  const elements = useEditorStore((s) => s.elements);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const activePanelTab = useEditorStore((s) => s.activePanelTab);
  const setElements = useEditorStore((s) => s.setElements);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Script');
  const [editorContent, setEditorContent] = useState<TipTapDocJSON | null>(null);
  const [activeElementType, setActiveElementType] = useState<ElementType | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // TipTap editor instance ref
  const editorRef = useRef<Editor | null>(null);

  // Track whether the content update came from the editor itself
  const isEditorUpdate = useRef(false);

  // Persist AutosaveManager across renders
  const autosaveManagerRef = useRef<AutosaveManager | null>(null);

  // Stable ref for setSaveStatus so the AutosaveManager callback doesn't go stale
  const setSaveStatusRef = useRef(setSaveStatus);
  setSaveStatusRef.current = setSaveStatus;

  // Lazily create the AutosaveManager instance
  if (!autosaveManagerRef.current) {
    autosaveManagerRef.current = new AutosaveManager(
      scriptRepo,
      () => useAuthStore.getState().tier,
      (status) => setSaveStatusRef.current(status),
    );
  }

  // Derive scene and character data from elements
  const scenes = useMemo(() => parseScenes(elements), [elements]);
  const characters = useMemo(() => parseCharacters(elements), [elements]);

  // Extract character names from CHARACTER elements + ALL CAPS words in ACTION text
  const allCharacterNames = useMemo(() => {
    const namesFromCharElements = characters.map((c) => c.name.toUpperCase());
    const namesFromActions = new Set<string>();
    for (const el of elements) {
      if (el.type === 'ACTION' && el.text) {
        const matches = el.text.match(/\b[A-Z]{2,}\b/g);
        if (matches) {
          for (const m of matches) {
            namesFromActions.add(m);
          }
        }
      }
    }
    return [...new Set([...namesFromCharElements, ...namesFromActions])];
  }, [elements, characters]);

  // Default panel tab to 'scenes' when sidebar opens
  const currentTab = activePanelTab ?? 'scenes';

  const handleTabChange = useCallback((tab: 'scenes' | 'characters' | 'beats') => {
    useEditorStore.setState({ activePanelTab: tab });
  }, []);

  const handleElementScroll = useCallback((_elementId: string) => {
    // Scroll-to-element would be wired to the TipTap editor instance
  }, []);

  // Callback when editor instance is ready
  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  // Callback when selection changes — reports current element type
  const handleSelectionUpdate = useCallback((elementType: ElementType | null) => {
    setActiveElementType(elementType);
  }, []);

  // Handle element type button click from the left toolbar
  const handleElementTypeClick = useCallback((type: ElementType) => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentAttrs = editor.getAttributes('screenplayBlock');
    if (currentAttrs?.elementType) {
      // Change current block's type
      editor.chain().focus().updateAttributes('screenplayBlock', { elementType: type }).run();
    } else {
      // Insert a new block of this type
      editor.chain().focus().insertContent({
        type: 'screenplayBlock',
        attrs: { elementType: type, elementId: '', order: 0 },
      }).run();
    }
    setActiveElementType(type);
  }, []);

  // Load script on mount, resolve conflicts, start autosave
  useEffect(() => {
    if (!scriptId) return;

    let cancelled = false;
    const autosave = autosaveManagerRef.current!;

    async function loadScript() {
      try {
        const resolvedElements = await autosave.resolveConflict(scriptId!);
        if (cancelled) return;

        const loaded = await scriptRepo.getScript(scriptId!);
        if (cancelled) return;

        useEditorStore.setState({ script: loaded });
        setElements(resolvedElements);
        setTitle(loaded.title);
        setEditorContent(elementsToEditorState(resolvedElements));
        setError(null);

        autosave.start(scriptId!);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load script');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadScript();

    return () => {
      cancelled = true;
      autosave.stop();
    };
  }, [scriptId, setElements]);

  // Handle editor content changes — sync to EditorStore and AutosaveManager
  const handleEditorUpdate = useCallback(
    (doc: TipTapDocJSON) => {
      const newElements = editorStateToElements(doc);
      isEditorUpdate.current = true;
      setElements(newElements);
      autosaveManagerRef.current?.onContentChange(newElements);
    },
    [setElements],
  );

  // Handle title change — persist via ScriptRepository
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      if (!scriptId) return;
      setTitle(newTitle);
      try {
        await scriptRepo.updateScript(scriptId, { title: newTitle });
        if (script) {
          useEditorStore.setState({
            script: { ...script, title: newTitle },
          });
        }
      } catch {
        // Title save failed silently
      }
    },
    [scriptId, script],
  );

  const pageCount = computePageCount(elements);

  if (loading) {
    return <div className={styles.loading}>Loading script…</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.page}>
      <EditorToolbar
        title={title}
        pageCount={pageCount}
        saveStatus={saveStatus}
        sidebarOpen={sidebarOpen}
        scriptId={scriptId}
        editor={editorRef.current}
        activeElementType={activeElementType}
        onTitleChange={handleTitleChange}
        onToggleSidebar={toggleSidebar}
        onShare={() => setShareModalVisible(true)}
      />
      <div className={styles.body}>
        <ElementToolbar
          activeElementType={activeElementType}
          onElementTypeClick={handleElementTypeClick}
        />
        <div className={styles.editorPane}>
          <div className={styles.editorInner}>
            <ScreenplayEditor
              content={editorContent ?? undefined}
              onUpdate={handleEditorUpdate}
              onEditorReady={handleEditorReady}
              onSelectionUpdate={handleSelectionUpdate}
              characterNames={allCharacterNames}
            />
          </div>
        </div>
        {/* Side panel — always visible on desktop, toggle on mobile */}
        <div className={sidebarOpen ? styles.sidePanel : styles.sidePanelHidden}>
          <SidePanel
            activeTab={currentTab}
            onTabChange={handleTabChange}
            scenes={scenes}
            characters={characters}
            onSceneClick={handleElementScroll}
            onCharacterClick={handleElementScroll}
            onClose={toggleSidebar}
            scriptId={scriptId}
          />
        </div>
      </div>
      <ShareModal
        scriptId={scriptId ?? ''}
        scriptTitle={title}
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
      />
    </div>
  );
}

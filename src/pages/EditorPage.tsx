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
import { SidePanel } from '@/components/editor/SidePanel';
import { ScreenplayEditor } from '@/editor/ScreenplayEditor';
import { computePageCount } from '@/utils/pageCount';
import { parseScenes } from '@/services/SceneParser';
import { parseCharacters } from '@/services/CharacterParser';
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
  const tier = useAuthStore((s) => s.tier);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const showPaywallModal = useUIStore((s) => s.showPaywallModal);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Script');
  const [editorContent, setEditorContent] = useState<TipTapDocJSON | null>(null);

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

  // Default panel tab to 'scenes' when sidebar opens
  const currentTab = activePanelTab ?? 'scenes';

  const handleTabChange = useCallback((tab: 'scenes' | 'characters' | 'beats') => {
    useEditorStore.setState({ activePanelTab: tab });
  }, []);

  const handleElementScroll = useCallback((_elementId: string) => {
    // Scroll-to-element would be wired to the TipTap editor instance
    // This is a callback stub for the presentational components
  }, []);

  // Load script on mount, resolve conflicts, start autosave
  useEffect(() => {
    if (!scriptId) return;

    let cancelled = false;
    const autosave = autosaveManagerRef.current!;

    async function loadScript() {
      try {
        // Resolve conflict: picks whichever is newer (local draft vs cloud)
        const resolvedElements = await autosave.resolveConflict(scriptId!);

        if (cancelled) return;

        // Also fetch the script metadata (title, etc.)
        const loaded = await scriptRepo.getScript(scriptId!);
        if (cancelled) return;

        useEditorStore.setState({ script: loaded });
        setElements(resolvedElements);
        setTitle(loaded.title);
        setEditorContent(elementsToEditorState(resolvedElements));
        setError(null);

        // Start autosave after script is loaded
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
      // Feed changes to AutosaveManager (handles debounce + save status)
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
        // Title save failed silently — toolbar will still show the local value
      }
    },
    [scriptId, script],
  );

  // Compute page count from elements using screenplay layout rules
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
        onTitleChange={handleTitleChange}
        onToggleSidebar={toggleSidebar}
      />
      <div className={styles.body}>
        <div className={styles.editorPane}>
          <ScreenplayEditor
            content={editorContent ?? undefined}
            onUpdate={handleEditorUpdate}
          />
        </div>
        {sidebarOpen && (
          <div className={styles.sidePanel}>
            <SidePanel
              activeTab={currentTab}
              onTabChange={handleTabChange}
              scenes={scenes}
              characters={characters}
              tier={tier}
              onSceneClick={handleElementScroll}
              onCharacterClick={handleElementScroll}
              onPaywallRequest={showPaywallModal}
            />
          </div>
        )}
      </div>
    </div>
  );
}

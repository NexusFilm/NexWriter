import { ScenePanel } from './ScenePanel';
import { CharacterTracker } from './CharacterTracker';
import { BeatSheetOverlay } from './BeatSheetOverlay';
import type { ParsedScene } from '@/services/SceneParser';
import type { ParsedCharacter } from '@/services/CharacterParser';
import styles from './SidePanel.module.css';

type PanelTab = 'scenes' | 'characters' | 'beats';

interface SidePanelProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  scenes: ParsedScene[];
  characters: ParsedCharacter[];
  onSceneClick: (elementId: string) => void;
  onCharacterClick: (elementId: string) => void;
  onClose?: () => void;
  scriptId?: string;
}

const TAB_LABELS: Record<PanelTab, string> = {
  scenes: 'Scenes',
  characters: 'Characters',
  beats: 'Beats',
};

const TABS: PanelTab[] = ['scenes', 'characters', 'beats'];

export function SidePanel({
  activeTab,
  onTabChange,
  scenes,
  characters,
  onSceneClick,
  onCharacterClick,
  onClose,
  scriptId,
}: SidePanelProps) {
  return (
    <div className={styles.container}>
      {onClose && (
        <button
          className={styles.closeBtn}
          onClick={onClose}
          type="button"
          aria-label="Close panel"
        >
          ✕
        </button>
      )}
      <div className={styles.tabs} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => onTabChange(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            type="button"
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <div className={styles.content} role="tabpanel">
        {activeTab === 'scenes' && (
          <ScenePanel scenes={scenes} onSceneClick={onSceneClick} scriptId={scriptId} />
        )}
        {activeTab === 'characters' && (
          <CharacterTracker characters={characters} onCharacterClick={onCharacterClick} />
        )}
        {activeTab === 'beats' && (
          <BeatSheetOverlay />
        )}
      </div>
    </div>
  );
}

import { ScenePanel } from './ScenePanel';
import { CharacterTracker } from './CharacterTracker';
import { BeatSheetOverlay } from './BeatSheetOverlay';
import type { ParsedScene } from '@/services/SceneParser';
import type { ParsedCharacter } from '@/services/CharacterParser';
import type { Tier } from '@/types/subscription';
import styles from './SidePanel.module.css';

type PanelTab = 'scenes' | 'characters' | 'beats';

interface SidePanelProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  scenes: ParsedScene[];
  characters: ParsedCharacter[];
  tier: Tier;
  onSceneClick: (elementId: string) => void;
  onCharacterClick: (elementId: string) => void;
  onPaywallRequest: () => void;
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
  tier,
  onSceneClick,
  onCharacterClick,
  onPaywallRequest,
}: SidePanelProps) {
  return (
    <div className={styles.container}>
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
          <ScenePanel scenes={scenes} onSceneClick={onSceneClick} />
        )}
        {activeTab === 'characters' && (
          <CharacterTracker characters={characters} onCharacterClick={onCharacterClick} />
        )}
        {activeTab === 'beats' && (
          <BeatSheetOverlay tier={tier} onPaywallRequest={onPaywallRequest} />
        )}
      </div>
    </div>
  );
}

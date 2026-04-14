import type { Script } from '@/types/screenplay';
import { ScriptCard } from './ScriptCard';
import styles from './ScriptCardGrid.module.css';

interface ScriptCardGridProps {
  scripts: Script[];
  onNavigate: (scriptId: string) => void;
  onRename: (scriptId: string, newTitle: string) => Promise<void>;
  onDuplicate: (scriptId: string) => Promise<void>;
  onDelete: (scriptId: string) => Promise<void>;
}

export function ScriptCardGrid({
  scripts,
  onNavigate,
  onRename,
  onDuplicate,
  onDelete,
}: ScriptCardGridProps) {
  return (
    <div className={styles.grid}>
      {scripts.map((script) => (
        <ScriptCard
          key={script.id}
          script={script}
          onNavigate={onNavigate}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Stage, Layer, Rect, Circle, Line, Text, Transformer, RegularPolygon } from 'react-konva';
import type Konva from 'konva';
import { useAuthStore } from '@/stores/authStore';
import { useLightingStore } from '@/stores/lightingStore';
import { LightingDiagramRepository } from '@/repositories/LightingDiagramRepository';
import type {
  DiagramElement,
  DiagramElementType,
  LightingSymbolType,
} from '@/types/productionTools';
import styles from './LightingDiagramPage.module.css';

const repo = new LightingDiagramRepository();

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SPACING = 20;

// --- Palette definitions ---

interface PaletteEntry {
  type: DiagramElementType;
  symbolType?: LightingSymbolType;
  label: string;
  icon: string;
}

const LIGHT_SYMBOLS: PaletteEntry[] = [
  { type: 'lighting_symbol', symbolType: 'key_light', label: 'Key Light', icon: '☀' },
  { type: 'lighting_symbol', symbolType: 'fill_light', label: 'Fill Light', icon: '◑' },
  { type: 'lighting_symbol', symbolType: 'back_light', label: 'Back Light', icon: '◐' },
  { type: 'lighting_symbol', symbolType: 'hair_light', label: 'Hair Light', icon: '✦' },
  { type: 'lighting_symbol', symbolType: 'bounce', label: 'Bounce', icon: '⬡' },
  { type: 'lighting_symbol', symbolType: 'flag', label: 'Flag', icon: '⬛' },
  { type: 'lighting_symbol', symbolType: 'diffusion', label: 'Diffusion', icon: '◻' },
  { type: 'lighting_symbol', symbolType: 'gel', label: 'Gel', icon: '◈' },
  { type: 'lighting_symbol', symbolType: 'practical', label: 'Practical', icon: '💡' },
];

const MARKER_ITEMS: PaletteEntry[] = [
  { type: 'camera', label: 'Camera', icon: '🎥' },
  { type: 'actor', label: 'Actor', icon: '🧑' },
];

const SHAPE_ITEMS: PaletteEntry[] = [
  { type: 'wall', label: 'Wall', icon: '▬' },
  { type: 'window', label: 'Window', icon: '▭' },
  { type: 'door', label: 'Door', icon: '🚪' },
];

// --- Color map for element types ---

function getElementColor(el: DiagramElement): string {
  switch (el.type) {
    case 'lighting_symbol': return '#fbbf24';
    case 'camera': return '#60a5fa';
    case 'actor': return '#34d399';
    case 'wall': return '#9ca3af';
    case 'window': return '#93c5fd';
    case 'door': return '#a78bfa';
    default: return '#ffffff';
  }
}

function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Grid background component ---

function GridLines({ width, height }: { width: number; height: number }) {
  const lines: JSX.Element[] = [];
  // Vertical lines
  for (let x = 0; x <= width; x += GRID_SPACING) {
    lines.push(
      <Line key={`v${x}`} points={[x, 0, x, height]} stroke="#2a2a4a" strokeWidth={0.5} />
    );
  }
  // Horizontal lines
  for (let y = 0; y <= height; y += GRID_SPACING) {
    lines.push(
      <Line key={`h${y}`} points={[0, y, width, y]} stroke="#2a2a4a" strokeWidth={0.5} />
    );
  }
  return <>{lines}</>;
}

// --- Element rendering ---

interface ElementShapeProps {
  element: DiagramElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DiagramElement>) => void;
}

function ElementShape({ element, isSelected, onSelect, onDragEnd, onTransformEnd }: ElementShapeProps) {
  const shapeRef = useRef<Konva.Node>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(element.id, e.target.x(), e.target.y());
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransformEnd(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, (element.width ?? 30) * scaleX),
      height: Math.max(5, (element.height ?? 30) * scaleY),
      rotation: node.rotation(),
    });
  };

  const color = getElementColor(element);
  const w = element.width ?? 30;
  const h = element.height ?? 30;

  const commonProps = {
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    draggable: true,
    onDragEnd: handleDragEnd,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onTransformEnd: handleTransformEnd,
  };

  let shape: JSX.Element;

  switch (element.type) {
    case 'lighting_symbol':
      shape = (
        <Circle
          ref={shapeRef as React.RefObject<Konva.Circle>}
          {...commonProps}
          radius={w / 2}
          fill={color}
          opacity={0.85}
          stroke={isSelected ? '#fff' : color}
          strokeWidth={isSelected ? 2 : 1}
        />
      );
      break;

    case 'camera':
      shape = (
        <RegularPolygon
          ref={shapeRef as React.RefObject<Konva.RegularPolygon>}
          {...commonProps}
          sides={3}
          radius={w / 2}
          fill={color}
          stroke={isSelected ? '#fff' : color}
          strokeWidth={isSelected ? 2 : 1}
        />
      );
      break;

    case 'actor':
      shape = (
        <Circle
          ref={shapeRef as React.RefObject<Konva.Circle>}
          {...commonProps}
          radius={w / 2}
          fill={color}
          stroke={isSelected ? '#fff' : color}
          strokeWidth={isSelected ? 2 : 1}
        />
      );
      break;

    case 'wall':
      shape = (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={element.width ?? 100}
          height={element.height ?? 10}
          fill={color}
          stroke={isSelected ? '#fff' : '#6b7280'}
          strokeWidth={isSelected ? 2 : 1}
        />
      );
      break;

    case 'window':
      shape = (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={element.width ?? 60}
          height={element.height ?? 8}
          fill="transparent"
          stroke={color}
          strokeWidth={2}
          dash={[6, 3]}
        />
      );
      break;

    case 'door':
      shape = (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={element.width ?? 40}
          height={element.height ?? 8}
          fill={color}
          opacity={0.6}
          stroke={isSelected ? '#fff' : color}
          strokeWidth={isSelected ? 2 : 1}
        />
      );
      break;

    default:
      shape = (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={w}
          height={h}
          fill={color}
        />
      );
  }

  return (
    <>
      {shape}
      {/* Label below element */}
      {element.label && (
        <Text
          x={element.x - 30}
          y={element.y + (element.type === 'wall' || element.type === 'window' || element.type === 'door'
            ? (element.height ?? 10) + 4
            : (w / 2) + 4)}
          width={60}
          text={element.label}
          fontSize={10}
          fill="#e5e7eb"
          align="center"
          listening={false}
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef as React.RefObject<Konva.Transformer>}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(_oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return _oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

// --- Main page component ---

export function LightingDiagramPage() {
  const { scriptId, sceneIndex } = useParams<{ scriptId: string; sceneIndex: string }>();
  const user = useAuthStore((s) => s.user);

  const diagram = useLightingStore((s) => s.diagram);
  const selectedElementId = useLightingStore((s) => s.selectedElementId);
  const setDiagram = useLightingStore((s) => s.setDiagram);
  const addElement = useLightingStore((s) => s.addElement);
  const updateElement = useLightingStore((s) => s.updateElement);
  const removeElement = useLightingStore((s) => s.removeElement);
  const selectElement = useLightingStore((s) => s.selectElement);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const sceneIdx = sceneIndex ? parseInt(sceneIndex, 10) : 0;

  // Load existing diagram on mount
  useEffect(() => {
    if (!user || !scriptId) return;
    let cancelled = false;

    async function load() {
      try {
        const existing = await repo.getDiagram(scriptId!, sceneIdx);
        if (cancelled) return;

        if (existing) {
          setDiagram(existing);
        } else {
          // Create a new empty diagram
          const newDiagram = await repo.saveDiagram({
            userId: user!.id,
            scriptId: scriptId!,
            sceneIndex: sceneIdx,
            sceneHeading: `Scene ${sceneIdx + 1}`,
            elements: [],
            canvasWidth: CANVAS_WIDTH,
            canvasHeight: CANVAS_HEIGHT,
          });
          if (!cancelled) setDiagram(newDiagram);
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load diagram');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, scriptId, sceneIdx, setDiagram]);

  // Auto-save debounced on element changes
  const autoSave = useCallback(() => {
    if (!diagram?.id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('unsaved');

    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await repo.updateDiagram(diagram.id, diagram.elements);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }, 800);
  }, [diagram]);

  // Trigger auto-save when elements change
  const elementsLength = diagram?.elements.length ?? 0;
  const elementsJson = JSON.stringify(diagram?.elements ?? []);
  useEffect(() => {
    if (!loading && diagram?.id) {
      autoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementsJson, elementsLength, loading]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // --- Handlers ---

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      updateElement(id, { x, y });
    },
    [updateElement],
  );

  const handleTransformEnd = useCallback(
    (id: string, updates: Partial<DiagramElement>) => {
      updateElement(id, updates);
    },
    [updateElement],
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Deselect when clicking on empty canvas
      if (e.target === e.target.getStage()) {
        selectElement(null);
      }
    },
    [selectElement],
  );

  const handleAddElement = useCallback(
    (entry: PaletteEntry) => {
      const newEl: DiagramElement = {
        id: generateId(),
        type: entry.type,
        symbolType: entry.symbolType,
        x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 100,
        y: CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 100,
        rotation: 0,
        label: entry.label,
        width: entry.type === 'wall' ? 100 : entry.type === 'window' ? 60 : entry.type === 'door' ? 40 : 30,
        height: entry.type === 'wall' ? 10 : entry.type === 'window' ? 8 : entry.type === 'door' ? 8 : 30,
      };
      addElement(newEl);
    },
    [addElement],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      removeElement(selectedElementId);
    }
  }, [selectedElementId, removeElement]);

  // Palette drag start (HTML5 drag)
  const handlePaletteDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, entry: PaletteEntry) => {
      e.dataTransfer.setData('application/json', JSON.stringify(entry));
      e.dataTransfer.effectAllowed = 'copy';
    },
    [],
  );

  // Drop onto canvas area
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;

      try {
        const entry: PaletteEntry = JSON.parse(raw);
        const stage = stageRef.current;
        if (!stage) return;

        // Calculate position relative to stage
        const stageBox = stage.container().getBoundingClientRect();
        const x = e.clientX - stageBox.left;
        const y = e.clientY - stageBox.top;

        const newEl: DiagramElement = {
          id: generateId(),
          type: entry.type,
          symbolType: entry.symbolType,
          x,
          y,
          rotation: 0,
          label: entry.label,
          width: entry.type === 'wall' ? 100 : entry.type === 'window' ? 60 : entry.type === 'door' ? 40 : 30,
          height: entry.type === 'wall' ? 10 : entry.type === 'window' ? 8 : entry.type === 'door' ? 8 : 30,
        };
        addElement(newEl);
      } catch {
        // Invalid drag data
      }
    },
    [addElement],
  );

  const handleCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading lighting diagram…</div>;
  }

  const elements = diagram?.elements ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to={`/editor/${scriptId}`} className={styles.backLink}>
          ← Back to Editor
        </Link>
        <h1 className={styles.title}>
          Lighting Diagram — {diagram?.sceneHeading ?? `Scene ${sceneIdx + 1}`}
        </h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleDeleteSelected}
          disabled={!selectedElementId}
        >
          Delete Selected
        </button>
        <span className={styles.saveStatus}>
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'unsaved' && '● Unsaved changes'}
        </span>
      </div>

      <div className={styles.workspace}>
        {/* Symbol Palette Sidebar */}
        <div className={styles.palette}>
          <div className={styles.paletteTitle}>Elements</div>

          <div className={styles.paletteSection}>
            <div className={styles.paletteSectionLabel}>Lights</div>
            {LIGHT_SYMBOLS.map((entry) => (
              <div
                key={entry.symbolType}
                className={styles.paletteItem}
                draggable
                onDragStart={(e) => handlePaletteDragStart(e, entry)}
                onClick={() => handleAddElement(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddElement(entry); }}
              >
                <span className={styles.paletteIcon}>{entry.icon}</span>
                {entry.label}
              </div>
            ))}
          </div>

          <div className={styles.paletteSection}>
            <div className={styles.paletteSectionLabel}>Markers</div>
            {MARKER_ITEMS.map((entry) => (
              <div
                key={entry.type}
                className={styles.paletteItem}
                draggable
                onDragStart={(e) => handlePaletteDragStart(e, entry)}
                onClick={() => handleAddElement(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddElement(entry); }}
              >
                <span className={styles.paletteIcon}>{entry.icon}</span>
                {entry.label}
              </div>
            ))}
          </div>

          <div className={styles.paletteSection}>
            <div className={styles.paletteSectionLabel}>Room</div>
            {SHAPE_ITEMS.map((entry) => (
              <div
                key={entry.type}
                className={styles.paletteItem}
                draggable
                onDragStart={(e) => handlePaletteDragStart(e, entry)}
                onClick={() => handleAddElement(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddElement(entry); }}
              >
                <span className={styles.paletteIcon}>{entry.icon}</span>
                {entry.label}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          className={styles.canvasArea}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          <div className={styles.canvasContainer}>
            <Stage
              ref={stageRef as React.RefObject<Konva.Stage>}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                {/* Background */}
                <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1a1a2e" />
                <GridLines width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

                {/* All diagram elements */}
                {elements.map((el) => (
                  <ElementShape
                    key={el.id}
                    element={el}
                    isSelected={selectedElementId === el.id}
                    onSelect={selectElement}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}

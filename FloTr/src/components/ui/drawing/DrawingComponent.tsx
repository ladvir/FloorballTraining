import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from '@tanstack/react-query';
import { activitiesApi } from '../../../api/activities.api';
import type { ActivityDto } from '../../../types/domain.types';
import './styles.css';
import FieldSelector, { DEFAULT_HEIGHT, DEFAULT_WIDTH, FieldOptions } from './FieldSelector';
import { getFieldOptionSvgMarkup } from './utils/fieldSvgUtils';
import PlayerSelector from "./PlayerSelector.tsx";
import { playerTools, PLAYER_STROKE_WIDTH, PLAYER_RADIUS } from "./playerConstants";
import EquipmentSelector, {
    type EquipmentTool,
    equipmentTools
} from "./EquipmentSelector.tsx";
import MovementSelector from "./MovementSelector";
import { type MovementTool, movementTools as movementToolList } from "./movementConstants";
import ExportDrawingButtons from './ExportDrawingButtons';
import { ActivitySearchModal } from './ActivitySearchModal';
import SelectionSelector, { selectionTools } from "./SelectionSelector";
import DeleteSelectionSelectorNumbers from './DeleteSelectionSelectorNumbers';
import NewSelector from './NewSelector';
import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine, TextItem, NumberItem, ShapeOnCanvas } from './DrawingTypes';
import { pointsToSmoothPath } from './DrawingUtils';
import PlayerLayer from './PlayerLayer';
import EquipmentLayer from './EquipmentLayer';
import LineLayer from './LineLayer';
import FreehandLayer from './FreehandLayer';
import SelectionRect from './SelectionRect';
import MarkersDefs from './MarkersDefs';
import PreviewLine from './PreviewLine';
import ImportedSVG from './ImportedSVG';
import UndoRedoToolbar from './UndoRedoToolbar';
import { DrawingScaleProvider } from './DrawingScaleContext';
import { type TextTool, textTools } from './TextSelector';
import TextLayer from './TextLayer';
import { type NumberSequenceTool, numberSequenceTools } from './NumberSequenceSelector';
import NumberSequenceLayer from './NumberSequenceLayer';
import ShapeSelector, { type ShapeTool } from './ShapeSelector';
import ShapeLayer from './ShapeLayer';
import LineDrawSelector, { type LineDrawConfig, configToMovementTool } from './LineDrawSelector';
import ToolDropdown from './ToolDropdown';
import FloatingPanel from './FloatingPanel';

// Utility imports
import { parseSvgXmlToCollections } from './utils/svgParser';
import { getSvgCoordinatesFromEvent, svgToScreenCoordinates } from './utils/svgCoordinates';
import { generateId } from './utils/idGenerator';
import { 
    getSafeSelectedItems, 
    EMPTY_SELECTION, 
    selectItemsInRect, 
    hasSelection,
    type SelectedItems 
} from './utils/selectionUtils';
import { 
    movePlayers, 
    moveEquipment, 
    moveLines, 
    moveFreehandLines, 
    moveTexts, 
    moveNumbers,
    moveShapes,
    type DragStartPositions
} from './utils/moveUtils';
import { useUndoRedo, type DrawingState } from './hooks/useUndoRedo';
import { useTextEditor } from './hooks/useTextEditor';

export interface DrawingSaveData {
    /** JSON string of the drawing state — for reloading and editing */
    stateJson: string
    /** SVG string — for display/thumbnails/PDF */
    svgString: string
}

/** Serializable drawing state for persistence */
export interface SerializableDrawingState {
    fieldId: string
    players: PlayerOnCanvas[]
    equipment: EquipmentOnCanvas[]
    lines: Line[]
    freehandLines: FreehandLine[]
    texts: TextItem[]
    numbers: NumberItem[]
    shapes: ShapeOnCanvas[]
}

function tryParseDrawingState(json: string | undefined): SerializableDrawingState | null {
    if (!json) return null
    try {
        const parsed = JSON.parse(json)
        if (parsed && typeof parsed === 'object' && 'fieldId' in parsed) return parsed as SerializableDrawingState
    } catch { /* not JSON */ }
    return null
}


const DrawingComponentInner = ({ svgXml, initialStateJson, onSave }: { svgXml?: string; initialStateJson?: string; onSave?: (data: DrawingSaveData) => void }) => {
    const svgCanvasRef = useRef<SVGSVGElement>(null!);
    const drawingAreaRef = useRef<HTMLDivElement>(null);
    
    // Try to restore from JSON state first, then fall back to svgXml
    const restoredState = useMemo(() => tryParseDrawingState(initialStateJson), [initialStateJson]);

    // Field selection
    const [selectedFieldId, setSelectedFieldId] = useState(restoredState?.fieldId ?? (svgXml ? 'null' : 'half-bottom'));
    const selectedField = useMemo(() => FieldOptions.find(f => f.id === selectedFieldId), [selectedFieldId]);
    
    // Drawing state
    const [drawing, setDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [preview, setPreview] = useState<Line | null>(null);
    const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);
    
    // Drawing items — initialize from restored state if available
    const [lines, setLines] = useState<Line[]>(restoredState?.lines ?? []);
    const [freehandLines, setFreehandLines] = useState<FreehandLine[]>(restoredState?.freehandLines ?? []);
    const [players, setPlayers] = useState<PlayerOnCanvas[]>(restoredState?.players ?? []);
    const [equipment, setEquipment] = useState<EquipmentOnCanvas[]>(restoredState?.equipment ?? []);
    const [texts, setTexts] = useState<TextItem[]>(restoredState?.texts ?? []);
    const [numbers, setNumbers] = useState<NumberItem[]>(restoredState?.numbers ?? []);
    const [shapes, setShapes] = useState<ShapeOnCanvas[]>(restoredState?.shapes ?? []);

    // Active tools
    const [activeMovementTool, setActiveMovementTool] = useState<MovementTool | null>(null);
    const [activePlayerTool, setActivePlayerTool] = useState<typeof playerTools[number] | null>(null);
    const [activeEquipmentTool, setActiveEquipmentTool] = useState<EquipmentTool | null>(null);
    const [activeTextTool, setActiveTextTool] = useState<TextTool | null>(null);
    const [activeNumberTool, setActiveNumberTool] = useState<NumberSequenceTool | null>(null);
    const [activeShapeTool, setActiveShapeTool] = useState<ShapeTool | null>(null);
    const [activeLineDrawConfig, setActiveLineDrawConfig] = useState<LineDrawConfig | null>(null);
    const [activeSelectionTool, setActiveSelectionTool] = useState<null | typeof selectionTools[0]>(selectionTools[0]);

    // Last-used tools (for displaying icon/label when tool is deactivated)
    const lastPlayerToolRef = useRef<typeof playerTools[number] | null>(null);
    const lastMovementToolRef = useRef<MovementTool | null>(null);
    const lastEquipmentToolRef = useRef<EquipmentTool | null>(equipmentTools[0]);
    const lastShapeToolRef = useRef<ShapeTool | null>(null);
    const lastLineDrawConfigRef = useRef<LineDrawConfig | null>(null);
    useEffect(() => { if (activePlayerTool) lastPlayerToolRef.current = activePlayerTool; }, [activePlayerTool]);
    useEffect(() => { if (activeMovementTool) lastMovementToolRef.current = activeMovementTool; }, [activeMovementTool]);
    useEffect(() => { if (activeEquipmentTool) lastEquipmentToolRef.current = activeEquipmentTool; }, [activeEquipmentTool]);
    useEffect(() => { if (activeShapeTool) lastShapeToolRef.current = activeShapeTool; }, [activeShapeTool]);
    useEffect(() => { if (activeLineDrawConfig) lastLineDrawConfigRef.current = activeLineDrawConfig; }, [activeLineDrawConfig]);
    
    // Selection
    const [selectedItems, setSelectedItems] = useState<SelectedItems>(EMPTY_SELECTION);
    const [selectionRect, setSelectionRect] = useState<null | { x1: number; y1: number; x2: number; y2: number }>(null);
    const [activeMoveTool, setActiveMoveTool] = useState<boolean>(false);
    
    // Number sequence
    const [numberStart, setNumberStart] = useState<number>(1);
    const numberNextRef = useRef<number>(1);
    const [lastNumberClickPos, setLastNumberClickPos] = useState<{ x: number; y: number } | null>(null);
    const handleNumberSet = useCallback((n: number) => {
        setNumberStart(n);
        numberNextRef.current = n;
    }, []);
    const handleNumberReset = useCallback(() => {
        setNumberStart(1);
        numberNextRef.current = 1;
    }, []);
    
    // Shape drawing state
    const [trianglePoints, setTrianglePoints] = useState<{ x: number; y: number }[]>([]);
    const trianglePointsRef = useRef<{ x: number; y: number }[]>([]);
    useEffect(() => { trianglePointsRef.current = trianglePoints; }, [trianglePoints]);
    const [shapePreview, setShapePreview] = useState<ShapeOnCanvas | null>(null);

    // Drag state
    const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
    const dragStartPositionsRef = useRef<DragStartPositions | null>(null);
    
    // Undo/Redo hook
    const undoRedo = useUndoRedo();
    
    // Text editor hook
    const textEditor = useTextEditor();

    // Activity search modal state
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [activityModalDrawingData, setActivityModalDrawingData] = useState<{ stateJson: string; svgString: string } | undefined>(undefined);
    const [savedToActivity, setSavedToActivity] = useState<string | null>(null);

    const serializeDrawing = useCallback(() => {
        const svg = svgCanvasRef.current;
        if (!svg) return null;

        const state: SerializableDrawingState = {
            fieldId: selectedFieldId,
            players, equipment, lines, freehandLines, texts, numbers, shapes,
        };
        const stateJson = JSON.stringify(state);

        if (!svg.hasAttribute('src')) svg.setAttribute('src', 'flotr');
        const clone = svg.cloneNode(true) as SVGSVGElement;
        if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        const vb = svg.viewBox?.baseVal;
        const width = vb?.width || DEFAULT_WIDTH;
        const height = vb?.height || DEFAULT_HEIGHT;
        clone.setAttribute('width', String(width));
        clone.setAttribute('height', String(height));
        if (!clone.getAttribute('viewBox') && vb) {
            clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
        }
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(clone);
        if (!svgString.startsWith('<?xml')) {
            svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
        }
        return { stateJson, svgString };
    }, [selectedFieldId, players, equipment, lines, freehandLines, texts, numbers, shapes]);

    const addToActivityMutation = useMutation({
        mutationFn: (activity: ActivityDto) => {
            const data = serializeDrawing();
            if (!data) throw new Error('SVG not available');

            return activitiesApi.addImage(activity.id, {
                name: 'kresba.svg',
                data: data.stateJson,
                preview: data.svgString,
                isThumbnail: !activity.activityMedium?.length,
            });
        },
        onSuccess: (_data, activity) => {
            setActivityModalOpen(false);
            setSavedToActivity(activity.name);
            setTimeout(() => setSavedToActivity(null), 3000);
        },
    });

    const handleActivityCreated = useCallback((activity: ActivityDto) => {
        setActivityModalOpen(false);
        setSavedToActivity(activity.name);
        setTimeout(() => setSavedToActivity(null), 3000);
    }, []);

    // Legacy setter for backward compatibility
    const legacySetSelectedItems = useCallback((value: { players: number[]; equipment: number[]; lines: number[]; freehandLines: number[] }) => {
        setSelectedItems({ ...value, texts: [], numbers: [], shapes: [] });
    }, []);
    
    // Safe setter for selected items
    const safeSetSelectedItems = useCallback((value: SelectedItems | ((prev: SelectedItems) => SelectedItems)) => {
        if (typeof value === 'function') {
            setSelectedItems(prev => {
                const base = getSafeSelectedItems(prev);
                const result = value(base) || {};
                return getSafeSelectedItems(result);
            });
        } else {
            setSelectedItems(getSafeSelectedItems(value));
        }
    }, []);
    
    // Get current drawing state
    const getCurrentDrawingState = useCallback((): DrawingState => ({
        lines,
        freehandLines,
        players,
        equipment,
        texts,
        numbers,
        shapes,
        selectedItems: getSafeSelectedItems(selectedItems)
    }), [lines, freehandLines, players, equipment, texts, numbers, shapes, selectedItems]);
    
    // Restore drawing state
    const restoreDrawingState = useCallback((state: DrawingState) => {
        setLines(state.lines);
        setFreehandLines(state.freehandLines);
        setPlayers(state.players);
        setEquipment(state.equipment);
        setTexts(state.texts || []);
        setNumbers(state.numbers || []);
        setShapes(state.shapes || []);
        safeSetSelectedItems(state.selectedItems);
    }, [safeSetSelectedItems]);
    
    // Undo/Redo handlers
    const handleUndo = useCallback(() => {
        const prevState = undoRedo.undo(getCurrentDrawingState());
        if (prevState) {
            restoreDrawingState(prevState);
        }
    }, [undoRedo, getCurrentDrawingState, restoreDrawingState]);
    
    const handleRedo = useCallback(() => {
        const nextState = undoRedo.redo(getCurrentDrawingState());
        if (nextState) {
            restoreDrawingState(nextState);
        }
    }, [undoRedo, getCurrentDrawingState, restoreDrawingState]);
    
    // Save history wrapper
    const saveHistory = useCallback(() => {
        undoRedo.saveHistory(getCurrentDrawingState());
    }, [undoRedo, getCurrentDrawingState]);
    
    // Add item functions with history
    const addLine = useCallback((line: Line) => {
        saveHistory();
        setLines(prev => [...prev, line]);
    }, [saveHistory]);
    
    const addFreehandLine = useCallback((line: FreehandLine) => {
        saveHistory();
        setFreehandLines(prev => [...prev, line]);
    }, [saveHistory]);
    
    const addPlayer = useCallback((player: PlayerOnCanvas) => {
        saveHistory();
        setPlayers(prev => [...prev, player]);
    }, [saveHistory]);
    
    const addEquipment = useCallback((item: EquipmentOnCanvas) => {
        saveHistory();
        setEquipment(prev => [...prev, item]);
    }, [saveHistory]);
    
    const addText = useCallback((text: TextItem) => {
        saveHistory();
        setTexts(prev => [...prev, text]);
    }, [saveHistory]);
    
    // Clear line draw config when movement tool changes to a non-line tool or null
    useEffect(() => {
        if (!activeMovementTool || !activeMovementTool.toolId.startsWith('line-')) {
            setActiveLineDrawConfig(null);
        }
    }, [activeMovementTool]);

    // Line draw tool handlers
    const handleLineDrawActivate = useCallback((config: LineDrawConfig) => {
        setActiveLineDrawConfig(config);
        setActiveMovementTool(configToMovementTool(config));
    }, []);

    const handleLineDrawDeactivate = useCallback(() => {
        setActiveLineDrawConfig(null);
        setActiveMovementTool(null);
    }, []);

    const addShape = useCallback((shape: ShapeOnCanvas) => {
        saveHistory();
        setShapes(prev => [...prev, shape]);
    }, [saveHistory]);

    const updateText = useCallback((id: string, newText: string, style?: { fontSize?: number; fontWeight?: string; fontStyle?: string }) => {
        saveHistory();
        setTexts(prev => prev.map(t => t.id === id ? { ...t, text: newText, ...(style && { fontSize: style.fontSize ?? t.fontSize, fontWeight: style.fontWeight, fontStyle: style.fontStyle }) } : t));
    }, [saveHistory]);
    
    const deleteText = useCallback((id: string) => {
        saveHistory();
        setTexts(prev => prev.filter(t => t.id !== id));
    }, [saveHistory]);

    const handleDown = useCallback((e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const svg = svgCanvasRef.current;
        if (!svg) return;
        
        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;
        
        // Number sequence - highest priority
        if (activeNumberTool) {
            const id = generateId('num');
            const currentVal = numberNextRef.current;
            numberNextRef.current = currentVal + 1;
            saveHistory();
            setNumbers(prev => [...prev, {
                id,
                x,
                y,
                value: currentVal,
                fontSize: activeNumberTool.fontSize,
                color: activeNumberTool.color
            }]);
            setLastNumberClickPos({ x, y });
            setDrawing(false);
            return;
        }
        
        // Shape tool
        if (activeShapeTool) {
            if (activeShapeTool.toolId === 'triangle') {
                const newPts = [...trianglePointsRef.current, { x, y }];
                if (newPts.length >= 3) {
                    addShape({
                        id: generateId('shp'),
                        type: 'triangle',
                        x: 0, y: 0, width: 0, height: 0,
                        cx: 0, cy: 0, r: 0,
                        points: newPts,
                        filled: activeShapeTool.filled,
                        strokeColor: '#1e3a5f',
                        fillColor: 'rgba(30, 58, 95, 0.3)',
                    });
                    setTrianglePoints([]);
                } else {
                    setTrianglePoints(newPts);
                }
                setDrawing(false);
                return;
            }
            if (activeShapeTool.toolId === 'ellipse') {
                const pts = trianglePointsRef.current;
                if (pts.length === 0) {
                    setTrianglePoints([{ x, y }]);
                } else {
                    const p1 = pts[0];
                    const cx = (p1.x + x) / 2;
                    const cy = (p1.y + y) / 2;
                    const rx = Math.abs(x - p1.x) / 2;
                    const ry = Math.abs(y - p1.y) / 2;
                    if (rx > 1 && ry > 1) {
                        addShape({
                            id: generateId('shp'),
                            type: 'ellipse',
                            x: 0, y: 0, width: rx, height: ry,
                            cx, cy, r: 0,
                            points: [],
                            filled: activeShapeTool.filled,
                            strokeColor: '#1e3a5f',
                            fillColor: 'rgba(30, 58, 95, 0.3)',
                        });
                    }
                    setTrianglePoints([]);
                }
                setDrawing(false);
                return;
            }
            // rect, square, circle — start drag
            setStartPoint({ x, y });
            setDrawing(true);
            return;
        }

        // Text tool: click creates textarea if not editing
        if (activeTextTool) {
            textEditor.startEditing({
                x,
                y,
                draft: '',
                fontSize: activeTextTool.fontSize,
                color: activeTextTool.color,
                fontWeight: activeTextTool.fontWeight,
                fontStyle: activeTextTool.fontStyle,
                mode: 'create'
            });
            setDrawing(false);
            return;
        }

        setStartPoint({ x, y });
        setDrawing(true);

        if (activePlayerTool) {
            addPlayer({ tool: activePlayerTool, x, y });
            setDrawing(false);
        } else if (activeEquipmentTool) {
            if (activeEquipmentTool.isLine) {
                // Line equipment: start drag, don't place yet
            } else {
                addEquipment({ tool: activeEquipmentTool, x, y });
                setDrawing(false);
            }
        } else if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints([{ x, y }]);
        } else if (activeSelectionTool) {
            setSelectionRect({ x1: x, y1: y, x2: x, y2: y });
        }
    }, [activeNumberTool, activeTextTool, activeShapeTool, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, textEditor, saveHistory, addPlayer, addEquipment, addShape]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!drawing) return;

        const svg = svgCanvasRef.current;
        if (!svg) return;

        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;

        if (activeEquipmentTool?.isLine && startPoint) {
            setPreview({
                x1: startPoint.x, y1: startPoint.y, x2: x, y2: y,
                color: activeEquipmentTool.stroke || '#333',
                type: activeEquipmentTool.toolId,
                dash: '4,4',
                arrow: false,
                strokeWidth: 1.5,
            });
            return;
        }

        if (activeShapeTool && startPoint && activeShapeTool.toolId !== 'triangle') {
            const filled = activeShapeTool.filled;
            const base: Omit<ShapeOnCanvas, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'cx' | 'cy' | 'r' | 'points'> = {
                filled,
                strokeColor: '#1e3a5f',
                fillColor: 'rgba(30, 58, 95, 0.3)',
            };
            if (activeShapeTool.toolId === 'circle') {
                const r = Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2);
                setShapePreview({ id: '', type: 'circle', x: 0, y: 0, width: 0, height: 0, cx: startPoint.x, cy: startPoint.y, r, points: [], ...base });
            } else if (activeShapeTool.toolId === 'square') {
                const side = Math.max(Math.abs(x - startPoint.x), Math.abs(y - startPoint.y));
                const sx = x >= startPoint.x ? startPoint.x : startPoint.x - side;
                const sy = y >= startPoint.y ? startPoint.y : startPoint.y - side;
                setShapePreview({ id: '', type: 'square', x: sx, y: sy, width: side, height: side, cx: 0, cy: 0, r: 0, points: [], ...base });
            } else {
                const rx = Math.min(startPoint.x, x);
                const ry = Math.min(startPoint.y, y);
                const rw = Math.abs(x - startPoint.x);
                const rh = Math.abs(y - startPoint.y);
                setShapePreview({ id: '', type: 'rectangle', x: rx, y: ry, width: rw, height: rh, cx: 0, cy: 0, r: 0, points: [], ...base });
            }
            return;
        }

        if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints(points => [...points, { x, y }]);
        } else if (startPoint && activeMovementTool) {
            setPreview({
                x1: startPoint.x,
                y1: startPoint.y,
                x2: x,
                y2: y,
                color: activeMovementTool.stroke,
                type: activeMovementTool.toolId,
                dash: activeMovementTool.strokeDasharray,
                arrow: activeMovementTool.arrow,
                strokeWidth: activeMovementTool.strokeWidth
            });
        } else if (activeSelectionTool && selectionRect) {
            setSelectionRect({ ...selectionRect, x2: x, y2: y });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawing, activeShapeTool, activeMovementTool, startPoint, activeSelectionTool, selectionRect]);

    const handleUp = useCallback((e: MouseEvent | TouchEvent) => {
        if (!drawing) return;
        
        const svg = svgCanvasRef.current;
        if (!svg) return;
        
        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;

        if (activeShapeTool && activeShapeTool.toolId !== 'triangle' && startPoint) {
            const filled = activeShapeTool.filled;
            const base = {
                filled,
                strokeColor: '#1e3a5f',
                fillColor: 'rgba(30, 58, 95, 0.3)',
            };
            if (activeShapeTool.toolId === 'circle') {
                const r = Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2);
                if (r > 2) {
                    addShape({ id: generateId('shp'), type: 'circle', x: 0, y: 0, width: 0, height: 0, cx: startPoint.x, cy: startPoint.y, r, points: [], ...base });
                }
            } else if (activeShapeTool.toolId === 'square') {
                const side = Math.max(Math.abs(x - startPoint.x), Math.abs(y - startPoint.y));
                if (side > 2) {
                    const sx = x >= startPoint.x ? startPoint.x : startPoint.x - side;
                    const sy = y >= startPoint.y ? startPoint.y : startPoint.y - side;
                    addShape({ id: generateId('shp'), type: 'square', x: sx, y: sy, width: side, height: side, cx: 0, cy: 0, r: 0, points: [], ...base });
                }
            } else {
                const rw = Math.abs(x - startPoint.x);
                const rh = Math.abs(y - startPoint.y);
                if (rw > 2 && rh > 2) {
                    addShape({ id: generateId('shp'), type: 'rectangle', x: Math.min(startPoint.x, x), y: Math.min(startPoint.y, y), width: rw, height: rh, cx: 0, cy: 0, r: 0, points: [], ...base });
                }
            }
            setShapePreview(null);
        } else if (activePlayerTool) {
            addPlayer({ tool: activePlayerTool, x, y });
        } else if (activeEquipmentTool) {
            if (activeEquipmentTool.isLine && startPoint) {
                const dist = Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2);
                if (dist > 5) {
                    addEquipment({ tool: activeEquipmentTool, x: startPoint.x, y: startPoint.y, x2: x, y2: y });
                }
            } else {
                addEquipment({ tool: activeEquipmentTool, x, y });
            }
        } else if (activeMovementTool && activeMovementTool.toolId === 'run-free' && freehandPoints.length > 1) {
            addFreehandLine({ 
                points: freehandPoints, 
                color: activeMovementTool.stroke, 
                dash: activeMovementTool.strokeDasharray, 
                strokeWidth: activeMovementTool.strokeWidth, 
                arrow: activeMovementTool.arrow 
            });
            setFreehandPoints([]);
        } else if (activeMovementTool && startPoint) {
            addLine({
                x1: startPoint.x,
                y1: startPoint.y,
                x2: x,
                y2: y,
                color: activeMovementTool.stroke,
                type: activeMovementTool.toolId,
                dash: activeMovementTool.strokeDasharray,
                arrow: activeMovementTool.arrow,
                strokeWidth: activeMovementTool.strokeWidth
            });
        } else if (activeSelectionTool && selectionRect) {
            const selected = selectItemsInRect(selectionRect, { players, equipment, lines, freehandLines, texts, numbers, shapes });
            setSelectedItems(selected);
        }
        
        setDrawing(false);
        setStartPoint(null);
        setPreview(null);
        setSelectionRect(null);
    }, [drawing, activeShapeTool, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, freehandPoints, startPoint, selectionRect, players, equipment, lines, freehandLines, texts, numbers, shapes, addPlayer, addEquipment, addFreehandLine, addLine, addShape]);

    const handleSelect = useCallback((type: 'player' | 'equipment' | 'line' | 'freehand' | 'text' | 'number' | 'shape', idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDrawing(false);
        const ctrl = e.ctrlKey || e.metaKey;
        if (!ctrl) {
            safeSetSelectedItems(EMPTY_SELECTION);
            return;
        }
        safeSetSelectedItems((prev: SelectedItems) => {
            const copy = { ...prev };
            const toggleItem = (arr: number[]) => arr.includes(idx) ? arr.filter(i => i !== idx) : [...arr, idx];
            if (type === 'player') copy.players = toggleItem(copy.players);
            else if (type === 'equipment') copy.equipment = toggleItem(copy.equipment);
            else if (type === 'line') copy.lines = toggleItem(copy.lines);
            else if (type === 'freehand') copy.freehandLines = toggleItem(copy.freehandLines);
            else if (type === 'text') copy.texts = toggleItem(copy.texts);
            else if (type === 'number') copy.numbers = toggleItem(copy.numbers);
            else if (type === 'shape') copy.shapes = toggleItem(copy.shapes);
            return copy;
        });
    }, [safeSetSelectedItems]);   
    
    useEffect(() => {
        if (!svgXml) return;
        const parsed = parseSvgXmlToCollections(svgXml);
        if (parsed.isFlotr) {
            setPlayers(parsed.players || []);
            setEquipment(parsed.equipment || []);
            setLines(parsed.lines || []);
            setFreehandLines(parsed.freehandLines || []);
        }
    }, [svgXml]);

    const handleMoveDown = useCallback((e: MouseEvent | TouchEvent) => {
        if (!activeMoveTool) return;
        
        const svg = svgCanvasRef.current;
        if (!svg) return;
        
        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;
        
        dragStartPointRef.current = { x, y };
        dragStartPositionsRef.current = {
            players: selectedItems.players.map(idx => ({ ...players[idx] })),
            equipment: selectedItems.equipment.map(idx => ({ ...equipment[idx] })),
            lines: selectedItems.lines.map(idx => ({ ...lines[idx] })),
            freehandLines: selectedItems.freehandLines.map(idx => ({ ...freehandLines[idx] })),
            texts: selectedItems.texts.map(idx => ({ ...texts[idx] })),
            numbers: selectedItems.numbers.map(idx => ({ ...numbers[idx] })),
            shapes: selectedItems.shapes.map(idx => ({ ...shapes[idx] }))
        };
    }, [activeMoveTool, selectedItems, players, equipment, lines, freehandLines, texts, numbers, shapes]);

    const handleMoveMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!activeMoveTool || !dragStartPointRef.current || !dragStartPositionsRef.current) return;
        
        const svg = svgCanvasRef.current;
        if (!svg) return;
        
        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;
        
        const dx = x - dragStartPointRef.current.x;
        const dy = y - dragStartPointRef.current.y;
        const bounds = {
            minX: 0,
            minY: 0,
            maxX: selectedField?.width || DEFAULT_WIDTH,
            maxY: selectedField?.height || DEFAULT_HEIGHT
        };
        
        setPlayers(prev => movePlayers(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
        setEquipment(prev => moveEquipment(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
        setLines(prev => moveLines(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
        setFreehandLines(prev => moveFreehandLines(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
        setTexts(prev => moveTexts(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
        setNumbers(prev => moveNumbers(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
        setShapes(prev => moveShapes(prev, selectedItems, dragStartPositionsRef.current!, dx, dy, bounds));
    }, [activeMoveTool, selectedItems, selectedField]);

    const handleMoveUp = useCallback(() => {
        if (!activeMoveTool) return;
        dragStartPointRef.current = null;
        dragStartPositionsRef.current = null;
        saveHistory();
    }, [activeMoveTool, saveHistory]);

    const handleSvgBackgroundClick = useCallback(() => {
        if (!textEditor.editingText) {
            const hasAnySelection = hasSelection(selectedItems);
            const noActiveTool = !drawing && !activePlayerTool && !activeEquipmentTool && !activeMovementTool && !activeSelectionTool && !activeTextTool && !activeNumberTool && !activeShapeTool;
            
            if (hasAnySelection && noActiveTool) {
                safeSetSelectedItems(EMPTY_SELECTION);
            }
            setSelectedItems(EMPTY_SELECTION);
        }
    }, [textEditor.editingText, selectedItems, drawing, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, activeTextTool, activeNumberTool, activeShapeTool, safeSetSelectedItems]);

    useEffect(() => {
        setActiveMoveTool(hasSelection(selectedItems));
    }, [selectedItems]);

    // Text editor keyboard handler (Escape to cancel)
    useEffect(() => {
        if (!textEditor.editingText) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                textEditor.stopEditing();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [textEditor]);

    // Close text editor when switching to a different tool
    useEffect(() => {
        if (textEditor.editingText && !activeTextTool) {
            textEditor.stopEditing();
        }
    }, [activeTextTool, activePlayerTool, activeEquipmentTool, activeMovementTool, activeNumberTool, activeShapeTool, activeSelectionTool]);

    // Registrace event listenerů s { passive: false } pro touch eventy
    useEffect(() => {
        const svg = svgCanvasRef.current;
        if (!svg) return;

        const downHandler = activeMoveTool ? handleMoveDown : handleDown;
        const moveHandler = activeMoveTool ? handleMoveMove : handleMove;
        const upHandler = activeMoveTool ? handleMoveUp : handleUp;

        // Mouse eventy
        svg.addEventListener('mousedown', downHandler as EventListener);
        svg.addEventListener('mousemove', moveHandler as EventListener);
        svg.addEventListener('mouseup', upHandler as EventListener);

        // Touch eventy s { passive: false }
        svg.addEventListener('touchstart', downHandler as EventListener, { passive: false });
        svg.addEventListener('touchmove', moveHandler as EventListener, { passive: false });
        svg.addEventListener('touchend', upHandler as EventListener, { passive: false });

        return () => {
            svg.removeEventListener('mousedown', downHandler as EventListener);
            svg.removeEventListener('mousemove', moveHandler as EventListener);
            svg.removeEventListener('mouseup', upHandler as EventListener);
            svg.removeEventListener('touchstart', downHandler as EventListener);
            svg.removeEventListener('touchmove', moveHandler as EventListener);
            svg.removeEventListener('touchend', upHandler as EventListener);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMoveTool, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, activeTextTool, activeNumberTool, activeShapeTool, drawing, startPoint, freehandPoints, selectionRect]);

    // Handler pro smazání všech vybraných objektů
    const handleDeleteSelected = useCallback(() => {
        saveHistory();
        if (selectedItems.players.length > 0) {
            setPlayers(prev => prev.filter((_, idx) => !selectedItems.players.includes(idx)));
        }
        if (selectedItems.equipment.length > 0) {
            setEquipment(prev => prev.filter((_, idx) => !selectedItems.equipment.includes(idx)));
        }
        if (selectedItems.lines.length > 0) {
            setLines(prev => prev.filter((_, idx) => !selectedItems.lines.includes(idx)));
        }
        if (selectedItems.freehandLines.length > 0) {
            setFreehandLines(prev => prev.filter((_, idx) => !selectedItems.freehandLines.includes(idx)));
        }
        if (selectedItems.texts.length > 0) {
            setTexts(prev => prev.filter((_, idx) => !selectedItems.texts.includes(idx)));
        }
        if (selectedItems.numbers.length > 0) {
            setNumbers(prev => prev.filter((_, idx) => !selectedItems.numbers.includes(idx)));
        }
        if (selectedItems.shapes.length > 0) {
            setShapes(prev => prev.filter((_, idx) => !selectedItems.shapes.includes(idx)));
        }
        safeSetSelectedItems(EMPTY_SELECTION);
        setActiveSelectionTool(selectionTools[0]);
    }, [selectedItems, saveHistory, safeSetSelectedItems]);

    // Handler pro rotaci vybraných prvků o 20° (každý kolem svého středu)
    const handleRotateSelected = useCallback(() => {
        if (!hasSelection(selectedItems)) return;
        saveHistory();

        const ANGLE_DEG = 20;
        const angle = (ANGLE_DEG * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Rotate point (x,y) around center (cx,cy)
        const rot = (x: number, y: number, cx: number, cy: number) => ({
            x: cx + (x - cx) * cos - (y - cy) * sin,
            y: cy + (x - cx) * sin + (y - cy) * cos
        });

        if (selectedItems.equipment.length > 0) {
            setEquipment(prev => prev.map((e, idx) => {
                if (!selectedItems.equipment.includes(idx)) return e;
                if (e.x2 !== undefined && e.y2 !== undefined) {
                    // Line-type equipment (ladder): rotate endpoints around midpoint
                    const cx = (e.x + e.x2) / 2;
                    const cy = (e.y + e.y2) / 2;
                    const r = rot(e.x, e.y, cx, cy);
                    const r2 = rot(e.x2, e.y2, cx, cy);
                    const result: EquipmentOnCanvas = { ...e, x: r.x, y: r.y, x2: r2.x, y2: r2.y };
                    if (e.balls) {
                        result.balls = e.balls.map(b => rot(b.x, b.y, cx, cy));
                    }
                    return result;
                }
                // Point-type equipment (gate, cone, etc.): increment rotation property
                return { ...e, rotation: ((e.rotation ?? 0) + ANGLE_DEG) % 360 };
            }));
        }
        if (selectedItems.lines.length > 0) {
            setLines(prev => prev.map((l, idx) => {
                if (!selectedItems.lines.includes(idx)) return l;
                const cx = (l.x1 + l.x2) / 2, cy = (l.y1 + l.y2) / 2;
                const r1 = rot(l.x1, l.y1, cx, cy);
                const r2 = rot(l.x2, l.y2, cx, cy);
                return { ...l, x1: r1.x, y1: r1.y, x2: r2.x, y2: r2.y };
            }));
        }
        if (selectedItems.freehandLines.length > 0) {
            setFreehandLines(prev => prev.map((f, idx) => {
                if (!selectedItems.freehandLines.includes(idx)) return f;
                const cx = f.points.reduce((s, p) => s + p.x, 0) / f.points.length;
                const cy = f.points.reduce((s, p) => s + p.y, 0) / f.points.length;
                return { ...f, points: f.points.map(p => rot(p.x, p.y, cx, cy)) };
            }));
        }
        if (selectedItems.shapes.length > 0) {
            setShapes(prev => prev.map((s, idx) => {
                if (!selectedItems.shapes.includes(idx)) return s;
                if (s.type === 'triangle' && s.points.length >= 3) {
                    const cx = (s.points[0].x + s.points[1].x + s.points[2].x) / 3;
                    const cy = (s.points[0].y + s.points[1].y + s.points[2].y) / 3;
                    const newPts = s.points.map(p => rot(p.x, p.y, cx, cy));
                    return { ...s, points: newPts };
                }
                // rectangle/square/ellipse — no visual rotation effect for circle, but rotate rect/square corners conceptually
                // For now these are axis-aligned, so rotation around own center has no positional effect
                return s;
            }));
        }
        // Players, texts, numbers are point-items — rotating around own center does nothing
    }, [selectedItems, saveHistory]);

    // Handler pro smazání všeho a vyprázdnění historie
    const handleNew = useCallback(() => {
        setPlayers([]);
        setEquipment([]);
        setLines([]);
        setFreehandLines([]);
        setTexts([]);
        setNumbers([]);
        setShapes([]);
        setTrianglePoints([]);
        undoRedo.clearHistory();
        setActivePlayerTool(null);
        setActiveEquipmentTool(null);
        setActiveMovementTool(null);
        setActiveTextTool(null);
        setActiveShapeTool(null);
        setActiveLineDrawConfig(null);
        safeSetSelectedItems(EMPTY_SELECTION);
        setActiveSelectionTool(selectionTools[0]);
    }, [undoRedo, safeSetSelectedItems]);

    // Funkce pro zahájení editace existujícího textu
    const startEditExistingText = useCallback((textItem: TextItem, e: React.MouseEvent) => {
        e.stopPropagation();
        textEditor.startEditing({
            id: textItem.id,
            x: textItem.x,
            y: textItem.y,
            draft: textItem.text,
            fontSize: textItem.fontSize,
            color: textItem.color,
            fontWeight: textItem.fontWeight,
            fontStyle: textItem.fontStyle,
            mode: 'edit'
        });
    }, [textEditor]);

    const handleSaveToActivity = useCallback(() => {
        const svg = svgCanvasRef.current;
        if (!svg || !onSave) return;

        // Serialize drawing state as JSON
        const state: SerializableDrawingState = {
            fieldId: selectedFieldId,
            players,
            equipment,
            lines,
            freehandLines,
            texts,
            numbers,
            shapes,
        };
        const stateJson = JSON.stringify(state);

        // Serialize SVG
        if (!svg.hasAttribute('src')) {
            svg.setAttribute('src', 'flotr');
        }
        const clone = svg.cloneNode(true) as SVGSVGElement;
        if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        const vb = svg.viewBox?.baseVal;
        const width = vb?.width || DEFAULT_WIDTH;
        const height = vb?.height || DEFAULT_HEIGHT;
        clone.setAttribute('width', String(width));
        clone.setAttribute('height', String(height));
        if (!clone.getAttribute('viewBox') && vb) {
            clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
        }
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(clone);
        if (!svgString.startsWith('<?xml')) {
            svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
        }

        onSave({ stateJson, svgString });
    }, [onSave, selectedFieldId, players, equipment, lines, freehandLines, texts, numbers, shapes]);

    // Helper: get the icon for the currently selected field
    const selectedFieldIcon = useMemo(() => {
        if (!selectedField) return null;
        const markup = getFieldOptionSvgMarkup(selectedField, FieldOptions);
        return (
            <span className="field-option-icon" dangerouslySetInnerHTML={{
                __html: markup
                    ? `<svg width='32' height='32' viewBox='0 0 ${selectedField.width} ${selectedField.height}'>${markup}</svg>`
                    : `<svg width='32' height='32' viewBox='0 0 ${selectedField.width} ${selectedField.height}'/>`
            }} />
        );
    }, [selectedField]);

    // Display tools: show last-used when the active tool is null
    const displayPlayerTool = activePlayerTool ?? lastPlayerToolRef.current;
    const displayMovementTool = activeMovementTool ?? lastMovementToolRef.current;
    const displayEquipmentTool = activeEquipmentTool ?? lastEquipmentToolRef.current;
    const displayShapeTool = activeShapeTool ?? lastShapeToolRef.current;
    const displayLineDrawConfig = activeLineDrawConfig ?? lastLineDrawConfigRef.current;

    return (
        <div id="drawing-component">
            {/* ===== TOP TOOLBAR ===== */}
            <div id="drawing-toolbar">
                <NewSelector
                    onNew={handleNew}
                    setActiveSelectionTool={setActiveSelectionTool}
                />
                {onSave && (
                    <div className="tool-item">
                        <button onClick={handleSaveToActivity} title="Uložit do aktivity">
                            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                        </button>
                        <span>Uložit</span>
                    </div>
                )}
                <ExportDrawingButtons svgRef={svgCanvasRef}/>
                <div className="tool-item">
                    <button onClick={() => { setActivityModalDrawingData(serializeDrawing() ?? undefined); setActivityModalOpen(true); }} title="Přidat kresbu k aktivitě">
                        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                    </button>
                    <span>K aktivitě</span>
                </div>
                <div className="toolbar-separator" />
                <UndoRedoToolbar
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    undoDisabled={!undoRedo.canUndo}
                    redoDisabled={!undoRedo.canRedo}
                />
                <div className="toolbar-separator" />
                <SelectionSelector
                    activeSelectionTool={activeSelectionTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveTextTool={setActiveTextTool}
                    setActiveNumberTool={setActiveNumberTool}
                    setActiveShapeTool={setActiveShapeTool}
                    setSelectedItems={legacySetSelectedItems}
                />
                <DeleteSelectionSelectorNumbers
                    hasSelection={hasSelection(selectedItems)}
                    onDeleteSelected={handleDeleteSelected}
                />
                {hasSelection(selectedItems) && (
                    <div className="tool-item">
                        <button onClick={handleRotateSelected} title="Otočit výběr o 20°">
                            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.5 2v6h-6"/>
                                <path d="M21.34 13.72A9 9 0 1 1 18.57 5.16L21.5 8"/>
                            </svg>
                        </button>
                        <span>Otočit</span>
                    </div>
                )}
            </div>

            {/* ===== CANVAS (full width) ===== */}
            <div id="drawing-canvas-wrapper">
            <div id="drawing-area" ref={drawingAreaRef}>
                <svg
                    id="svg-canvas"
                    ref={svgCanvasRef}
                    viewBox={`0 0 ${selectedField?.width || DEFAULT_WIDTH} ${selectedField?.height || DEFAULT_HEIGHT}`}
                >
                    <MarkersDefs/>
                    <rect
                        x={0} y={0}
                        width={selectedField?.width || DEFAULT_WIDTH}
                        height={selectedField?.height || DEFAULT_HEIGHT}
                        fill="transparent"
                        pointerEvents="all"
                        onClick={handleSvgBackgroundClick}
                    />
                    <ImportedSVG svgXml={svgXml || ''} isFlotr={!!svgXml && parseSvgXmlToCollections(svgXml).isFlotr}/>
                    <g id="field-layer" pointerEvents="none">
                        {selectedField && (
                            <g dangerouslySetInnerHTML={{__html: getFieldOptionSvgMarkup(selectedField, FieldOptions)}}/>
                        )}
                    </g>
                    <g id="content-layer">
                        <FreehandLayer freehandLines={freehandLines} selectedItems={selectedItems.freehandLines} handleSelect={handleSelect}/>
                        {drawing && activeMovementTool && activeMovementTool.toolId === 'run-free' && freehandPoints.length > 1 && (
                            <path
                                d={pointsToSmoothPath(freehandPoints, 5, 3)}
                                fill="none"
                                stroke={activeMovementTool.stroke || 'black'}
                                strokeWidth={activeMovementTool.strokeWidth || 2}
                                strokeDasharray={activeMovementTool.strokeDasharray || ''}
                                markerEnd={activeMovementTool.arrow ? `url(#arrow-${activeMovementTool.stroke.replace('#', '')})` : undefined}
                            />
                        )}
                        <LineLayer lines={lines} selectedItems={selectedItems.lines} handleSelect={handleSelect}/>
                        <PreviewLine preview={preview} activeMovementTool={activeMovementTool}/>
                        {preview && activeEquipmentTool?.isLine && !activeMovementTool && (() => {
                            const dx = preview.x2 - preview.x1, dy = preview.y2 - preview.y1;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < 5) return null;
                            const nx = -dy / dist, ny = dx / dist;
                            const halfW = 8, rungSpacing = 12;
                            const rungCount = Math.max(2, Math.floor(dist / rungSpacing) + 1);
                            return (
                                <g pointerEvents="none" opacity={0.5}>
                                    <line x1={preview.x1 + nx * halfW} y1={preview.y1 + ny * halfW} x2={preview.x2 + nx * halfW} y2={preview.y2 + ny * halfW} stroke="#e6b800" strokeWidth={2} />
                                    <line x1={preview.x1 - nx * halfW} y1={preview.y1 - ny * halfW} x2={preview.x2 - nx * halfW} y2={preview.y2 - ny * halfW} stroke="#e6b800" strokeWidth={2} />
                                    {Array.from({ length: rungCount }, (_, i) => {
                                        const t = rungCount === 1 ? 0 : i / (rungCount - 1);
                                        const px = preview.x1 + dx * t, py = preview.y1 + dy * t;
                                        return <line key={i} x1={px + nx * halfW} y1={py + ny * halfW} x2={px - nx * halfW} y2={py - ny * halfW} stroke="#333" strokeWidth={1.5} />;
                                    })}
                                </g>
                            );
                        })()}
                        <PlayerLayer players={players} selectedItems={selectedItems.players} handleSelect={handleSelect}/>
                        <EquipmentLayer equipment={equipment} selectedItems={selectedItems.equipment} handleSelect={handleSelect}/>
                        <TextLayer texts={texts} selectedItems={selectedItems.texts} handleSelect={handleSelect} onEditText={startEditExistingText}/>
                        <NumberSequenceLayer numbers={numbers} selectedItems={selectedItems.numbers} handleSelect={handleSelect}/>
                        <ShapeLayer shapes={shapes} selectedItems={selectedItems.shapes} handleSelect={handleSelect}/>
                        {shapePreview && shapePreview.type === 'circle' && (
                            <circle cx={shapePreview.cx} cy={shapePreview.cy} r={shapePreview.r} fill={shapePreview.filled ? shapePreview.fillColor : 'none'} stroke={shapePreview.strokeColor} strokeWidth={2} opacity={0.6} pointerEvents="none"/>
                        )}
                        {shapePreview && (shapePreview.type === 'rectangle' || shapePreview.type === 'square') && (
                            <rect x={shapePreview.x} y={shapePreview.y} width={shapePreview.width} height={shapePreview.height} fill={shapePreview.filled ? shapePreview.fillColor : 'none'} stroke={shapePreview.strokeColor} strokeWidth={2} opacity={0.6} pointerEvents="none"/>
                        )}
                        {trianglePoints.length > 0 && activeShapeTool?.toolId === 'triangle' && (
                            <g pointerEvents="none">
                                {trianglePoints.map((pt, i) => (
                                    <circle key={i} cx={pt.x} cy={pt.y} r={4} fill="#1e3a5f" />
                                ))}
                                {trianglePoints.length === 2 && (
                                    <line x1={trianglePoints[0].x} y1={trianglePoints[0].y} x2={trianglePoints[1].x} y2={trianglePoints[1].y} stroke="#1e3a5f" strokeWidth={2} strokeDasharray="4,4" />
                                )}
                            </g>
                        )}
                        {trianglePoints.length === 1 && activeShapeTool?.toolId === 'ellipse' && (
                            <g pointerEvents="none">
                                <circle cx={trianglePoints[0].x} cy={trianglePoints[0].y} r={4} fill="#1e3a5f" />
                            </g>
                        )}
                        <SelectionRect selectionRect={selectionRect}/>
                    </g>
                </svg>
            </div>
            {textEditor.editingText && (() => {
                const et = textEditor.editingText!;
                const svg = svgCanvasRef.current;
                const wrapperEl = svg?.closest('#drawing-canvas-wrapper') as HTMLElement | null;
                let panelPos = { x: 20, y: 20 };
                if (svg && wrapperEl) {
                    const screen = svgToScreenCoordinates(svg, et.x, et.y);
                    const wr = wrapperEl.getBoundingClientRect();
                    if (screen) panelPos = { x: screen.x - wr.left, y: Math.max(0, screen.y - wr.top - 40) };
                }
                return (
                    <FloatingPanel title={et.mode === 'create' ? 'Nový text' : 'Upravit text'} initialPosition={panelPos}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <label htmlFor="editTxtSize">Vel.:</label>
                                <input id="editTxtSize" type="number" min={8} max={72} value={et.fontSize}
                                    onChange={e => textEditor.updateStyle({ fontSize: Number(e.target.value) })}
                                    style={{ width: 50, padding: '2px 4px', textAlign: 'center' }} />
                                <button type="button" className={et.fontWeight === 'bold' ? 'selected' : ''}
                                    onClick={() => textEditor.updateStyle({ fontWeight: et.fontWeight === 'bold' ? undefined : 'bold' })}
                                    style={{ width: 28, padding: '2px', fontWeight: 'bold' }} title="Tučné">B</button>
                                <button type="button" className={et.fontStyle === 'italic' ? 'selected' : ''}
                                    onClick={() => textEditor.updateStyle({ fontStyle: et.fontStyle === 'italic' ? undefined : 'italic' })}
                                    style={{ width: 28, padding: '2px', fontStyle: 'italic' }} title="Kurzíva">I</button>
                            </div>
                            <textarea
                                autoFocus
                                value={et.draft}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => textEditor.updateDraft(e.target.value)}
                                placeholder="Zadejte text"
                                rows={3}
                                style={{
                                    width: '100%', padding: '4px 6px', resize: 'vertical',
                                    fontFamily: 'Arial, sans-serif', lineHeight: 1.2,
                                    fontSize: et.fontSize, color: et.color,
                                    fontWeight: et.fontWeight || 'normal',
                                    fontStyle: et.fontStyle || 'normal',
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                <button type="button" onClick={() => textEditor.stopEditing()} style={{ padding: '3px 10px' }}>Zrušit</button>
                                <button type="button" onClick={() => {
                                    const trimmed = et.draft.trim();
                                    if (trimmed) {
                                        if (et.mode === 'create') {
                                            const newId = generateId('txt');
                                            addText({ id: newId, x: et.x, y: et.y, text: trimmed, fontSize: et.fontSize, color: et.color, fontWeight: et.fontWeight, fontStyle: et.fontStyle });
                                        } else if (et.mode === 'edit' && et.id) {
                                            updateText(et.id, trimmed, { fontSize: et.fontSize, fontWeight: et.fontWeight, fontStyle: et.fontStyle });
                                        }
                                    } else if (et.mode === 'edit' && et.id) {
                                        deleteText(et.id);
                                    }
                                    textEditor.stopEditing();
                                }} style={{ padding: '3px 10px', fontWeight: 'bold' }}>OK</button>
                            </div>
                        </div>
                    </FloatingPanel>
                );
            })()}
            {activeNumberTool && lastNumberClickPos && (() => {
                const svg = svgCanvasRef.current;
                const wrapperEl = svg?.closest('#drawing-canvas-wrapper') as HTMLElement | null;
                let panelPos = { x: 20, y: 20 };
                if (svg && wrapperEl) {
                    const screen = svgToScreenCoordinates(svg, lastNumberClickPos.x, lastNumberClickPos.y);
                    const wr = wrapperEl.getBoundingClientRect();
                    if (screen) panelPos = { x: screen.x - wr.left, y: Math.max(0, screen.y - wr.top - 40) };
                }
                return (
                    <FloatingPanel title="Čísla" onClose={() => { setActiveNumberTool(null); setActiveSelectionTool(selectionTools[0]); setLastNumberClickPos(null); }} initialPosition={panelPos}>
                        <label htmlFor="numStart">Od:</label>
                        <input id="numStart" type="number" value={numberStart}
                            onChange={e => handleNumberSet(Number(e.target.value))}
                            style={{ width: 50, padding: '2px 4px', textAlign: 'center' }} />
                        <button type="button" onClick={handleNumberReset} style={{ padding: '2px 6px' }}>Reset</button>
                    </FloatingPanel>
                );
            })()}
            </div>

            {/* ===== BOTTOM TOOLBAR (dropdowns) ===== */}
            <div id="drawing-bottom-toolbar">
                <ToolDropdown
                    label={selectedField?.label || 'Prázdné'}
                    icon={selectedFieldIcon}
                    isActive={false}
                >
                    <FieldSelector options={FieldOptions} selectedId={selectedFieldId} onChange={setSelectedFieldId}/>
                </ToolDropdown>

                <ToolDropdown
                    label={displayPlayerTool?.label || 'Hráč'}
                    icon={
                        <svg width={32} height={32}>
                            {(displayPlayerTool==null) && (
                                <>
                                    <circle
                                        cx={16}
                                        cy={16}
                                        r={PLAYER_RADIUS - 2}
                                        fill='black'
                                        stroke='black'
                                        strokeWidth={PLAYER_STROKE_WIDTH}
                                    />
                                </>
                            )}


                            {(displayPlayerTool?.type === "playerB" || displayPlayerTool?.type === "coach") && (
                                <>
                                    <circle
                                        cx={16}
                                        cy={16}
                                        r={displayPlayerTool.radius - 2}
                                        fill={displayPlayerTool.fill}
                                        stroke={displayPlayerTool.stroke}
                                        strokeWidth={displayPlayerTool.strokeWidth}
                                    />
                                    {displayPlayerTool?.text && (
                                        <text
                                            x={16}
                                            y={21}
                                            textAnchor="middle"
                                            fontSize={14}
                                            fill={displayPlayerTool.textColor}
                                        >
                                            {displayPlayerTool.text}
                                        </text>
                                    )}
                                </>
                            )}

                            {displayPlayerTool?.type === "playerC" && (
                                <polygon
                                    points="16,2 30,30 2,30"
                                    fill={displayPlayerTool.fill}
                                    stroke={displayPlayerTool.stroke}
                                    strokeWidth={displayPlayerTool.strokeWidth}
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>

                    }
                    isActive={!!activePlayerTool}
                >
                    <PlayerSelector
                        playerTools={playerTools}
                        activePlayerTool={activePlayerTool}
                        setActivePlayerTool={setActivePlayerTool}
                        setActiveEquipmentTool={setActiveEquipmentTool}
                        setActiveMovementTool={setActiveMovementTool}
                        setActiveSelectionTool={setActiveSelectionTool}
                        setActiveTextTool={setActiveTextTool}
                        setActiveNumberTool={setActiveNumberTool}
                        setActiveShapeTool={setActiveShapeTool}
                        setSelectedItems={legacySetSelectedItems}
                    />
                </ToolDropdown>

                <ToolDropdown
                    label={displayMovementTool?.label || 'Běh'}
                    icon={
                        <svg width={32} height={32}>
                            <path d="M3,28 Q16,16 24,8" stroke={displayMovementTool?.stroke || '#000'} strokeWidth={1} strokeDasharray="4,2" fill="none" markerEnd="url(#arrow-000)"/>
                        </svg>
                    }
                    isActive={!!activeMovementTool}
                >
                    <MovementSelector
                        movementTools={movementToolList}
                        activeMovementTool={activeMovementTool}
                        setActiveMovementTool={setActiveMovementTool}
                        setActivePlayerTool={setActivePlayerTool}
                        setActiveEquipmentTool={setActiveEquipmentTool}
                        setActiveSelectionTool={setActiveSelectionTool}
                        setSelectedItems={legacySetSelectedItems}
                        setActiveNumberTool={setActiveNumberTool}
                        setActiveTextTool={setActiveTextTool}
                        setActiveShapeTool={setActiveShapeTool}
                    />
                </ToolDropdown>

                <ToolDropdown
                    label={displayEquipmentTool?.label || 'Vybavení'}
                    icon={
                        <svg width={32} height={32}>

                            {displayEquipmentTool?.toolId === "ball" && (
                                <path d="M 16.020005,26.591533 C 15.725572,26.562518 14.907253,26.42175 14.619426,26.350607 11.339227,25.539809 8.6969398,23.054494 7.6892804,19.832162 7.3579546,18.772635 7.2464448,17.910315 7.2770082,16.644002 7.3091711,15.311358 7.5374851,14.268954 8.0600606,13.06884 8.5662092,11.90645 9.1714533,11.0293 10.120603,10.0826 c 1.42133,-1.4176623 3.134538,-2.3154152 5.099239,-2.6720967 1.309587,-0.2377492 2.881435,-0.1758598 4.182744,0.1646897 3.424366,0.8961497 6.126626,3.655285 6.950647,7.096942 0.203358,0.849354 0.241946,1.214871 0.241255,2.285154 -5.57e-4,0.888557 -0.01102,1.072678 -0.0847,1.492723 -0.298304,1.700631 -0.864006,3.015579 -1.890754,4.394978 -0.476528,0.640197 -1.477811,1.592296 -2.185852,2.07848 -0.468862,0.321951 -1.296169,0.770334 -1.807379,0.979562 -0.617288,0.252644 -1.380533,0.468126 -2.136356,0.603144 -0.360067,0.06432 -0.617008,0.08095 -1.382151,0.08945 -0.516924,0.0058 -1.006205,0.0039 -1.087291,-0.0041 z m 2.027154,-0.681785 c 0.697694,-0.08731 1.492857,-0.286563 2.129377,-0.533585 0.363911,-0.141227 1.128016,-0.502865 1.279927,-0.60577 0.05068,-0.03433 0.208244,-0.134672 0.350145,-0.222981 0.26462,-0.164681 0.285175,-0.179057 0.663432,-0.46397 0.460256,-0.346678 1.243011,-1.122674 1.556294,-1.542856 0.0451,-0.06049 0.145089,-0.19291 0.222197,-0.294268 0.749523,-0.985241 1.331668,-2.364096 1.595002,-3.777878 0.09917,-0.532444 0.140731,-1.850568 0.07741,-2.455191 C 25.805556,14.91159 25.523555,13.950252 25.013974,12.921411 23.735638,10.340463 21.331022,8.5501518 18.45259,8.0362559 17.834886,7.9259754 16.614595,7.8902942 16.431537,7.9771576 c -0.179418,0.08514 -1.457407,0.2655178 -1.535532,0.2167279 -0.08832,-0.055153 -0.745019,0.12897 -1.346697,0.3775867 -0.762951,0.3152543 -1.383443,0.6590301 -1.915327,1.0611598 -0.101358,0.076631 -0.233778,0.1762295 -0.294268,0.2213302 -0.441734,0.3293528 -1.3458284,1.2503688 -1.6056373,1.6356898 -0.029442,0.04367 -0.1320538,0.189213 -0.2280234,0.323434 -0.9076267,1.269393 -1.4711523,2.9017 -1.5770869,4.568187 -0.1444355,2.272168 0.5770843,4.522229 2.0107344,6.270473 1.3728492,1.674103 3.2518442,2.779624 5.4168732,3.187062 0.746651,0.140512 1.89307,0.170737 2.690586,0.07093 z M 13.45004,23.93973 c -0.811847,-0.1968 -1.495855,-0.932014 -1.354723,-1.456139 0.157291,-0.584133 1.294341,-0.440779 1.969242,0.248272 0.363268,0.370885 0.475001,0.81963 0.259964,1.044081 -0.113898,0.118884 -0.375995,0.222751 -0.550168,0.218027 -0.06227,-0.0017 -0.208213,-0.0261 -0.324315,-0.05424 z m 6.115087,-0.383257 c -0.162858,-0.05256 -0.359903,-0.2209 -0.416159,-0.355539 -0.07376,-0.176541 -0.0634,-0.422036 0.02818,-0.667589 0.09958,-0.266997 0.463129,-0.640718 0.790386,-0.812503 0.439656,-0.230784 0.967953,-0.286508 1.285893,-0.135636 0.443957,0.210671 0.474109,0.801853 0.06628,1.299554 -0.166149,0.202763 -0.516586,0.464494 -0.784681,0.586055 -0.155336,0.07044 -0.280245,0.0951 -0.534431,0.105529 -0.182445,0.0075 -0.378406,-0.0014 -0.435471,-0.01987 z M 9.4385857,18.212292 C 9.2857256,18.130478 9.1479799,17.94317 9.0306515,17.657579 c -0.07117,-0.173241 -0.083305,-0.2697 -0.083447,-0.663433 -1.396e-4,-0.382964 0.013439,-0.49758 0.080439,-0.679155 0.203219,-0.550714 0.5273993,-0.74616 0.8578227,-0.517177 0.4770368,0.330587 0.5947368,1.568618 0.2042158,2.148055 -0.1902261,0.282249 -0.434655,0.382268 -0.6510963,0.266423 z m 6.5814193,-0.554084 c -0.486512,-0.106563 -0.816224,-0.325365 -1.090069,-0.723383 -0.267726,-0.389127 -0.336195,-0.967404 -0.169059,-1.427856 0.467036,-1.28667 2.168528,-1.500375 2.920911,-0.366862 0.394296,0.594031 0.347191,1.378296 -0.11719,1.951131 -0.333026,0.410801 -1.052259,0.674809 -1.544593,0.56697 z m 7.445183,-0.991023 c -0.34117,-0.155837 -0.631195,-0.61902 -0.7388,-1.179898 -0.05803,-0.302461 -0.06054,-0.381073 -0.02008,-0.626574 0.160055,-0.970876 0.950901,-1.055754 1.474858,-0.158289 0.325259,0.557123 0.33936,1.321592 0.0326,1.76745 -0.178982,0.260142 -0.452944,0.332352 -0.748585,0.197311 z M 11.283836,11.502402 c -0.103088,-0.103088 -0.09962,-0.372392 0.0071,-0.548509 0.320408,-0.528941 0.96503,-0.9891396 1.485451,-1.0604714 0.209274,-0.028687 0.411164,0.06575 0.442146,0.2068084 0.06787,0.309006 -0.260459,0.797905 -0.773654,1.152014 -0.428868,0.295921 -0.993568,0.417596 -1.161006,0.250158 z m 7.51152,-1.109741 c -0.710473,-0.07266 -1.301058,-0.4855246 -1.301058,-0.9095459 0,-0.1400597 0.01753,-0.1780064 0.122806,-0.2658975 0.258409,-0.2157294 0.734855,-0.2732082 1.230099,-0.148401 0.64735,0.1631407 1.098109,0.5153111 1.098109,0.8579359 0,0.1156515 -0.02509,0.1706725 -0.122012,0.2675975 -0.183964,0.183963 -0.524967,0.249749 -1.027944,0.198311 z"/>
                                )}

                            {displayEquipmentTool?.toolId === "gate" && (
                                <path d="M 16.020005,26.591533 C 15.725572,26.562518 14.907253,26.42175 14.619426,26.350607 11.339227,25.539809 8.6969398,23.054494 7.6892804,19.832162 7.3579546,18.772635 7.2464448,17.910315 7.2770082,16.644002 7.3091711,15.311358 7.5374851,14.268954 8.0600606,13.06884 8.5662092,11.90645 9.1714533,11.0293 10.120603,10.0826 c 1.42133,-1.4176623 3.134538,-2.3154152 5.099239,-2.6720967 1.309587,-0.2377492 2.881435,-0.1758598 4.182744,0.1646897 3.424366,0.8961497 6.126626,3.655285 6.950647,7.096942 0.203358,0.849354 0.241946,1.214871 0.241255,2.285154 -5.57e-4,0.888557 -0.01102,1.072678 -0.0847,1.492723 -0.298304,1.700631 -0.864006,3.015579 -1.890754,4.394978 -0.476528,0.640197 -1.477811,1.592296 -2.185852,2.07848 -0.468862,0.321951 -1.296169,0.770334 -1.807379,0.979562 -0.617288,0.252644 -1.380533,0.468126 -2.136356,0.603144 -0.360067,0.06432 -0.617008,0.08095 -1.382151,0.08945 -0.516924,0.0058 -1.006205,0.0039 -1.087291,-0.0041 z m 2.027154,-0.681785 c 0.697694,-0.08731 1.492857,-0.286563 2.129377,-0.533585 0.363911,-0.141227 1.128016,-0.502865 1.279927,-0.60577 0.05068,-0.03433 0.208244,-0.134672 0.350145,-0.222981 0.26462,-0.164681 0.285175,-0.179057 0.663432,-0.46397 0.460256,-0.346678 1.243011,-1.122674 1.556294,-1.542856 0.0451,-0.06049 0.145089,-0.19291 0.222197,-0.294268 0.749523,-0.985241 1.331668,-2.364096 1.595002,-3.777878 0.09917,-0.532444 0.140731,-1.850568 0.07741,-2.455191 C 25.805556,14.91159 25.523555,13.950252 25.013974,12.921411 23.735638,10.340463 21.331022,8.5501518 18.45259,8.0362559 17.834886,7.9259754 16.614595,7.8902942 16.431537,7.9771576 c -0.179418,0.08514 -1.457407,0.2655178 -1.535532,0.2167279 -0.08832,-0.055153 -0.745019,0.12897 -1.346697,0.3775867 -0.762951,0.3152543 -1.383443,0.6590301 -1.915327,1.0611598 -0.101358,0.076631 -0.233778,0.1762295 -0.294268,0.2213302 -0.441734,0.3293528 -1.3458284,1.2503688 -1.6056373,1.6356898 -0.029442,0.04367 -0.1320538,0.189213 -0.2280234,0.323434 -0.9076267,1.269393 -1.4711523,2.9017 -1.5770869,4.568187 -0.1444355,2.272168 0.5770843,4.522229 2.0107344,6.270473 1.3728492,1.674103 3.2518442,2.779624 5.4168732,3.187062 0.746651,0.140512 1.89307,0.170737 2.690586,0.07093 z M 13.45004,23.93973 c -0.811847,-0.1968 -1.495855,-0.932014 -1.354723,-1.456139 0.157291,-0.584133 1.294341,-0.440779 1.969242,0.248272 0.363268,0.370885 0.475001,0.81963 0.259964,1.044081 -0.113898,0.118884 -0.375995,0.222751 -0.550168,0.218027 -0.06227,-0.0017 -0.208213,-0.0261 -0.324315,-0.05424 z m 6.115087,-0.383257 c -0.162858,-0.05256 -0.359903,-0.2209 -0.416159,-0.355539 -0.07376,-0.176541 -0.0634,-0.422036 0.02818,-0.667589 0.09958,-0.266997 0.463129,-0.640718 0.790386,-0.812503 0.439656,-0.230784 0.967953,-0.286508 1.285893,-0.135636 0.443957,0.210671 0.474109,0.801853 0.06628,1.299554 -0.166149,0.202763 -0.516586,0.464494 -0.784681,0.586055 -0.155336,0.07044 -0.280245,0.0951 -0.534431,0.105529 -0.182445,0.0075 -0.378406,-0.0014 -0.435471,-0.01987 z M 9.4385857,18.212292 C 9.2857256,18.130478 9.1479799,17.94317 9.0306515,17.657579 c -0.07117,-0.173241 -0.083305,-0.2697 -0.083447,-0.663433 -1.396e-4,-0.382964 0.013439,-0.49758 0.080439,-0.679155 0.203219,-0.550714 0.5273993,-0.74616 0.8578227,-0.517177 0.4770368,0.330587 0.5947368,1.568618 0.2042158,2.148055 -0.1902261,0.282249 -0.434655,0.382268 -0.6510963,0.266423 z m 6.5814193,-0.554084 c -0.486512,-0.106563 -0.816224,-0.325365 -1.090069,-0.723383 -0.267726,-0.389127 -0.336195,-0.967404 -0.169059,-1.427856 0.467036,-1.28667 2.168528,-1.500375 2.920911,-0.366862 0.394296,0.594031 0.347191,1.378296 -0.11719,1.951131 -0.333026,0.410801 -1.052259,0.674809 -1.544593,0.56697 z m 7.445183,-0.991023 c -0.34117,-0.155837 -0.631195,-0.61902 -0.7388,-1.179898 -0.05803,-0.302461 -0.06054,-0.381073 -0.02008,-0.626574 0.160055,-0.970876 0.950901,-1.055754 1.474858,-0.158289 0.325259,0.557123 0.33936,1.321592 0.0326,1.76745 -0.178982,0.260142 -0.452944,0.332352 -0.748585,0.197311 z M 11.283836,11.502402 c -0.103088,-0.103088 -0.09962,-0.372392 0.0071,-0.548509 0.320408,-0.528941 0.96503,-0.9891396 1.485451,-1.0604714 0.209274,-0.028687 0.411164,0.06575 0.442146,0.2068084 0.06787,0.309006 -0.260459,0.797905 -0.773654,1.152014 -0.428868,0.295921 -0.993568,0.417596 -1.161006,0.250158 z m 7.51152,-1.109741 c -0.710473,-0.07266 -1.301058,-0.4855246 -1.301058,-0.9095459 0,-0.1400597 0.01753,-0.1780064 0.122806,-0.2658975 0.258409,-0.2157294 0.734855,-0.2732082 1.230099,-0.148401 0.64735,0.1631407 1.098109,0.5153111 1.098109,0.8579359 0,0.1156515 -0.02509,0.1706725 -0.122012,0.2675975 -0.183964,0.183963 -0.524967,0.249749 -1.027944,0.198311 z"/>
                            )}

                            {displayEquipmentTool?.toolId === "low-cone" && (
                                <g>
                                    <path
                                        fill={displayEquipmentTool.fill}
                                        stroke={displayEquipmentTool.stroke}
                                        strokeWidth={displayEquipmentTool.strokeWidth}
                                        d="M25.0329,18.0406c0.0011-0.0208,0.0091-0.0401,0.0091-0.0611c0-0.017-0.008-0.0313-0.0096-0.0478   c-0.0031-0.033-0.0096-0.064-0.0194-0.0962c-0.0104-0.0338-0.0231-0.0646-0.04-0.095c-0.0076-0.0137-0.0089-0.0291-0.0178-0.0423   l-4.1357-6.0697C20.5443,10.414,17.7112,10.0801,16,10.0801c-1.7117,0-4.5448,0.3339-4.8199,1.5485l-4.1347,6.0697   c-0.009,0.0132-0.0104,0.0287-0.018,0.0425c-0.0167,0.03-0.0294,0.0605-0.0397,0.0939c-0.0101,0.0328-0.0167,0.0645-0.0198,0.0982   c-0.0016,0.0161-0.0094,0.0301-0.0094,0.0466c0,0.0206,0.0079,0.0395,0.0089,0.0598c0.0022,0.0182,0.0037,0.0356,0.0079,0.0535   c0.178,1.8553,4.6221,2.8271,9.0247,2.8271c4.4031,0,8.8483-0.972,9.0253-2.8278C25.0293,18.0749,25.0307,18.0582,25.0329,18.0406z    M19.8193,11.8223c-0.252,0.252-1.5254,0.7422-3.8193,0.7422c-2.4458,0-3.7319-0.5566-3.8564-0.6953   c0.125-0.2324,1.4116-0.7891,3.8564-0.7891C18.293,11.0801,19.5674,11.5703,19.8193,11.8223z"
                                    />
                                </g>
                            )}

                            {displayEquipmentTool?.toolId === "slalom-pole" && (
                                <g>
                                <path fill="#D68847" d="M23.5 28.8H8.5c-.75 0-1.33-.58-1.33-1.33s.58-1.33 1.33-1.33h15c.75 0 1.33.58 1.33 1.33s-.58 1.33-1.33 1.33"/>

                                <g fill="#ECBA16">
                                <polygon points="23.06 26.15 19.75 12.02 16 12.02 12.21 12.02 8.94 26.15"/>
                                <path d="M18.74 7.62l-.88-3.75c-.09-.4-.44-.66-.84-.66h-2.12c-.4 0-.75.26-.84.66l-.88 3.75H16h2.74z"/>
                                </g>

                                <g fill="#F7F6DD">
                                <polygon points="19.75 12.02 18.74 7.62 16 7.62 13.18 7.62 12.21 12.02 16 12.02"/>
                                <path d="M16 16.88h-4.94l-1.02 4.42H16h5.96l-1.02-4.42H16z"/>
                                </g>
                                </g>
                            )}

                            {displayEquipmentTool?.toolId === "ladder" && (
                                <path
                                    fill={displayEquipmentTool.fill}
                                    stroke={displayEquipmentTool.stroke}
                                    strokeWidth={displayEquipmentTool.strokeWidth}
                                    d="m25.303 4.3926-0.32715-0.29492c-0.09863-0.13086-0.29492-0.13086-0.42578 0l-20.451 20.451c-0.13086 0.13086-0.13086 0.32715 0 0.42578l0.29492 0.32715c0.13086 0.13086 0.32715 0.13086 0.458 0l2.6505-2.6505 2.88 2.8468-2.6835 2.6505c-0.09863 0.13086-0.09863 0.32715 0 0.458l0.32715 0.29492c0.09863 0.13086 0.29492 0.13086 0.42578 0l20.451-20.451c0.13086-0.13086 0.13086-0.32715 0-0.42578l-0.29492-0.32715c-0.13086-0.09863-0.32715-0.09863-0.458 0l-2.6505 2.6835-2.8468-2.88 2.6505-2.6505c0.13086-0.13086 0.13086-0.32715 0-0.458zm-17.049 17.507 1.6358-1.669 2.88 2.88-1.669 1.6358zm2.3887-2.4219 1.669-1.6358 2.8468 2.88-1.6358 1.6358zm2.4219-2.3887 1.6358-1.6358 2.8468 2.8468-1.6358 1.669zm2.3887-2.3887 1.6358-1.6358 2.88 2.8468-1.669 1.6358zm2.3887-2.3887 1.6358-1.669 2.88 2.88-1.669 1.6358zm2.3887-2.4219 1.669-1.6358 2.8468 2.8468-1.6358 1.669z"
                                />
                            )}
                        </svg>
                    }
                    isActive={!!activeEquipmentTool}
                >
                    <EquipmentSelector
                        equipmentTools={equipmentTools}
                        activeEquipmentTool={activeEquipmentTool}
                        setActiveEquipmentTool={(tool) => setActiveEquipmentTool(tool)}
                        setActivePlayerTool={setActivePlayerTool}
                        setActiveMovementTool={setActiveMovementTool}
                        setActiveSelectionTool={setActiveSelectionTool}
                        setActiveTextTool={setActiveTextTool}
                        setActiveNumberTool={setActiveNumberTool}
                        setActiveShapeTool={setActiveShapeTool}
                        setSelectedItems={legacySetSelectedItems}
                    />
                </ToolDropdown>

                <ToolDropdown
                    label="Čára"
                    icon={
                        <svg width={32} height={32} viewBox="0 0 32 32">
                            <line x1="4" y1="28" x2="28" y2="4"
                                  stroke={displayLineDrawConfig?.color || '#888'}
                                  strokeWidth={displayLineDrawConfig?.thickness || 2}
                                  strokeDasharray={displayLineDrawConfig?.dash === 'dotted' ? '2,4' : displayLineDrawConfig?.dash === 'dashed' ? '8,4' : ''}
                            />
                        </svg>
                    }
                    isActive={!!activeLineDrawConfig}
                >
                    <LineDrawSelector
                        activeConfig={activeLineDrawConfig}
                        onActivate={handleLineDrawActivate}
                        onDeactivate={handleLineDrawDeactivate}
                        setActivePlayerTool={setActivePlayerTool}
                        setActiveEquipmentTool={setActiveEquipmentTool}
                        setActiveSelectionTool={setActiveSelectionTool}
                        setActiveTextTool={setActiveTextTool}
                        setActiveNumberTool={setActiveNumberTool}
                        setActiveShapeTool={setActiveShapeTool}
                        setSelectedItems={legacySetSelectedItems}
                    />
                </ToolDropdown>

                <div className="tool-item">
                    <button
                        className={activeTextTool ? 'selected' : ''}
                        onClick={() => {
                            if (activeTextTool) {
                                setActiveTextTool(null);
                                setActiveSelectionTool(selectionTools[0]);
                            } else {
                                setActiveTextTool(textTools[0]);
                                setActiveSelectionTool(null);
                            }
                            setActivePlayerTool(null);
                            setActiveEquipmentTool(null);
                            setActiveMovementTool(null);
                            setActiveNumberTool(null);
                            setActiveShapeTool(null);
                            legacySetSelectedItems({players: [], equipment: [], lines: [], freehandLines: []});
                        }}
                        title="Text"
                    >
                        <svg width={32} height={32} viewBox="0 0 24 24">
                            <text x="12" y="18" textAnchor="middle" fontSize="18" fill={activeTextTool ? '#000' : '#888'} fontWeight="bold">T</text>
                        </svg>
                    </button>
                    <span>Text</span>
                </div>

                <div className="tool-item">
                    <button
                        className={activeNumberTool ? 'selected' : ''}
                        onClick={() => {
                            if (activeNumberTool) {
                                setActiveNumberTool(null);
                                setActiveSelectionTool(selectionTools[0]);
                            } else {
                                setActiveNumberTool(numberSequenceTools[0]);
                                setActiveSelectionTool(null);
                            }
                            setActivePlayerTool(null);
                            setActiveEquipmentTool(null);
                            setActiveMovementTool(null);
                            setActiveTextTool(null);
                            setActiveShapeTool(null);
                            legacySetSelectedItems({players: [], equipment: [], lines: [], freehandLines: []});
                        }}
                        title="Číslo"
                    >
                        <svg width={32} height={32} viewBox="0 0 24 24">
                            <text x="12" y="18" textAnchor="middle" fontSize="16" fill={activeNumberTool ? '#000' : '#888'} fontWeight="bold">1.</text>
                        </svg>
                    </button>
                    <span>Číslo</span>
                </div>

                <ToolDropdown
                    label={displayShapeTool?.label || 'Tvary'}
                    icon={
                        <svg width={32} height={32} viewBox="0 0 32 32">
                            {displayShapeTool ? (
                                displayShapeTool.toolId === 'circle' ? (
                                    <circle cx="16" cy="16" r="12" fill={displayShapeTool.filled ? 'rgba(30,58,95,0.3)' : 'none'} stroke="#1e3a5f" strokeWidth="2" />
                                ) : displayShapeTool.toolId === 'triangle' ? (
                                    <polygon points="16,4 28,28 4,28" fill={displayShapeTool.filled ? 'rgba(30,58,95,0.3)' : 'none'} stroke="#1e3a5f" strokeWidth="2" strokeLinejoin="round" />
                                ) : displayShapeTool.toolId === 'square' ? (
                                    <rect x="6" y="6" width="20" height="20" fill={displayShapeTool.filled ? 'rgba(30,58,95,0.3)' : 'none'} stroke="#1e3a5f" strokeWidth="2" />
                                ) : displayShapeTool.toolId === 'ellipse' ? (
                                    <ellipse cx="16" cy="16" rx="14" ry="9" fill={displayShapeTool.filled ? 'rgba(30,58,95,0.3)' : 'none'} stroke="#1e3a5f" strokeWidth="2" />
                                ) : (
                                    <rect x="4" y="8" width="24" height="16" fill={displayShapeTool.filled ? 'rgba(30,58,95,0.3)' : 'none'} stroke="#1e3a5f" strokeWidth="2" />
                                )
                            ) : (
                                <>
                                    <rect x="4" y="4" width="12" height="12" fill="none" stroke="#888" strokeWidth="1.5" />
                                    <circle cx="22" cy="22" r="7" fill="none" stroke="#888" strokeWidth="1.5" />
                                </>
                            )}
                        </svg>
                    }
                    isActive={!!activeShapeTool}
                >
                    <ShapeSelector
                        activeShapeTool={activeShapeTool}
                        setActiveShapeTool={(tool) => { setActiveShapeTool(tool); setTrianglePoints([]); setShapePreview(null); }}
                        setActivePlayerTool={setActivePlayerTool}
                        setActiveEquipmentTool={setActiveEquipmentTool}
                        setActiveMovementTool={setActiveMovementTool}
                        setActiveSelectionTool={setActiveSelectionTool}
                        setActiveTextTool={setActiveTextTool}
                        setActiveNumberTool={setActiveNumberTool}
                        setSelectedItems={legacySetSelectedItems}
                    />
                </ToolDropdown>
            </div>

            <ActivitySearchModal
                isOpen={activityModalOpen}
                onClose={() => { setActivityModalOpen(false); setActivityModalDrawingData(undefined); }}
                onSelect={(activity) => addToActivityMutation.mutate(activity)}
                saving={addToActivityMutation.isPending}
                drawingData={activityModalDrawingData}
                onCreated={handleActivityCreated}
            />
            {savedToActivity && (
                <div className="fixed bottom-4 right-4 z-10000] rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
                    Kresba přidána k aktivitě: {savedToActivity}
                </div>
            )}
        </div>
    );


};

// Wrapper komponenta s DrawingScaleProvider
const DrawingComponent = ({ svgXml, initialStateJson, onSave }: { svgXml?: string; initialStateJson?: string; onSave?: (data: DrawingSaveData) => void }) => {
    return (
        <DrawingScaleProvider viewBoxWidth={DEFAULT_WIDTH} viewBoxHeight={DEFAULT_HEIGHT}>
            <DrawingComponentInner svgXml={svgXml} initialStateJson={initialStateJson} onSave={onSave} />
        </DrawingScaleProvider>
    );
};

export default DrawingComponent;


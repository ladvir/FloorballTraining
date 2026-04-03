import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from '@tanstack/react-query';
import { activitiesApi } from '../../../api/activities.api';
import type { ActivityDto } from '../../../types/domain.types';
import './styles.css';
import FieldSelector, { DEFAULT_HEIGHT, DEFAULT_WIDTH, FieldOptions } from './FieldSelector';
import { getFieldOptionSvgMarkup } from './utils/fieldSvgUtils';
import PlayerSelector, { playerTools } from "./PlayerSelector.tsx";
import EquipmentSelector, {
    type EquipmentTool,
    EQUIPMENT_BALL_RADIUS,
    equipmentTools
} from "./EquipmentSelector.tsx";
import MovementSelector, { type MovementTool, movementTools as movementToolList } from "./MovementSelector";
import ExportDrawingButtons from './ExportDrawingButtons';
import { ActivitySearchModal } from './ActivitySearchModal';
import SelectionSelector, { selectionTools } from "./SelectionSelector";
import DeleteSelectionSelectorNumbers from './DeleteSelectionSelectorNumbers';
import NewSelector from './NewSelector';
import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine, TextItem, NumberItem } from './DrawingTypes';
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
import { DrawingScaleProvider, useDrawingScale } from './DrawingScaleContext';
import TextSelector, { type TextTool } from './TextSelector';
import TextLayer from './TextLayer';
import NumberSequenceSelector, { type NumberSequenceTool } from './NumberSequenceSelector';
import NumberSequenceLayer from './NumberSequenceLayer';

// Utility imports
import { parseSvgXmlToCollections } from './utils/svgParser';
import { getSvgCoordinatesFromEvent, svgToScreenCoordinates } from './utils/svgCoordinates';
import { generateBalls } from './utils/ballsGenerator';
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
    const { scaleFactor } = useDrawingScale();

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
    
    // Active tools
    const [activeMovementTool, setActiveMovementTool] = useState<MovementTool | null>(null);
    const [activePlayerTool, setActivePlayerTool] = useState<typeof playerTools[number] | null>(null);
    const [activeEquipmentTool, setActiveEquipmentTool] = useState<EquipmentTool | null>(null);
    const [activeTextTool, setActiveTextTool] = useState<TextTool | null>(null);
    const [activeNumberTool, setActiveNumberTool] = useState<NumberSequenceTool | null>(null);
    const [activeSelectionTool, setActiveSelectionTool] = useState<null | typeof selectionTools[0]>(selectionTools[0]);
    
    // Selection
    const [selectedItems, setSelectedItems] = useState<SelectedItems>(EMPTY_SELECTION);
    const [selectionRect, setSelectionRect] = useState<null | { x1: number; y1: number; x2: number; y2: number }>(null);
    const [activeMoveTool, setActiveMoveTool] = useState<boolean>(false);
    
    // Number sequence
    const [numberStart, setNumberStart] = useState<number>(1);
    const numberNextRef = useRef<number>(numberStart);
    useEffect(() => { numberNextRef.current = numberStart; }, [numberStart]);
    
    // Drag state
    const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
    const dragStartPositionsRef = useRef<DragStartPositions | null>(null);
    
    // Undo/Redo hook
    const undoRedo = useUndoRedo();
    
    // Text editor hook
    const textEditor = useTextEditor();

    // Activity search modal state
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [savedToActivity, setSavedToActivity] = useState<string | null>(null);

    const addToActivityMutation = useMutation({
        mutationFn: (activity: ActivityDto) => {
            const svg = svgCanvasRef.current;
            if (!svg) throw new Error('SVG not available');

            const state: SerializableDrawingState = {
                fieldId: selectedFieldId,
                players, equipment, lines, freehandLines, texts, numbers,
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

            return activitiesApi.addImage(activity.id, {
                name: 'kresba.svg',
                data: stateJson,
                preview: svgString,
                isThumbnail: !activity.activityMedium?.length,
            });
        },
        onSuccess: (_data, activity) => {
            setActivityModalOpen(false);
            setSavedToActivity(activity.name);
            setTimeout(() => setSavedToActivity(null), 3000);
        },
    });

    // Legacy setter for backward compatibility
    const legacySetSelectedItems = useCallback((value: { players: number[]; equipment: number[]; lines: number[]; freehandLines: number[] }) => {
        setSelectedItems({ ...value, texts: [], numbers: [] });
    }, []);
    
    // Safe setter for selected items
    const safeSetSelectedItems = useCallback((value: any) => {
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
        selectedItems: getSafeSelectedItems(selectedItems)
    }), [lines, freehandLines, players, equipment, texts, numbers, selectedItems]);
    
    // Restore drawing state
    const restoreDrawingState = useCallback((state: DrawingState) => {
        setLines(state.lines);
        setFreehandLines(state.freehandLines);
        setPlayers(state.players);
        setEquipment(state.equipment);
        setTexts(state.texts || []);
        setNumbers(state.numbers || []);
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
    
    const updateText = useCallback((id: string, newText: string) => {
        saveHistory();
        setTexts(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
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
            setDrawing(false);
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
            if (activeEquipmentTool.toolId === 'many-balls') {
                const balls = generateBalls(activeEquipmentTool.radius ?? EQUIPMENT_BALL_RADIUS);
                addEquipment({ tool: activeEquipmentTool, x, y, balls });
            } else {
                addEquipment({ tool: activeEquipmentTool, x, y });
            }
            setDrawing(false);
        } else if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints([{ x, y }]);
        } else if (activeSelectionTool) {
            setSelectionRect({ x1: x, y1: y, x2: x, y2: y });
        }
    }, [activeNumberTool, activeTextTool, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, textEditor, saveHistory, addPlayer, addEquipment]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!drawing) return;
        
        const svg = svgCanvasRef.current;
        if (!svg) return;
        
        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;
        
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
    }, [drawing, activeMovementTool, startPoint, activeSelectionTool, selectionRect]);

    const handleUp = useCallback((e: MouseEvent | TouchEvent) => {
        if (!drawing) return;
        
        const svg = svgCanvasRef.current;
        if (!svg) return;
        
        const coords = getSvgCoordinatesFromEvent(svg, e);
        if (!coords) return;
        const { x, y } = coords;

        if (activePlayerTool) {
            addPlayer({ tool: activePlayerTool, x, y });
        } else if (activeEquipmentTool) {
            if (activeEquipmentTool.toolId === 'many-balls') {
                const balls = generateBalls(activeEquipmentTool.radius ?? EQUIPMENT_BALL_RADIUS);
                addEquipment({ tool: activeEquipmentTool, x, y, balls });
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
            const selected = selectItemsInRect(selectionRect, { players, equipment, lines, freehandLines, texts, numbers });
            setSelectedItems(selected);
        }
        
        setDrawing(false);
        setStartPoint(null);
        setPreview(null);
        setSelectionRect(null);
    }, [drawing, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, freehandPoints, startPoint, selectionRect, players, equipment, lines, freehandLines, texts, numbers, addPlayer, addEquipment, addFreehandLine, addLine]);

    const handleSelect = useCallback((type: 'player' | 'equipment' | 'line' | 'freehand' | 'text' | 'number', idx: number, e: React.MouseEvent) => {
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
            numbers: selectedItems.numbers.map(idx => ({ ...numbers[idx] }))
        };
    }, [activeMoveTool, selectedItems, players, equipment, lines, freehandLines, texts, numbers]);

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
            const noActiveTool = !drawing && !activePlayerTool && !activeEquipmentTool && !activeMovementTool && !activeSelectionTool && !activeTextTool && !activeNumberTool;
            
            if (hasAnySelection && noActiveTool) {
                safeSetSelectedItems(EMPTY_SELECTION);
            }
            setSelectedItems(EMPTY_SELECTION);
        }
    }, [textEditor.editingText, selectedItems, drawing, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, activeTextTool, activeNumberTool, safeSetSelectedItems]);

    useEffect(() => {
        setActiveMoveTool(hasSelection(selectedItems));
    }, [selectedItems]);

    // Text editor keyboard handler
    useEffect(() => {
        if (!textEditor.editingText) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            textEditor.handleKeyDown(e, (text) => {
                if (text.mode === 'create' && text.id) {
                    addText({ id: text.id, x: text.x, y: text.y, text: text.draft, fontSize: text.fontSize, color: text.color });
                } else if (text.mode === 'edit' && text.id) {
                    updateText(text.id, text.draft);
                }
            }, deleteText);
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [textEditor, addText, updateText, deleteText]);

    // Dynamické nastavení aspect-ratio pro responsivní zobrazení podle selectedField
    useEffect(() => {
        const drawingArea = drawingAreaRef.current;
        if (!drawingArea || !selectedField) return;

        const width = selectedField.width || DEFAULT_WIDTH;
        const height = selectedField.height || DEFAULT_HEIGHT;
        const aspectRatio = width / height;

        // Nastavení CSS proměnné pro aspect-ratio
        drawingArea.style.setProperty('--canvas-aspect-ratio', aspectRatio.toString());

        // Fallback pro starší prohlížeče - nastavení výšky dynamicky
        const updateHeight = () => {
            const currentWidth = drawingArea.offsetWidth;
            const calculatedHeight = currentWidth / aspectRatio;
            drawingArea.style.height = `${calculatedHeight}px`;
        };

        updateHeight();

        // Aktualizace při změně velikosti okna
        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(drawingArea);

        return () => {
            resizeObserver.disconnect();
        };
    }, [selectedField]);

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
    }, [activeMoveTool, activePlayerTool, activeEquipmentTool, activeMovementTool, activeSelectionTool, activeTextTool, activeNumberTool, drawing, startPoint, freehandPoints, selectionRect]);

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
        safeSetSelectedItems(EMPTY_SELECTION);
        setActiveSelectionTool(selectionTools[0]);
    }, [selectedItems, saveHistory, safeSetSelectedItems]);

    // Handler pro smazání všeho a vyprázdnění historie
    const handleNew = useCallback(() => {
        setPlayers([]);
        setEquipment([]);
        setLines([]);
        setFreehandLines([]);
        setTexts([]);
        setNumbers([]);
        undoRedo.clearHistory();
        setActivePlayerTool(null);
        setActiveEquipmentTool(null);
        setActiveMovementTool(null);
        setActiveTextTool(null);
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
    }, [onSave, selectedFieldId, players, equipment, lines, freehandLines, texts, numbers]);

    return (
        <div id="drawing-component">
            <div id="drawing-toolbar">
                <div className="drawing-toolbar-row">
                <NewSelector
                    onNew={handleNew}
                    setActiveSelectionTool={setActiveSelectionTool}
                />
                {onSave && (
                    <div className="tool-group">
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
                    </div>
                )}
                <ExportDrawingButtons svgRef={svgCanvasRef}/>
                <div className="tool-group">
                    <div className="tool-item">
                        <button onClick={() => setActivityModalOpen(true)} title="Přidat kresbu k aktivitě">
                            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                        </button>
                        <span>K aktivitě</span>
                    </div>
                </div>

                <UndoRedoToolbar
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    undoDisabled={!undoRedo.canUndo}
                    redoDisabled={!undoRedo.canRedo}
                />
                <SelectionSelector
                    activeSelectionTool={activeSelectionTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveTextTool={setActiveTextTool}
                    setActiveNumberTool={setActiveNumberTool}
                    setSelectedItems={legacySetSelectedItems}
                />
                <DeleteSelectionSelectorNumbers
                    hasSelection={hasSelection(selectedItems)}
                    onDeleteSelected={handleDeleteSelected}
                />
                </div>
                <div className="drawing-toolbar-row">
                <EquipmentSelector
                    equipmentTools={equipmentTools}
                    activeEquipmentTool={activeEquipmentTool}
                    setActiveEquipmentTool={(tool) => setActiveEquipmentTool(tool)}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveTextTool={setActiveTextTool}
                    setActiveNumberTool={setActiveNumberTool}
                    setSelectedItems={legacySetSelectedItems}
                />

                <TextSelector
                    activeTextTool={activeTextTool}
                    setActiveTextTool={setActiveTextTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveNumberTool={setActiveNumberTool}
                    setSelectedItems={legacySetSelectedItems}
                />
                <NumberSequenceSelector
                    activeNumberTool={activeNumberTool}

                    setActiveNumberTool={setActiveNumberTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveTextTool={setActiveTextTool}
                    setSelectedItems={legacySetSelectedItems}
                    startingValue={numberStart}
                    setStartingValue={setNumberStart}
                />

                </div>
                <div  className="drawing-toolbar-row">
                <PlayerSelector
                    playerTools={playerTools}
                    activePlayerTool={activePlayerTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveTextTool={setActiveTextTool}
                    setActiveNumberTool={setActiveNumberTool}
                    setSelectedItems={legacySetSelectedItems}
                />
                </div>

            </div>
            <div id="drawing-middle">
                <div id="drawing-toolbar-left" className="controls">
                    <FieldSelector options={FieldOptions} selectedId={selectedFieldId} onChange={setSelectedFieldId}/>
                </div>
                <div id="drawing-area" ref={drawingAreaRef}>
                    <svg
                        id="svg-canvas"
                        ref={svgCanvasRef}

                        viewBox={`-10 -10 ${(selectedField?.width || DEFAULT_WIDTH) / scaleFactor * ((selectedField?.width || DEFAULT_WIDTH) / (selectedField?.height || DEFAULT_HEIGHT))} ${(selectedField?.height || DEFAULT_HEIGHT) / scaleFactor * ((selectedField?.width || DEFAULT_WIDTH) / (selectedField?.height || DEFAULT_HEIGHT))}`}
                    >


                        <MarkersDefs/>

                        <rect
                            x={-10}
                            y={-10}

                            width={'100%'}
                            height={'100%'}

                            fill="transparent"
                            pointerEvents="all"
                            onClick={handleSvgBackgroundClick}
                        />
                        <ImportedSVG svgXml={svgXml || ''}
                                     isFlotr={!!svgXml && parseSvgXmlToCollections(svgXml).isFlotr}/>
                        <g id="field-layer" pointerEvents="none">
                            {selectedField && (
                                <g dangerouslySetInnerHTML={{__html: getFieldOptionSvgMarkup(selectedField, FieldOptions)}}/>
                            )}
                        </g>
                        <g id="content-layer">

                            <FreehandLayer freehandLines={freehandLines} selectedItems={selectedItems.freehandLines}
                                           handleSelect={handleSelect}/>
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
                            <PlayerLayer players={players} selectedItems={selectedItems.players}
                                         handleSelect={handleSelect}/>
                            <EquipmentLayer equipment={equipment} selectedItems={selectedItems.equipment}
                                            handleSelect={handleSelect}/>
                            <TextLayer texts={texts} selectedItems={selectedItems.texts} handleSelect={handleSelect}
                                       onEditText={startEditExistingText}/>
                            <NumberSequenceLayer numbers={numbers} selectedItems={selectedItems.numbers}
                                                 handleSelect={handleSelect}/>
                            <SelectionRect selectionRect={selectionRect}/>
                        </g>
                    </svg>
                    {textEditor.editingText && !activeSelectionTool && (() => {
                        const editingText = textEditor.editingText;
                        // Výpočet pixelové pozice
                        let left = editingText.x;
                        let top = editingText.y;
                        const svg = svgCanvasRef.current;
                        if (svg) {
                            const screenCoords = svgToScreenCoordinates(svg, editingText.x, editingText.y);
                            const areaRect = drawingAreaRef.current?.getBoundingClientRect();
                            if (screenCoords && areaRect) {
                                left = screenCoords.x - areaRect.left;
                                top = screenCoords.y - areaRect.top;
                            }
                        }
                        return (
                            <textarea
                                className="drawing-text-editor"
                                style={{
                                    left: left + 'px',
                                    top: top + 'px',
                                    fontSize: editingText.fontSize,
                                    color: editingText.color
                                }}
                                autoFocus
                                value={editingText.draft}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => textEditor.updateDraft(e.target.value)}
                                onBlur={() => {
                                    const trimmed = editingText.draft.trim();
                                    if (trimmed) {
                                        if (editingText.mode === 'create') {
                                            const newId = generateId('txt');
                                            addText({
                                                id: newId,
                                                x: editingText.x,
                                                y: editingText.y,
                                                text: trimmed,
                                                fontSize: editingText.fontSize,
                                                color: editingText.color
                                            });
                                        } else if (editingText.mode === 'edit' && editingText.id) {
                                            updateText(editingText.id, trimmed);
                                        }
                                    } else if (editingText.mode === 'edit' && editingText.id) {
                                        deleteText(editingText.id);
                                    }
                                    textEditor.stopEditing();
                                }}
                                placeholder={editingText.mode === 'create' ? 'Zadejte text' : ''}
                            />
                        );
                    })()}
                </div>
                <div id="drawing-toolbar-right" className="controls">
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
                    />
                </div>
            </div>
            <ActivitySearchModal
                isOpen={activityModalOpen}
                onClose={() => setActivityModalOpen(false)}
                onSelect={(activity) => addToActivityMutation.mutate(activity)}
                saving={addToActivityMutation.isPending}
            />
            {savedToActivity && (
                <div className="fixed bottom-4 right-4 z-[10000] rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
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


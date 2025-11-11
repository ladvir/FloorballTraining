import React, {useRef, useState, useEffect} from "react";
import './styles.css';
import FieldSelector, {DEFAULT_HEIGHT, DEFAULT_WIDTH, FieldOptions} from './FieldSelector';
import {getFieldOptionSvgMarkup} from './utils/fieldSvgUtils';
import PlayerSelector, {playerTools} from "./PlayerSelector.tsx";
import EquipmentSelector, {
    type EquipmentTool,
    EQUIPMENT_BALL_RADIUS,
    equipmentTools
} from "./EquipmentSelector.tsx";
import MovementSelector, {type MovementTool, movementTools as movementToolList} from "./MovementSelector";
import ExportDrawingButtons from './ExportDrawingButtons';
import SelectionSelector, { selectionTools } from "./SelectionSelector";
import DeleteSelectionSelector from './DeleteSelectionSelector';
import NewSelector from './NewSelector';
import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine } from './DrawingTypes';
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


function parseSvgXmlToCollections(svgXml: string): {
    isFlotr: boolean,
    players: PlayerOnCanvas[],
    equipment: EquipmentOnCanvas[],
    lines: Line[],
    freehandLines: FreehandLine[]
} {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(svgXml, "image/svg+xml");
    const svg = doc.querySelector('svg');
    if (!svg) return { isFlotr: false, players: [], equipment: [], lines: [], freehandLines: [] };
    const isFlotr = svg.getAttribute('src') === 'flotr';
    if (!isFlotr) return { isFlotr: false, players: [], equipment: [], lines: [], freehandLines: [] };
    // --- Hráči ---
    const players: PlayerOnCanvas[] = [];
    doc.querySelectorAll('circle[data-type="player"]').forEach(el => {
        players.push({
            tool: {
                toolId: el.getAttribute('data-tool-id') || 'player',
                category: 'player',
                label: el.getAttribute('data-label') || '',
                type: 'player',
                radius: Number(el.getAttribute('r')),
                fill: el.getAttribute('fill') || '',
                stroke: el.getAttribute('stroke') || '',
                strokeWidth: Number(el.getAttribute('stroke-width')),
                text: el.getAttribute('data-text') || '',
                textColor: el.getAttribute('data-text-color') || '#000'
            },
            x: Number(el.getAttribute('cx')),
            y: Number(el.getAttribute('cy'))
        });
    });
    // --- Vybavení ---
    const equipment: EquipmentOnCanvas[] = [];
    doc.querySelectorAll('[data-type="equipment"]').forEach(el => {
        const ballsAttr = el.getAttribute('data-balls');
        equipment.push({
            tool: {
                toolId: el.getAttribute('data-tool-id') || 'equipment',
                category: 'equipment',
                label: el.getAttribute('data-label') || '',
                type: 'equipment',
                radius: Number(el.getAttribute('r')),
                fill: el.getAttribute('fill') || undefined,
                stroke: el.getAttribute('stroke') || undefined,
                strokeWidth: Number(el.getAttribute('stroke-width')),
                width: Number(el.getAttribute('width')),
                height: Number(el.getAttribute('height')),
                length: Number(el.getAttribute('data-length'))
            },
            x: Number(el.getAttribute('cx')) || Number(el.getAttribute('x')) || 0,
            y: Number(el.getAttribute('cy')) || Number(el.getAttribute('y')) || 0,
            balls: ballsAttr ? JSON.parse(ballsAttr) : undefined
        });
    });
    // --- Čáry ---
    const lines: Line[] = [];
    doc.querySelectorAll('line[data-type="line"]').forEach(el => {
        lines.push({
            x1: Number(el.getAttribute('x1')),
            y1: Number(el.getAttribute('y1')),
            x2: Number(el.getAttribute('x2')),
            y2: Number(el.getAttribute('y2')),
            color: el.getAttribute('stroke') || '',
            type: el.getAttribute('data-line-type') || 'line',
            dash: el.getAttribute('stroke-dasharray') || '',
            arrow: el.getAttribute('data-arrow') === 'true',
            strokeWidth: Number(el.getAttribute('stroke-width'))
        });
    });
    // --- Freehand čáry ---
    const freehandLines: FreehandLine[] = [];
    doc.querySelectorAll('path[data-type="freehand"]').forEach(el => {
        const pointsAttr = el.getAttribute('data-points');
        const points = pointsAttr ? JSON.parse(pointsAttr) : [];
        freehandLines.push({
            points,
            color: el.getAttribute('stroke') || 'black',
            dash: el.getAttribute('stroke-dasharray') || '',
            strokeWidth: Number(el.getAttribute('stroke-width')),
            arrow: el.getAttribute('data-arrow') === 'true'
        });
    });
    return { isFlotr, players, equipment, lines, freehandLines };
}

const DrawingComponent = ({ svgXml }: { svgXml?: string }) => {
    const svgCanvasRef = useRef<SVGSVGElement>(null!);
    const [selectedFieldId, setSelectedFieldId] = useState(svgXml? 'null': 'half-bottom');
    const selectedField = FieldOptions.find(f => f.id === selectedFieldId) ;
    const [drawing, setDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
    const [activeMovementTool, setActiveMovementTool] = useState<MovementTool | null>(null);    
    const [lines, setLines] = useState<Line[]>([]);
    const [preview, setPreview] = useState<Line | null>(null);
    const [activePlayerTool, setActivePlayerTool] = useState<typeof playerTools[number] | null>(null);
    const [players, setPlayers] = useState<PlayerOnCanvas[]>([]);
    const [equipment, setEquipment] = useState<EquipmentOnCanvas[]>([]);
    const [activeEquipmentTool, setActiveEquipmentTool] = useState<EquipmentTool | null>(null);
    const [freehandPoints, setFreehandPoints] = useState<{x: number, y: number}[]>([]);
    const [freehandLines, setFreehandLines] = useState<{points: {x: number, y: number}[], color: string, dash: string, strokeWidth: number, arrow: boolean}[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [redoStack, setRedoStack] = useState<any[]>([]);
    const [activeSelectionTool, setActiveSelectionTool] = useState<null | typeof selectionTools[0]>(selectionTools[0]);
    const [selectionRect, setSelectionRect] = useState<null | {x1: number, y1: number, x2: number, y2: number}>(null);
    const [selectedItems, setSelectedItems] = useState<{players: number[], equipment: number[], lines: number[], freehandLines: number[]}>({players: [], equipment: [], lines: [], freehandLines: []} );
    const [activeMoveTool, setActiveMoveTool] = useState<boolean>(false);

    const getCurrentDrawingState = () => ({
        lines,
        freehandLines,
        players,
        equipment,
        selectedItems: selectedItems && typeof selectedItems === 'object' ? selectedItems : { players: [], equipment: [], lines: [], freehandLines: [] }
    });

    const restoreDrawingState = (state: any) => {
        setLines(state.lines);
        setFreehandLines(state.freehandLines);
        setPlayers(state.players);
        setEquipment(state.equipment);
        safeSetSelectedItems(state.selectedItems);
    };

    const saveHistory = () => {
        setHistory(prev => [...prev, getCurrentDrawingState()]);
        setRedoStack([]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        setRedoStack(prev => [...prev, getCurrentDrawingState()]);
        const prevState = history[history.length - 1];
        restoreDrawingState(prevState);
        setHistory(h => h.slice(0, h.length - 1));
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        setHistory(prev => [...prev, getCurrentDrawingState()]);
        const nextState = redoStack[redoStack.length - 1];
        restoreDrawingState(nextState);
        setRedoStack(r => r.slice(0, r.length - 1));
    };

    // --- wrap mutace ---
    const addLine = (line: Line) => {
        saveHistory();
        setLines([...lines, line]);
    };
    const addFreehandLine = (line: FreehandLine) => {
        saveHistory();
        setFreehandLines([...freehandLines, line]);
    };
    const addPlayer = (player: PlayerOnCanvas) => {
        saveHistory();
        setPlayers([...players, player]);
    };
    const addEquipment = (item: EquipmentOnCanvas) => {
        saveHistory();
        setEquipment([...equipment, item]);
    };


    const getSvgCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const svg = svgCanvasRef.current;
        if (!svg) return { x: 0, y: 0 };
        let clientX = 0, clientY = 0;
        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Převod souřadnic kurzoru do SVG souřadnic
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const svgP = pt.matrixTransform(ctm.inverse());
        
        return { x: svgP.x, y: svgP.y };
    };

    function generateBalls(equipmentRadius: number) {
        const radius = equipmentRadius ?? 6;
        const numBalls = Math.floor(Math.random() * 5) + 3;
        const spreadFactor = radius * 5;
        return Array.from({length: numBalls}).map(() => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * spreadFactor;
            return {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            };
        });        
    }

    const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const svg = svgCanvasRef.current;
        if (!svg) return;
        const { x, y } = getSvgCoords(e)?? { x: 0, y: 0 };
        setStartPoint({ x, y });
        setDrawing(true);
        if (activePlayerTool) {
            addPlayer({ tool: activePlayerTool, x: x, y:y });
            setDrawing(false);
        } else if (activeEquipmentTool) {
            if (activeEquipmentTool.toolId === 'many-balls') {
                const balls = generateBalls(activeEquipmentTool.radius ?? EQUIPMENT_BALL_RADIUS);
                addEquipment({ tool: activeEquipmentTool, x: x, y: y, balls });
            } else if (activeEquipmentTool) {
                addEquipment({tool: activeEquipmentTool, x: x, y: y});
            } else if (activeMovementTool) {
                setDrawing(true);
            }
            setDrawing(false);
        } else if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints([{x, y}]);
        } else if (activeSelectionTool) {
            setSelectionRect({ x1: x, y1: y, x2: x, y2: y });
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };
        if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints(points => [...points, {x, y}]);
        } else if (startPoint && activeMovementTool) {
            setPreview({ x1: startPoint.x, y1: startPoint.y, x2: x, y2: y, color: activeMovementTool.stroke, type: activeMovementTool.toolId, dash: activeMovementTool.strokeDasharray, arrow: activeMovementTool.arrow, strokeWidth: activeMovementTool.strokeWidth });
        } else if (activeSelectionTool && selectionRect) {
            setSelectionRect({ ...selectionRect, x2: x, y2: y });
        }
    };

    const handleUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };

        if (activePlayerTool) {
            addPlayer({ tool: activePlayerTool, x: x, y: y });
        } else if (activeEquipmentTool) {
            if (activeEquipmentTool.toolId === 'many-balls') {
                const radius = activeEquipmentTool.radius ?? 6;
                const numBalls = Math.floor(Math.random() * 5) + 3;
                const spreadFactor = radius * 5;
                const balls = Array.from({ length: numBalls }).map(() => {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * spreadFactor;
                    return {
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist
                    };
                });
                addEquipment({ tool: activeEquipmentTool, x: x, y: y, balls });
            } else {
                addEquipment({ tool: activeEquipmentTool, x: x, y: y });
            }
        } else if (activeMovementTool && activeMovementTool.toolId === 'run-free' && freehandPoints.length > 1) {
            addFreehandLine({ points: freehandPoints, color: activeMovementTool.stroke, dash: activeMovementTool.strokeDasharray, strokeWidth: activeMovementTool.strokeWidth, arrow: activeMovementTool.arrow});
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
                arrow: activeMovementTool.arrow ,
                strokeWidth: activeMovementTool.strokeWidth
            });
        } else if (activeSelectionTool && selectionRect) {
            const { x1, y1, x2, y2 } = selectionRect;
            const leftToRight = x2 > x1;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            // Zleva doprava: pouze zcela uvnitř
            // Zprava doleva: alespoň částečně uvnitř nebo dotýkající se
            const isInside = (px: number, py: number) => px > minX && px < maxX && py > minY && py < maxY;
            const isTouching = (px: number, py: number) => px >= minX && px <= maxX && py >= minY && py <= maxY;
            const selectPlayer = (player: PlayerOnCanvas) => leftToRight ? isInside(player.x, player.y) : isTouching(player.x, player.y);
            const selectEquipment = (item: EquipmentOnCanvas) => leftToRight ? isInside(item.x, item.y) : isTouching(item.x, item.y);
            const selectLine = (line: Line) => leftToRight ? (
                isInside(line.x1, line.y1) && isInside(line.x2, line.y2)
            ) : (
                isTouching(line.x1, line.y1) || isTouching(line.x2, line.y2)
            );
            const selectFreehandLine = (line: FreehandLine) => leftToRight ? (
                line.points.every((pt: {x: number, y: number}) => isInside(pt.x, pt.y))
            ) : (
                line.points.some((pt: {x: number, y: number}) => isTouching(pt.x, pt.y))
            );
            setSelectedItems({
                players: players.map((p, i) => selectPlayer(p) ? i : -1).filter(i => i !== -1),
                equipment: equipment.map((e, i) => selectEquipment(e) ? i : -1).filter(i => i !== -1),
                lines: lines.map((l, i) => selectLine(l) ? i : -1).filter(i => i !== -1),
                freehandLines: freehandLines.map((l, i) => selectFreehandLine(l) ? i : -1).filter(i => i !== -1)
            });
        }
        setDrawing(false);
        setStartPoint(null);
        setPreview(null);
        setSelectionRect(null);
    };

    // Pomocná funkce pro bezpečný výběr
const getSafeSelectedItems = (items: any) => {
    if (!items || typeof items !== 'object') {
        return { players: [], equipment: [], lines: [], freehandLines: [] };
    }
    return {
        players: Array.isArray(items.players) ? items.players : [],
        equipment: Array.isArray(items.equipment) ? items.equipment : [],
        lines: Array.isArray(items.lines) ? items.lines : [],
        freehandLines: Array.isArray(items.freehandLines) ? items.freehandLines : []
    };
};

// Pomocná funkce pro bezpečné nastavení selectedItems
const safeSetSelectedItems = (value: any) => {
    if (typeof value === 'function') {
        setSelectedItems((prev) => getSafeSelectedItems(value(prev)));
    } else {
        setSelectedItems(getSafeSelectedItems(value));
    }
};

    const handleSelect = (type: 'player'|'equipment'|'line'|'freehand', idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDrawing(false);
        const ctrl = e.ctrlKey || e.metaKey;
        // Pokud není zmáčknuté CTRL, vždy zruš výběr
        if (!ctrl) {
            safeSetSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [] });
            return;
        }
        // Pokud je zmáčknuté CTRL, chovej se jako dříve
        safeSetSelectedItems((prev: any) => {
            const copy = { ...getSafeSelectedItems(typeof prev === 'function' ? prev(selectedItems) : prev) };
            if (type === 'player') {
                copy.players = copy.players.includes(idx)
                    ? copy.players.filter((i: number) => i !== idx)
                    : [...copy.players, idx];
            } else if (type === 'equipment') {
                copy.equipment = copy.equipment.includes(idx)
                    ? copy.equipment.filter((i: number) => i !== idx)
                    : [...copy.equipment, idx];
            } else if (type === 'line') {
                copy.lines = copy.lines.includes(idx)
                    ? copy.lines.filter((i: number) => i !== idx)
                    : [...copy.lines, idx];
            } else if (type === 'freehand') {
                copy.freehandLines = copy.freehandLines.includes(idx)
                    ? copy.freehandLines.filter((i: number) => i !== idx)
                    : [...copy.freehandLines, idx];
            }
            return copy;
        });
    };
    
    
    // --- Vykreslení equipmentu ---
    const renderEquipmentOnCanvas = (item: EquipmentOnCanvas, idx: number) => {
        const tool = item.tool;
        if (tool.toolId === 'ball') {
            return <circle key={idx} cx={0} cy={0} r={tool.radius ?? 0} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />;
        } else if (tool.toolId === 'many-balls') {
            const radius = tool.radius ?? 6;
            return (
                <g key={idx}>
                    {(item.balls || []).map((b: {x: number, y: number}, i: number) => (
                        <circle key={i} cx={b.x} cy={b.y} r={radius} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />
                    ))}
                </g>
            );
        } else if (tool.toolId === 'gate') {
            const width = tool.width ?? 0;
            const height = tool.height ?? 0;
            return <rect key={idx} x={-width/2} y={-height/2} width={width} height={height} fill={tool.fill} stroke={tool.stroke} strokeWidth={2} />;
        } else if (tool.toolId === 'cone') {
            const h = tool.height ?? 0, r = tool.radius ?? 0;
            return <polygon key={idx} points={`0,${-h/2} ${r},${h/2} ${-r},${h/2}`} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />;        
        }
        return null;
    };


    const renderEquipmentHighlight = (item: EquipmentOnCanvas) => {
        const tool = item.tool;
        if (tool.toolId === 'many-balls' && item.balls && item.balls.length > 0) {
            return (
                <g>
                    {item.balls.map((b, i) => (
                        <circle
                            key={i}
                            cx={b.x}
                            cy={b.y}
                            r={(tool.radius ?? 6) + 4}
                            fill="rgba(0,128,255,0.1)"
                            stroke="#0080ff"
                            strokeDasharray="4 2"
                            strokeWidth={2}
                        />
                    ))}
                </g>
            );
        } else if (tool.toolId === 'ball') {
            return (
                <circle
                    r={(tool.radius ?? 6) + 4}
                    fill="rgba(0,128,255,0.1)"
                    stroke="#0080ff"
                    strokeDasharray="4 2"
                    strokeWidth={2}
                />
            );
        } else if (tool.toolId === 'gate') {
            const width = tool.width ?? 20;
            const height = tool.height ?? 20;
            return (
                <rect
                    x={-width/2 - 4}
                    y={-height/2 - 4}
                    width={width + 8}
                    height={height + 8}
                    fill="rgba(0,128,255,0.1)"
                    stroke="#0080ff"
                    strokeDasharray="4 2"
                    strokeWidth={2}
                />
            );
        } else if (tool.toolId === 'cone') {
            const h = tool.height ?? 20, r = tool.radius ?? 10;
            return (
                <polygon
                    points={`0,${-h/2 - 4} ${r + 4},${h/2 + 4} ${-r - 4},${h/2 + 4}`}
                    fill="rgba(0,128,255,0.1)"
                    stroke="#0080ff"
                    strokeDasharray="4 2"
                    strokeWidth={2}
                />
            );
        } else if (tool.toolId === 'barrier-line') {
            const length = tool.length ?? 20;
            return (
                <line
                    x1={-length/2 - 4}
                    y1={0}
                    x2={length/2 + 4}
                    y2={0}
                    stroke="#0080ff"
                    strokeDasharray="4 2"
                    strokeWidth={4}
                    opacity={0.5}
                />
            );
        } else if (tool.toolId === 'barrier-corner') {
            const r = tool.radius ?? 20;
            return (
                <path
                    d={`M 0 0 Q ${(r/2)+4} ${-r-4}, ${r+4} 0`}
                    fill="none"
                    stroke="#0080ff"
                    strokeDasharray="4 2"
                    strokeWidth={4}
                    opacity={0.5}
                />
            );
        }
        // fallback: kruh
        return (
            <circle
                r={20}
                fill="rgba(0,128,255,0.1)"
                stroke="#0080ff"
                strokeDasharray="4 2"
                strokeWidth={2}
            />
        );
    };
    

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

    const dragStartPointRef = useRef<{x: number, y: number} | null>(null);
    const dragStartPositionsRef = useRef<any>(null);

    const handleMoveDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!activeMoveTool) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };
        dragStartPointRef.current = { x, y };
        dragStartPositionsRef.current = {
            players: Array.isArray(selectedItems.players) ? selectedItems.players.map(idx => ({ ...players[idx] })) : [],
            equipment: Array.isArray(selectedItems.equipment) ? selectedItems.equipment.map(idx => ({ ...equipment[idx] })) : [],
            lines: Array.isArray(selectedItems.lines) ? selectedItems.lines.map(idx => ({ ...lines[idx] })) : [],
            freehandLines: Array.isArray(selectedItems.freehandLines) ? selectedItems.freehandLines.map(idx => ({ ...freehandLines[idx] })) : []
        };
    };

    const handleMoveMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!activeMoveTool || !dragStartPointRef.current) return;
        // Fallback inicializace, pokud by byl ref null
        if (!dragStartPositionsRef.current) {
            dragStartPositionsRef.current = {
                players: [],
                equipment: [],
                lines: [],
                freehandLines: []
            };
        }
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };
        const dx = x - dragStartPointRef.current.x;
        const dy = y - dragStartPointRef.current.y;
        // Získání hranic plátna
        const minX = 0, minY = 0;
        const maxX = selectedField?.width || DEFAULT_WIDTH;
        const maxY = selectedField?.height || DEFAULT_HEIGHT;
        // Přesun hráčů
        setPlayers(prev => prev.map((p, i) => {
            if (!dragStartPositionsRef.current || !dragStartPositionsRef.current.players) return p;
            const arr = Array.isArray(dragStartPositionsRef.current.players) ? dragStartPositionsRef.current.players : [];
            const selIdx = selectedItems.players.indexOf(i);
            if (!selectedItems.players.includes(i) || selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return p;
            let nx = arr[selIdx].x + dx;
            let ny = arr[selIdx].y + dy;
            nx = Math.max(minX, Math.min(maxX, nx));
            ny = Math.max(minY, Math.min(maxY, ny));
            return { ...p, x: nx, y: ny };
        }));
        // Přesun vybavení
        setEquipment(prev => prev.map((eq, i) => {
            if (!dragStartPositionsRef.current || !dragStartPositionsRef.current.equipment) return eq;
            const arr = Array.isArray(dragStartPositionsRef.current.equipment) ? dragStartPositionsRef.current.equipment : [];
            const selIdx = selectedItems.equipment.indexOf(i);
            if (!selectedItems.equipment.includes(i) || selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return eq;
            let nx = arr[selIdx].x + dx;
            let ny = arr[selIdx].y + dy;
            nx = Math.max(minX, Math.min(maxX, nx));
            ny = Math.max(minY, Math.min(maxY, ny));
            return { ...eq, x: nx, y: ny };
        }));
        // Přesun čar
        setLines(prev => prev.map((l, i) => {
            if (!dragStartPositionsRef.current || !dragStartPositionsRef.current.lines) return l;
            const arr = Array.isArray(dragStartPositionsRef.current.lines) ? dragStartPositionsRef.current.lines : [];
            const selIdx = selectedItems.lines.indexOf(i);
            if (!selectedItems.lines.includes(i) || selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return l;
            let l0 = arr[selIdx];
            let nx1 = l0.x1 + dx, ny1 = l0.y1 + dy;
            let nx2 = l0.x2 + dx, ny2 = l0.y2 + dy;
            const clamp = (val: number, min: number, max: number): number => Math.max(min, Math.min(max, val));
            nx1 = clamp(nx1, minX, maxX); ny1 = clamp(ny1, minY, maxY);
            nx2 = clamp(nx2, minX, maxX); ny2 = clamp(ny2, minY, maxY);
            return { ...l, x1: nx1, y1: ny1, x2: nx2, y2: ny2 };
        }));
        // Přesun freehand čar
        setFreehandLines(prev => prev.map((fl, i) => {
            if (!dragStartPositionsRef.current || !dragStartPositionsRef.current.freehandLines) return fl;
            const arr = Array.isArray(dragStartPositionsRef.current.freehandLines) ? dragStartPositionsRef.current.freehandLines : [];
            const selIdx = selectedItems.freehandLines.indexOf(i);
            if (!selectedItems.freehandLines.includes(i) || selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return fl;
            let orig = arr[selIdx].points;
            let newPoints = orig.map((pt: {x: number, y: number}) => {
                let nx = pt.x + dx, ny = pt.y + dy;
                nx = Math.max(minX, Math.min(maxX, nx));
                ny = Math.max(minY, Math.min(maxY, ny));
                return { x: nx, y: ny };
            });
            return { ...fl, points: newPoints };
        }));
    };

const handleMoveUp = () => {
    if (!activeMoveTool) return;
    dragStartPointRef.current = null;
    dragStartPositionsRef.current = null;
    saveHistory();
    // Výběr ponechávám beze změny
};

    const handleSvgBackgroundClick = () => {
        if (
            (getSafeSelectedItems(selectedItems).players.length > 0 || getSafeSelectedItems(selectedItems).equipment.length > 0 || getSafeSelectedItems(selectedItems).lines.length > 0 || getSafeSelectedItems(selectedItems).freehandLines.length > 0)
            && !drawing && !activePlayerTool && !activeEquipmentTool && !activeMovementTool && !activeSelectionTool
        ) {
            safeSetSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [] });
        }
        
        setSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [] });
    };

    useEffect(() => {
        // Aktivuj režim Přesun pokud je vybrán alespoň jeden prvek
        const hasSelection = selectedItems.players.length > 0 || selectedItems.equipment.length > 0 || selectedItems.lines.length > 0 || selectedItems.freehandLines.length > 0;
        setActiveMoveTool(hasSelection);
    }, [selectedItems]);

    // Handler pro smazání všech vybraných objektů
    const handleDeleteSelected = () => {
        saveHistory(); // Uložení stavu před smazáním pro Undo/Redo
        // Smazání hráčů
        if (selectedItems.players.length > 0) {
            setPlayers(prev => prev.filter((_, idx) => !selectedItems.players.includes(idx)));
        }
        // Smazání vybavení
        if (selectedItems.equipment.length > 0) {
            setEquipment(prev => prev.filter((_, idx) => !selectedItems.equipment.includes(idx)));
        }
        // Smazání čar
        if (selectedItems.lines.length > 0) {
            setLines(prev => prev.filter((_, idx) => !selectedItems.lines.includes(idx)));
        }
        // Smazání freehand čar
        if (selectedItems.freehandLines.length > 0) {
            setFreehandLines(prev => prev.filter((_, idx) => !selectedItems.freehandLines.includes(idx)));
        }
        // Vyprázdnění výběru
        safeSetSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [] });
        // Aktivace základního selection toolu
        setActiveSelectionTool(selectionTools[0]);
    };

    // Handler pro smazání všeho a vyprázdnění historie
    const handleNew = () => {
        setPlayers([]);
        setEquipment([]);
        setLines([]);
        setFreehandLines([]);
        setHistory([]);
        setRedoStack([]);
        safeSetSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [] });
        setActiveSelectionTool(selectionTools[0]);
    };

    return (
        <div>
            {/* Toolbar */}
            <div id="drawing-toolbar" className="controls toolbar">
                <FieldSelector options={FieldOptions} selectedId={selectedFieldId} onChange={setSelectedFieldId} />
                <PlayerSelector
                    playerTools={playerTools}
                    activePlayerTool={activePlayerTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setSelectedItems={setSelectedItems}
                />
                <EquipmentSelector
                    equipmentTools={equipmentTools}
                    activeEquipmentTool={activeEquipmentTool}
                    setActiveEquipmentTool={(tool) => setActiveEquipmentTool(tool)}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setSelectedItems={setSelectedItems}
                />
                <MovementSelector
                    movementTools={movementToolList}
                    activeMovementTool={activeMovementTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setSelectedItems={setSelectedItems}
                />
                <SelectionSelector
                    activeSelectionTool={activeSelectionTool}
                    setActiveSelectionTool={setActiveSelectionTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setSelectedItems={setSelectedItems}
                />
                <DeleteSelectionSelector
                    hasSelection={selectedItems.players.length > 0 || selectedItems.equipment.length > 0 || selectedItems.lines.length > 0 || selectedItems.freehandLines.length > 0}
                    onDeleteSelected={handleDeleteSelected}
                    setActiveSelectionTool={setActiveSelectionTool}
                />
                <NewSelector
                    onNew={handleNew}
                    setActiveSelectionTool={setActiveSelectionTool}
                />
                <ExportDrawingButtons svgRef={svgCanvasRef} />
                <UndoRedoToolbar
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  undoDisabled={history.length === 0}
                  redoDisabled={redoStack.length === 0}
                />
            </div>
            {/* Main Content Area */}
            <div id="container">
                <div id="drawing-area">
                    <svg
                        id="svg-canvas"
                        ref={svgCanvasRef}
                        viewBox={`-10 -10 ${selectedField?.width || DEFAULT_WIDTH } ${selectedField?.height || DEFAULT_HEIGHT}`}
                        onMouseDown={activeMoveTool ? handleMoveDown : handleDown}
                        onMouseMove={activeMoveTool ? handleMoveMove : handleMove}
                        onMouseUp={activeMoveTool ? handleMoveUp : handleUp}
                        onTouchStart={activeMoveTool ? handleMoveDown : handleDown}
                        onTouchMove={activeMoveTool ? handleMoveMove : handleMove}
                        onTouchEnd={activeMoveTool ? handleMoveUp : handleUp}
                    >
                        <MarkersDefs />
                        {/* Pozadí pro zrušení výběru */}
                        <rect
                            x={0}
                            y={0}
                            width={selectedField?.width || DEFAULT_WIDTH}
                            height={selectedField?.height || DEFAULT_HEIGHT}
                            fill="transparent"
                            pointerEvents="all"
                            onClick={handleSvgBackgroundClick}
                        />
                        <ImportedSVG svgXml={svgXml || ''} isFlotr={!!svgXml && parseSvgXmlToCollections(svgXml).isFlotr} />
                        <g id="field-layer" pointerEvents="none">
                            {selectedField && (
                                <g dangerouslySetInnerHTML={{ __html: getFieldOptionSvgMarkup(selectedField, FieldOptions) }} />
                            )}
                        </g>
                        <g id="content-layer">
                            <SelectionRect selectionRect={selectionRect} />
                            <FreehandLayer freehandLines={freehandLines} selectedItems={getSafeSelectedItems(selectedItems).freehandLines} handleSelect={handleSelect} />
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
                            <LineLayer lines={lines} selectedItems={getSafeSelectedItems(selectedItems).lines} handleSelect={handleSelect} />
                            <PreviewLine preview={preview} activeMovementTool={activeMovementTool} />
                            <PlayerLayer players={players} selectedItems={getSafeSelectedItems(selectedItems).players} handleSelect={handleSelect} />
                            <EquipmentLayer equipment={equipment} selectedItems={getSafeSelectedItems(selectedItems).equipment} handleSelect={handleSelect} renderEquipmentOnCanvas={renderEquipmentOnCanvas} renderEquipmentHighlight={renderEquipmentHighlight} />
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
    
    
};



export default DrawingComponent;


import React, {useRef, useState, useEffect} from "react";
import './styles.css';
import FieldSelector, {DEFAULT_HEIGHT, DEFAULT_WIDTH, FieldOptions} from './FieldSelector';
import {getFieldOptionSvgMarkup} from './utils/fieldSvgUtils';
import PlayerSelector, {playerTools} from "./PlayerSelector.tsx";
import EquipmentSelector, {type EquipmentTool, equipmentTools} from "./EquipmentSelector.tsx";
import MovementSelector, {
    type MovementTool,
    movementTools,
    movementTools as movementToolList
} from "./MovementSelector";
import ExportDrawingButtons from './ExportDrawingButtons';


type FreehandLine = { points: {x: number, y: number}[], color: string, dash: string, strokeWidth: number, arrow: boolean };

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
    const [activeMovementTool, setActiveMovementTool] = useState<MovementTool|null>(null);    
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

    const getCurrentDrawingState = () => ({
        lines,
        freehandLines,
        players,
        equipment
    });

    const restoreDrawingState = (state: any) => {
        setLines(state.lines);
        setFreehandLines(state.freehandLines);
        setPlayers(state.players);
        setEquipment(state.equipment);
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
            } else if (activeEquipmentTool) {
                addEquipment({tool: activeEquipmentTool, x: x, y: y});
            } else if (activeMovementTool) {
                setDrawing(true);
            }
            setDrawing(false);
        } else if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints([{x, y}]);
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };
        if (activeMovementTool && activeMovementTool.toolId === 'run-free') {
            setFreehandPoints(points => [...points, {x, y}]);
        } else if (startPoint && activeMovementTool) {
            setPreview({ x1: startPoint.x, y1: startPoint.y, x2: x, y2: y, color: activeMovementTool.stroke, type: activeMovementTool.toolId, dash: activeMovementTool.strokeDasharray, arrow: activeMovementTool.arrow, strokeWidth: activeMovementTool.strokeWidth });
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
        }
        setDrawing(false);
        setStartPoint(null);
        setPreview(null);
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
        } else if (tool.toolId === 'barrier-line') {
            const length = tool.length ?? 0, strokeWidth = tool.strokeWidth ?? 1;
            return <line key={idx} x1={-length/2} y1={0} x2={length/2} y2={0} stroke={tool.stroke} strokeWidth={strokeWidth} />;
        } else if (tool.toolId === 'barrier-corner') {
            const r = tool.radius ?? 0;
            return <path key={idx} d={`M 0 0 Q ${r/2} ${-r}, ${r} 0`} fill="none" stroke={tool.stroke} strokeWidth={1} />;
        }
        return null;
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
                />
                <EquipmentSelector
                    equipmentTools={equipmentTools}
                    activeEquipmentTool={activeEquipmentTool}
                    setActiveEquipmentTool={(tool) => setActiveEquipmentTool(tool)}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveMovementTool={setActiveMovementTool}
                />
                <MovementSelector
                    movementTools={movementToolList}
                    activeMovementTool={activeMovementTool}
                    setActiveMovementTool={setActiveMovementTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                />
                <ExportDrawingButtons svgRef={svgCanvasRef} />
                <div className="tool-group">
                    <div className="tool-item">
                        <button onClick={handleUndo} disabled={history.length === 0} title="Zpět (Undo)">
                            <svg width="32" height="32" viewBox="0 0 32 32">
                                <path d="M12 8 L4 16 L12 24" stroke="#333" strokeWidth="2" fill="none" />
                                <path d="M4 16 H20 Q28 16 28 24" stroke="#333" strokeWidth="2" fill="none" />
                            </svg>
                        </button>
                        <span>Undo</span>
                    </div>
                    <div className="tool-item">
                        <button onClick={handleRedo} disabled={redoStack.length === 0} title="Znovu (Redo)">
                            <svg width="32" height="32" viewBox="0 0 32 32">
                                <path d="M20 8 L28 16 L20 24" stroke="#333" strokeWidth="2" fill="none" />
                                <path d="M28 16 H12 Q4 16 4 24" stroke="#333" strokeWidth="2" fill="none" />
                            </svg>
                        </button>
                        <span>Redo</span>
                    </div>
                </div>
            </div>
            {/* Main Content Area */}
            <div id="container">
                <div id="drawing-area">
                    <svg
                        id="svg-canvas"
                        ref={svgCanvasRef}
                        viewBox={`-10 -10 ${selectedField?.width || DEFAULT_WIDTH } ${selectedField?.height || DEFAULT_HEIGHT}`}
                        onMouseDown={handleDown}
                        onMouseMove={handleMove}
                        onMouseUp={handleUp}
                        onTouchStart={handleDown}
                        onTouchMove={handleMove}
                        onTouchEnd={handleUp}
                    >
                        <defs>
                                {
                                    [...new Set(movementTools.map(i => i.stroke))].map(color => (
                                    <marker
                                        key={color}
                                        id={`arrow-${color.replace('#', '')}`}
                                        viewBox="0 0 10 10"
                                        refX="0"
                                        refY="5"
                                        markerUnits="strokeWidth"
                                        markerWidth="8"
                                        markerHeight="8"
                                        orient="auto-start-reverse"
                                    >
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                                    </marker>
                                ))}                            
                        </defs>
                        {/* Pokud je svgXml a není z FloTr, zobraz ho jako podklad */}
                        {svgXml && !parseSvgXmlToCollections(svgXml).isFlotr && (
                            <g id="imported-svg" pointerEvents="none">
                                <g dangerouslySetInnerHTML={{ __html: svgXml }} />
                            </g>
                        )}
                        <g id="field-layer" pointerEvents="none">
                            {selectedField && (
                                <g dangerouslySetInnerHTML={{ __html: getFieldOptionSvgMarkup(selectedField, FieldOptions) }} />
                            )}
                        </g>
                        <g id="content-layer">
                            
                            {freehandLines.map((l, i) => {
                                if (l.points.length > 1) {
                                    return (
                                        <path
                                            key={i}
                                            d={pointsToSmoothPath(l.points, 5, 5)}
                                            fill="none"
                                            stroke={l.color || 'black'}
                                            strokeWidth={l.strokeWidth || 2}
                                            strokeDasharray={l.dash || ''}
                                            markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                                        />
                                    );
                                } else {
                                    return null;
                                }
                            })}
                            
                            {drawing && activeMovementTool && activeMovementTool.toolId === 'run-free' && freehandPoints.length > 1 && (
                                <path
                                    d={pointsToSmoothPath(freehandPoints, 5, 3)} // downsample step lower than requested for final ook just for better performance during drawing
                                    fill="none"
                                    stroke={activeMovementTool.stroke || 'black'}
                                    strokeWidth={activeMovementTool.strokeWidth || 2}
                                    strokeDasharray={activeMovementTool.strokeDasharray || ''}
                                    markerEnd={activeMovementTool.arrow ? `url(#arrow-${activeMovementTool.stroke.replace('#', '')})` : undefined}
                                />
                            )}
                            {lines.map((l, i) => {
                                if (l.type === 'shoot') {
                                    // Výpočet offsetu kolmo k vektoru čáry
                                    const dx = l.x2 - l.x1;
                                    const dy = l.y2 - l.y1;
                                    const len = Math.sqrt(dx*dx + dy*dy) || 1;
                                    const off = 1; // px offset
                                    const ox = -dy / len * off;
                                    const oy = dx / len * off;
                                    return (
                                        <g key={i}>
                                            {/* Horní čára */}
                                            <line
                                                x1={l.x1 + ox}
                                                y1={l.y1 + oy}
                                                x2={l.x2 + ox}
                                                y2={l.y2 + oy}
                                                stroke={l.color}
                                                strokeWidth={l.strokeWidth}
                                                strokeDasharray={l.dash}
                                            />
                                            {/* Prostřední čára se šipkou */}
                                            <line
                                                x1={l.x1}
                                                y1={l.y1}
                                                x2={l.x2}
                                                y2={l.y2}
                                                stroke={''}
                                                strokeWidth={l.strokeWidth}
                                                strokeDasharray={l.dash}
                                                markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                                            />
                                            {/* Dolní čára */}
                                            <line
                                                x1={l.x1 - ox}
                                                y1={l.y1 - oy}
                                                x2={l.x2 - ox}
                                                y2={l.y2 - oy}
                                                stroke={l.color}
                                                strokeWidth={l.strokeWidth}
                                                strokeDasharray={l.dash}
                                            />
                                        </g>
                                    );
                                } else {
                                    return (
                                        <line
                                            key={i}
                                            x1={l.x1}
                                            y1={l.y1}
                                            x2={l.x2}
                                            y2={l.y2}
                                            stroke={l?.color}
                                            strokeWidth={l?.strokeWidth}
                                            strokeDasharray={l?.dash}
                                            markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                                        />
                                    );
                                }
                            })}
                            {preview && activeMovementTool && (
                                activeMovementTool.toolId === 'shoot' ? (() => {
                                    const dx = preview.x2 - preview.x1;
                                    const dy = preview.y2 - preview.y1;
                                    const len = Math.sqrt(dx*dx + dy*dy) || 1;
                                    const off = 1;
                                    const ox = -dy / len * off;
                                    const oy = dx / len * off;
                                    return (
                                        <g>
                                            {/* Horní čára */}
                                            <line
                                                x1={preview.x1 + ox}
                                                y1={preview.y1 + oy}
                                                x2={preview.x2 + ox}
                                                y2={preview.y2 + oy}
                                                stroke={activeMovementTool.stroke}
                                                strokeWidth={activeMovementTool.strokeWidth}
                                                strokeDasharray={activeMovementTool.strokeDasharray}
                                            />
                                            {/* Prostřední čára se šipkou */}
                                            <line
                                                x1={preview.x1}
                                                y1={preview.y1}
                                                x2={preview.x2}
                                                y2={preview.y2}
                                                stroke={''}
                                                strokeWidth={activeMovementTool.strokeWidth}
                                                strokeDasharray={activeMovementTool.strokeDasharray}
                                                markerEnd={activeMovementTool.arrow ? `url(#arrow-${activeMovementTool.stroke.replace('#', '')})` : undefined}
                                            />
                                            {/* Dolní čára */}
                                            <line
                                                x1={preview.x1 - ox}
                                                y1={preview.y1 - oy}
                                                x2={preview.x2 - ox}
                                                y2={preview.y2 - oy}
                                                stroke={activeMovementTool.stroke}
                                                strokeWidth={activeMovementTool.strokeWidth}
                                                strokeDasharray={activeMovementTool.strokeDasharray}
                                            />
                                        </g>
                                    );
                                })() : (
                                    <line
                                        x1={preview.x1}
                                        y1={preview.y1}
                                        x2={preview.x2}
                                        y2={preview.y2}
                                        stroke={activeMovementTool.stroke}
                                        strokeWidth={activeMovementTool.strokeWidth}
                                        strokeDasharray={activeMovementTool.strokeDasharray}
                                        markerEnd={activeMovementTool.arrow ? `url(#arrow-${activeMovementTool.stroke.replace('#', '')})` : undefined}
                                    />
                                )
                            )}
                            {/* Vykreslení hráčů */}
                            {players.map((player, idx) => (
                                <g key={idx} transform={`translate(${player.x},${player.y})`}>
                                    <circle r={player.tool.radius} fill={player.tool.fill} stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth} />
                                    {player.tool.toolId === 'opponent' && (
                                        <g>
                                        <line x1={-player.tool.radius/2} y1={-player.tool.radius/2} x2={player.tool.radius/2} y2={player.tool.radius/2} stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth} />
                                            <line x1={-player.tool.radius/2} y1={player.tool.radius/2} x2={player.tool.radius/2} y2={-player.tool.radius/2} stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth} />
                                        </g>
                                )}
                                    {player.tool.text && (
                                        <text x={0} y={6} textAnchor="middle" fontSize={18} fill={player.tool.textColor}>{player.tool.text}</text>
                                    )}
                                </g>
                            ))}
                            {/* Vykreslení equipmentu */}
                            {equipment.map((item, idx) => (
                                <g key={idx} transform={`translate(${item.x},${item.y})`}>
                                    {renderEquipmentOnCanvas(item, idx)}
                                </g>
                            ))}
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
    
    
};



export default DrawingComponent;

// --- Typ hráče na plátně ---
type PlayerOnCanvas = {
    tool: typeof playerTools[number];
    x: number;
    y: number;
};

// --- Typ equipmentu na plátně ---
type EquipmentOnCanvas = {
    tool: typeof equipmentTools[number];
    x: number;
    y: number;
    // Pro many-balls
    balls?: { x: number; y: number }[];
};

type Line = { x1: number, y1: number, x2: number, y2: number, color: string, type: string, dash?: string, arrow?: boolean, strokeWidth:number };

// --- Pomocné funkce ---
/**
 * Silně vyhladí body pomocí Chaikinova algoritmu a navíc body předvybere (downsampling) pro ještě hladší výsledek.
 * @param points Pole bodů
 * @param iterations Počet iterací vyhlazení (doporučeno 4-6 pro velmi hladké)
 * @param downsampleStep Každý n-tý bod (větší = hladší, menší = detailnější)
 */
function chaikinSmoothAggressive(points: {x: number, y: number}[], iterations: number = 5, downsampleStep: number = 2): {x: number, y: number}[] {
    // Downsample
    let pts = points.filter((_, i) => i % downsampleStep === 0);
    if (pts.length < 2) pts = points;
    for (let iter = 0; iter < iterations; iter++) {
        if (pts.length < 2) break;
        const newPts = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
            const R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
            newPts.push(Q, R);
        }
        newPts.push(pts[pts.length - 1]);
        pts = newPts;
    }
    return pts;
}

function pointsToSmoothPath(points: {x: number, y: number}[], iterations: number = 5, downsampleStep: number = 2) {
    const smooth = chaikinSmoothAggressive(points, iterations, downsampleStep);
    if (smooth.length < 2) return '';
    let d = `M ${smooth[0].x},${smooth[0].y}`;
    for (let i = 1; i < smooth.length; i++) {
        d += ` L ${smooth[i].x},${smooth[i].y}`;
    }
    return d;
}

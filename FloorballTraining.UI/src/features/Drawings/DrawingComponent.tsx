import React, {useRef, useState} from "react";
import './styles.css';
import FieldSelector, {FieldOptions} from './FieldSelector';
import {getFieldOptionSvgMarkup} from './utils/fieldSvgUtils';
import MovementToolbarSelector from "./MovementToolbarSelector.tsx";
import {type MovementType, movementTypes} from "./MovementType.tsx";
import PlayerSelector, {playerTools} from "./PlayerSelector.tsx";
import EquipmentSelector, {type EquipmentTool, equipmentTools} from "./EquipmentSelector.tsx";


const DrawingComponent = () => {
    const svgCanvasRef = useRef<SVGSVGElement | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState('Empty');
    const selectedField = FieldOptions.find(f => f.id === selectedFieldId) || FieldOptions[0];
    const [drawing, setDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
    const [activeMovementType, setActiveMovementType] = useState<MovementType|null>(movementTypes[0]);    
    const [lines, setLines] = useState<Line[]>([]);
    const [preview, setPreview] = useState<Line | null>(null);
    const [activePlayerTool, setActivePlayerTool] = useState<typeof playerTools[number] | null>(null);
    const [players, setPlayers] = useState<PlayerOnCanvas[]>([]);
    const [equipment, setEquipment] = useState<EquipmentOnCanvas[]>([]);
    const [activeEquipmentTool, setActiveEquipmentTool] = useState<EquipmentTool | null>(null);
    
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
            setPlayers([...players, { tool: activePlayerTool, x: x, y:y }]);
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
                setEquipment([
                    ...equipment,
                    { tool: activeEquipmentTool, x: x, y: y, balls }
                ]);
            
            } else if (activeEquipmentTool) {
                setEquipment([...equipment, {tool: activeEquipmentTool, x: x, y: y}]);

            } else if (activeMovementType) {
                setDrawing(true);
            }
            setDrawing(false);
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || !startPoint) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };
        
        if(!activeMovementType) return;
        
        setPreview({ x1: startPoint.x, y1: startPoint.y, x2: x, y2: y, color: activeMovementType.color, type: activeMovementType.id, dash: activeMovementType.dash, arrow: activeMovementType.arrow, strokeWidth: activeMovementType.strokeWidth });
    };

    const handleUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || !startPoint) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };

        if (activePlayerTool) {
            setPlayers([...players, { tool: activePlayerTool, x: x, y: y }]);
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
                setEquipment([
                    ...equipment,
                    { tool: activeEquipmentTool, x: x, y: y, balls }
                ]);
            } else {
                setEquipment([...equipment, { tool: activeEquipmentTool, x: x, y: y }]);
            }
        }else if (activeMovementType) {
                setLines([...lines, {
                    x1: startPoint.x,
                    y1: startPoint.y,
                    x2: x,
                    y2: y,
                    color: activeMovementType.color,
                    type: activeMovementType.id,
                    dash: activeMovementType.dash,
                    arrow: activeMovementType.arrow,
                    strokeWidth: activeMovementType.strokeWidth
                }]);         
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

    return (
        <div>
            {/* Toolbar */}
            <div id="drawing-toolbar" className="controls toolbar">
                <FieldSelector options={FieldOptions} selectedId={selectedFieldId} onChange={setSelectedFieldId} />
                
                {/* Výběr typu pohybu */}
                <div className="tool-group">
                    <span>Pohyb</span>
                    <div className="movement-type-options" >
                        {movementTypes.map(type => (
                            <MovementToolbarSelector
                                key={type.id + 'selector'}
                                movementType={type}
                                label={type.label}
                                icon={<svg width={16} height={16}><circle cx={8} cy={8} r={6} fill={type.color} /></svg>}
                                active={type.id === activeMovementType?.id}
                                onSelect={() => {
                                    setActiveMovementType(type);
                                    setActiveEquipmentTool(null);
                                    setActivePlayerTool(null);
                                }}
                            />
                    
                        ))}
                    </div>
                </div>
                
                <PlayerSelector
                    playerTools={playerTools}
                    activePlayerTool={activePlayerTool}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveMovementType={setActiveMovementType}
                />
                <EquipmentSelector
                    equipmentTools={equipmentTools}
                    activeEquipmentTool={activeEquipmentTool}
                    setActiveEquipmentTool={(tool) => setActiveEquipmentTool(tool)}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveMovementType={setActiveMovementType}
                />
            </div>
            {/* Main Content Area */}
            <div id="container">
                <div id="drawing-area">
                    <svg
                        id="svg-canvas"
                        ref={svgCanvasRef}
                        viewBox={`-10 -10 ${selectedField.width} ${selectedField.height}`}
                        onMouseDown={handleDown}
                        onMouseMove={handleMove}
                        onMouseUp={handleUp}
                        onTouchStart={handleDown}
                        onTouchMove={handleMove}
                        onTouchEnd={handleUp}
                    >
                        <defs>
                                {
                                    [...new Set(movementTypes.map(i => i.color))].map(color => (
                                    <marker
                                        key={color}
                                        id={`shot-arrow-${color.replace('#', '')}`}
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
                        
                        <g id="field-layer" pointerEvents="none">
                            {selectedField && (
                                <g dangerouslySetInnerHTML={{ __html: getFieldOptionSvgMarkup(selectedField, FieldOptions) }} />
                            )}
                        </g>
                        <g id="content-layer">
                            {lines.map((l, i) => (
                                <line
                                    key={i}
                                    x1={l.x1}
                                    y1={l.y1}
                                    x2={l.x2}
                                    y2={l.y2}
                                    stroke={l?.color}
                                    strokeWidth={l?.strokeWidth}
                                    strokeDasharray={l?.dash}
                                    markerEnd={l.arrow ? `url(#shot-arrow-${l.color.replace('#', '')})` : undefined}
                                />
                            ))}
                            {preview && activeMovementType && (
                                <line
                                    x1={preview.x1}
                                    y1={preview.y1}
                                    x2={preview.x2}
                                    y2={preview.y2}
                                    stroke={activeMovementType.color}
                                    strokeWidth={activeMovementType.strokeWidth}
                                    strokeDasharray={activeMovementType.dash}
                                    markerEnd={activeMovementType.arrow ? `url(#shot-arrow-${activeMovementType.color.replace('#', '')})` : undefined}
                                />
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

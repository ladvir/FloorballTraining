import React, {useRef, useState} from "react";
import './styles.css';
import FieldSelector, {FieldOptions} from './FieldSelector';
import {getFieldOptionSvgMarkup} from './utils/fieldSvgUtils';
import MovementToolbarSelector from "./MovementToolbarSelector.tsx";
import {type MovementType, movementTypes} from "./MovementType.tsx";
import PlayerSelector, {playerTools} from "./PlayerSelector.tsx";
import EquipmentSelector, {type EquipmentTool, equipmentTools} from "./EquipmentSelector.tsx";
import MovementSelector, {movementTools as movementToolList} from "./MovementSelector";


const DrawingComponent = () => {
    const svgCanvasRef = useRef<SVGSVGElement | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState('half-bottom');
    const selectedField = FieldOptions.find(f => f.id === selectedFieldId) || FieldOptions[2];
    const [drawing, setDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
    const [activeMovementType, setActiveMovementType] = useState<MovementType|null>(null);    
    const [lines, setLines] = useState<Line[]>([]);
    const [preview, setPreview] = useState<Line | null>(null);
    const [activePlayerTool, setActivePlayerTool] = useState<typeof playerTools[number] | null>(null);
    const [players, setPlayers] = useState<PlayerOnCanvas[]>([]);
    const [equipment, setEquipment] = useState<EquipmentOnCanvas[]>([]);
    const [activeEquipmentTool, setActiveEquipmentTool] = useState<EquipmentTool | null>(null);
    const [freehandPoints, setFreehandPoints] = useState<{x: number, y: number}[]>([]);
    const [freehandLines, setFreehandLines] = useState<{points: {x: number, y: number}[], color: string, dash: string, strokeWidth: number, arrow: boolean}[]>([]);
    
    const [chaikinIterations, setChaikinIterations] = useState(5);
    const [downsampleStep, setDownsampleStep] = useState(2);
    
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
        } else if (activeMovementType && activeMovementType.id === 'run-free') {
            setFreehandPoints([{x, y}]);
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
        const { x, y } = getSvgCoords(e) ?? { x: 0, y: 0 };
        if (activeMovementType && activeMovementType.id === 'run-free') {
            setFreehandPoints(points => [...points, {x, y}]);
        } else if (startPoint && activeMovementType) {
            setPreview({ x1: startPoint.x, y1: startPoint.y, x2: x, y2: y, color: activeMovementType.color, type: activeMovementType.id, dash: activeMovementType.dash, arrow: activeMovementType.arrow, strokeWidth: activeMovementType.strokeWidth });
        }
    };

    const handleUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
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
        } else if (activeMovementType && activeMovementType.id === 'run-free' && freehandPoints.length > 1) {
            setFreehandLines([...freehandLines, { points: freehandPoints, color: activeMovementType.color, dash: activeMovementType.dash, strokeWidth: activeMovementType.strokeWidth, arrow: activeMovementType.arrow }]);
            setFreehandPoints([]);
        } else if (activeMovementType && startPoint) {
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
                        {movementTypes.map(type => (
                            <MovementToolbarSelector
                                key={type.id + 'selector'}
                                movementType={type}
                                label={type.label}
                                icon={
                                    type.id === 'run-free'
                                        ? (
                                            <svg width={32} height={32}>
                                                <circle cx={8} cy={24} r={6} fill={type.color} />
                                                <path d="M8,24 Q16,16 24,8" stroke={type.color} strokeWidth={type.strokeWidth} fill="none" markerEnd="url(#shot-arrow-000000)" />
                                            </svg>
                                        )
                                        : (
                                            <svg width={32} height={32}>
                                                <circle cx={8} cy={8} r={6} fill={type.color} />
                                            </svg>
                                        )
                                }
                                active={type.id === activeMovementType?.id}
                                onSelect={() => {
                                    setActiveMovementType(type);
                                    setActiveEquipmentTool(null);
                                    setActivePlayerTool(null);
                                }}
                            />
                    
                        ))}
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
                {/* Výběr typu pohybu - nový MovementSelector */}
                <MovementSelector
                    movementTools={movementToolList}
                    activeMovementTool={null}
                    setActiveMovementTool={() => {}}
                    setActivePlayerTool={setActivePlayerTool}
                    setActiveEquipmentTool={setActiveEquipmentTool}
                    setActiveMovementType={setActiveMovementType}
                />

               
                <label style={{marginLeft: 16}}>Vyhlazení: <input type="range" min="2" max="8" value={chaikinIterations} onChange={e => setChaikinIterations(Number(e.target.value))} /></label>
                <label style={{marginLeft: 8}}>Řídkost: <input type="range" min="1" max="20" value={downsampleStep} onChange={e => setDownsampleStep(Number(e.target.value))} /></label>
                
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
                            
                            {freehandLines.map((l, i) => {
                                if (l.points.length > 1) {
                                    return (
                                        <path
                                            key={i}
                                            d={pointsToSmoothPath(l.points, chaikinIterations, downsampleStep)}
                                            fill="none"
                                            stroke={l.color || 'black'}
                                            strokeWidth={l.strokeWidth || 2}
                                            strokeDasharray={l.dash || ''}
                                            markerEnd={l.arrow ? `url(#shot-arrow-${l.color.replace('#', '')})` : undefined}
                                        />
                                    );
                                } else {
                                    return null;
                                }
                            })}
                            
                            {drawing && activeMovementType && activeMovementType.id === 'run-free' && freehandPoints.length > 1 && (
                                <path
                                    d={pointsToSmoothPath(freehandPoints, chaikinIterations, 3)} // downsample step lower than requested for final ook just for better performance during drawing
                                    fill="none"
                                    stroke={activeMovementType.color || 'black'}
                                    strokeWidth={activeMovementType.strokeWidth || 2}
                                    strokeDasharray={activeMovementType.dash || ''}
                                    markerEnd={activeMovementType.arrow ? `url(#shot-arrow-${activeMovementType.color.replace('#', '')})` : undefined}
                                />
                            )}
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

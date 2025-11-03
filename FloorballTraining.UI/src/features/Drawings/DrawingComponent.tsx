import React, {useRef, useState} from "react";
import './styles.css';
import FieldSelector, {type FieldOption} from './FieldSelector';
import {getFieldOptionSvgMarkup} from './utils/fieldSvgUtils';
import MovementToolbarSelector from "./MovementToolbarSelector.tsx";
import {type MovementType, movementTypes} from "./MovementType.tsx";


// --- Možnosti hřiště (fieldOptions) převzato z původního config.js ---
const fieldOptions: FieldOption[] = [
    { id: 'Empty', label: 'Empty', svgMarkup: '', width: 800, height: 600 },
    { id: 'full-horizontal', label: 'Full horizontal', svgMarkup: `<g id="g3"><path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /><path id="path1-7" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /></g>`, width: 1175, height: 600 },
     { id: 'half-right', label: 'Half right', svgMarkup: '' , width: 800, height: 600 }
    ,{ id: 'half-left', label: 'Half left', svgMarkup: '' , width: 800, height: 600 }
    , { id: 'half-top', label: 'Half top', svgMarkup: '' , width: 800, height: 600 }
    , { id: 'half-bottom', label: 'Half bottom', svgMarkup: '<g id="g3"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g>' , width: 800, height: 600 }
];

// --- Player Tools převzato z původního config.js ---
const PLAYER_RADIUS = 24;
const PLAYER_STROKE_WIDTH = 1;

type PlayerTool = {
    category: 'player';
   // playerCategory: 'teamA' | 'teamB' | 'other';
    toolId: string;
    label: string;
    type: 'player';
    radius: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    text: string | null;
    textColor: string;
    
}

const playerTools : PlayerTool[] = [
    { category: 'player', toolId: 'player-black', label: 'Player (Black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-black-G', label: 'Team B G', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    
    { category: 'player', toolId: 'player-white', label: 'Player (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-white-G', label: 'Player (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Player (Red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH,  text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-red-G', label: 'Team A G', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'opponent', label: 'Opponent', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },    
    { category: 'player', toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'C', textColor: 'black' },
   

];

// --- Equipment Tools převzato z původního config.js ---
const EQUIPMENT_BALL_RADIUS = 6;
const EQUIPMENT_GATE_WIDTH = 40;
const EQUIPMENT_GATE_HEIGHT = 100;
const EQUIPMENT_CONE_RADIUS = 10;
const EQUIPMENT_CONE_HEIGHT = 25;
const EQUIPMENT_BARRIER_STROKE_WIDTH = 8;
const EQUIPMENT_BARRIER_CORNER_RADIUS = 90;


const equipmentTools = [
    { category: 'equipment', toolId: 'ball', label: 'Ball', type: 'equipment', radius: EQUIPMENT_BALL_RADIUS, fill: 'orange', stroke: 'black' },
    { category: 'equipment', toolId: 'many-balls', label: 'Many Balls', type: 'equipment', radius: EQUIPMENT_BALL_RADIUS, fill: 'orange', stroke: 'black', isSet: true },
    { category: 'equipment', toolId: 'gate', label: 'Gate', type: 'equipment', width: EQUIPMENT_GATE_WIDTH, height: EQUIPMENT_GATE_HEIGHT, fill: 'grey', stroke: 'black' },
    { category: 'equipment', toolId: 'cone', label: 'Cone', type: 'equipment', radius: EQUIPMENT_CONE_RADIUS, height: EQUIPMENT_CONE_HEIGHT, fill: 'red', stroke: 'black' },
    { category: 'equipment', toolId: 'barrier-line', label: 'Barrier Line', type: 'equipment', stroke: 'darkblue', strokeWidth: EQUIPMENT_BARRIER_STROKE_WIDTH, length: 100 },
    { category: 'equipment', toolId: 'barrier-corner', label: 'Barrier Corner', type: 'equipment', radius: EQUIPMENT_BARRIER_CORNER_RADIUS, stroke: 'darkblue', strokeWidth: EQUIPMENT_BARRIER_STROKE_WIDTH }
];

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
const DrawingComponent = () => {
    const svgCanvasRef = useRef<SVGSVGElement | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState('Empty');
    const selectedField = fieldOptions.find(f => f.id === selectedFieldId) || fieldOptions[0];
    const [drawing, setDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
    
    
    const [activeMovementType, setActiveMovementType] = useState<MovementType|null>(movementTypes[0]);
    
    const [lines, setLines] = useState<Line[]>([]);
    const [preview, setPreview] = useState<Line | null>(null);
    const [activePlayerTool, setActivePlayerTool] = useState<typeof playerTools[number] | null>(null);
    const [players, setPlayers] = useState<PlayerOnCanvas[]>([]);
    const [activeEquipmentTool, setActiveEquipmentTool] = useState<typeof equipmentTools[number] | null>(null);
    const [equipment, setEquipment] = useState<EquipmentOnCanvas[]>([]);    


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
       
    const renderPlayerSelector = () => {
        return (
            <div className="tool-group">
                
                    {playerTools.map((tool) => (
                        <div key={tool.toolId} className="tool-item">
                        <button                            
                            className={activePlayerTool?.toolId === tool.toolId ? 'active' : ''}
                            onClick={() => {
                                setActivePlayerTool(tool);
                                setActiveEquipmentTool(null); 
                                setActiveMovementType(null);    
                            }}
                            title={tool.label}
                        >
                            <svg width={32} height={32}>
                                <circle cx={16} cy={16} r={tool.radius / 2} fill={tool.fill} stroke={tool.stroke} strokeWidth={tool.strokeWidth} />
                                {tool.toolId === 'opponent' && (
                                    <g>
                                        <line x1={10} y1={10} x2={22} y2={22} stroke={tool.stroke} strokeWidth={tool.strokeWidth} />
                                        <line x1={10} y1={22} x2={22} y2={10} stroke={tool.stroke} strokeWidth={tool.strokeWidth} />
                                    </g>
                                )}
                                
                                {tool.text && (
                                    <text x={16} y={21} textAnchor="middle" fontSize={14} fill={tool.textColor}>{tool.text}</text>
                                )}
                            </svg>                          
                            
                        </button> 
                        
                            <span style={{ fontSize: 12 }}>{tool.label}</span>
                        </div>
                    ))}                
            </div>
        );
    };

    const renderEquipmentSelector = () => (
        <div className="tool-group">
            
            
                {equipmentTools.map(tool => (
                    <div key={tool.toolId} className="tool-item">
                    <button                        
                        className={activeEquipmentTool?.toolId === tool.toolId ? 'active' : ''}
                        onClick={() => {
                            setActiveEquipmentTool(tool);
                            setActivePlayerTool(null); 
                            setActiveMovementType(null);
                        }}
                        title={tool.label}
                    >
                        {tool.toolId === 'ball' ? (
                            <svg width={32} height={32}><circle cx={16} cy={16} r={tool.radius} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} /></svg>
                        ) : tool.toolId === 'many-balls' ? (
                            <svg width={32} height={32}>
                                <circle cx="15" cy="14" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                                <circle cx="22" cy="18" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                                <circle cx="19" cy="20" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                                <circle cx="8" cy="18" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                            </svg>
                        ) : tool.toolId === 'gate' ? (
                            <svg width={32} height={32}><rect x={6} y={6} width={10} height={20} fill={tool.fill} stroke={tool.stroke} strokeWidth={2} /></svg>
                        ) : tool.toolId === 'cone' ? (
                            <svg width={32} height={32}><polygon points="16,6 26,26 6,26" fill={tool.fill} stroke={tool.stroke} strokeWidth={1} /></svg>
                        ) : tool.toolId === 'barrier-line' ? (
                            <svg width={32} height={32}><line x1={6} y1={16} x2={26} y2={16} stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                        ) : tool.toolId === 'barrier-corner' ? (
                            <svg width={32} height={32}><path d="M 6 26 Q 16 6 26 26" fill="none" stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                        ) : null}
                    </button>
                    <span style={{ fontSize: 12 }}>{tool.label}</span>
        </div>
                ))}
           
        </div>
    );

    // --- Vykreslení equipmentu ---
    const renderEquipmentOnCanvas = (item: EquipmentOnCanvas, idx: number) => {
        const tool = item.tool;
        if (tool.toolId === 'ball') {
            return <circle key={idx} cx={0} cy={0} r={tool.radius ?? 0} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />;
        } else if (tool.toolId === 'many-balls') {
            const radius = tool.radius ?? 6;
            return (
                <g key={idx}>
                    {(item.balls || []).map((b, i) => (
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
                <FieldSelector options={fieldOptions} selectedId={selectedFieldId} onChange={setSelectedFieldId} />
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
                
                {renderPlayerSelector()}
                {renderEquipmentSelector()}

                
               
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
                                <g dangerouslySetInnerHTML={{ __html: getFieldOptionSvgMarkup(selectedField, fieldOptions) }} />
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

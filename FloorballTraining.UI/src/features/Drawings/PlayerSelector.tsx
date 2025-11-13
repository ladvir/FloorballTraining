import React from "react";
import {selectionTools} from "./SelectionSelector.tsx";

export type PlayerTool = {
    category: 'player';
    toolId: string;
    label: string;
    type: 'player';
    radius: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    text: string | null;
    textColor: string;
};

type PlayerSelectorProps = {
    playerTools: PlayerTool[];
    activePlayerTool: PlayerTool | null;
    setActivePlayerTool: (tool: PlayerTool| null) => void;
    setActiveEquipmentTool: (tool: any) => void;
    setActiveMovementTool: (type: any) => void;
    setActiveSelectionTool: (type: any) => void;
    setSelectedItems: (type:{players: number[], equipment: number[], lines: number[], freehandLines: number[]}) => void;
};

const PLAYER_RADIUS = 24;
const PLAYER_STROKE_WIDTH = 2;

export const playerTools : PlayerTool[] = [
    { category: 'player', toolId: 'player', label: 'Player (black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player', label: 'Player (white)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player', label: 'Player (red)', type: 'player', radius: PLAYER_RADIUS, fill: '#dd0000', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH-1, text: null, textColor: 'white' },

    { category: 'player', toolId: 'player', label: 'Goalie (black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player', label: 'Goalie (white)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player', label: 'Goalie (red)', type: 'player', radius: PLAYER_RADIUS, fill: '#dd0000', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH-1, text: null, textColor: 'white' },


    { category: 'player', toolId: 'player-black', label: 'Player (black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-white', label: 'Player (white)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Player (red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH,  text: null, textColor: 'white' },
    
    { category: 'player', toolId: 'player-black-G', label: 'Goalie (black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'player-white-G', label: 'Goalie (white)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red-G', label: 'Goalie (red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    
    { category: 'player', toolId: 'opponent', label: 'Opponent', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'C', textColor: 'black' }
];

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ playerTools, activePlayerTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementTool, setActiveSelectionTool, setSelectedItems}) => (
    <div className="tool-group">
        {playerTools.map((tool) => (
            <div key={tool.toolId} className="tool-item">
                <button
                    className={activePlayerTool?.toolId === tool.toolId ? 'selected' : ''}
                    onClick={() => {
                        if (activePlayerTool?.toolId === tool.toolId) {
                            setActivePlayerTool(null);
                            setActiveSelectionTool(selectionTools[0]);
                        } else {
                            setActivePlayerTool(tool);
                            setActiveSelectionTool(null);
                        }
                        setActiveEquipmentTool(null);
                        setActiveMovementTool(null);
                        setSelectedItems({players: [], equipment: [], lines: [], freehandLines: []});
                    }}
                    title={tool.label}
                >
                    {tool.toolId === 'player' && (
                        <svg width={32} height={32} viewBox="0 0 512 512">
                            {/*<circle cx="256" cy="56" r="56" fill="#000000"/><path fill="#000000" d="M304 128h-96a64.19 64.19 0 0 0-64 64v107.52c0 10.85 8.43 20.08 19.27 20.47A20 20 0 0 0 184 300v-99.73a8.18 8.18 0 0 1 7.47-8.25a8 8 0 0 1 8.53 8V489a23 23 0 0 0 23 23a23 23 0 0 0 23-23V346.34a10.24 10.24 0 0 1 9.33-10.34A10 10 0 0 1 266 346v143a23 23 0 0 0 23 23a23 23 0 0 0 23-23V200.27a8.18 8.18 0 0 1 7.47-8.25a8 8 0 0 1 8.53 8v99.52c0 10.85 8.43 20.08 19.27 20.47A20 20 0 0 0 368 300V192a64.19 64.19 0 0 0-64-64Z"/>*/}
                            <g>
                                <path stroke={tool.stroke} strokeWidth={tool.strokeWidth * 1 / 0.155}
                                      fill={tool.fill}
                                      d="M 208.5,9.5 C 241.28,8.28155 259.614,23.9482 263.5,56.5C 261.661,82.5017 247.995,98.0017 222.5,103C 195.619,104.443 178.453,92.2759 171,66.5C 167.541,36.7024 180.041,17.7024 208.5,9.5 Z"/>
                            </g>
                            <g>
                                <path stroke={tool.stroke} strokeWidth={tool.strokeWidth * 1 / 0.155}
                                      fill={tool.fill}
                                      d="M 259.5,101.5 C 280.211,99.2338 297.378,105.9 311,121.5C 328.45,154.735 345.117,188.401 361,222.5C 364.112,230.616 366.446,238.949 368,247.5C 371.441,278.786 374.441,310.119 377,341.5C 414.42,362.127 451.92,382.627 489.5,403C 500.579,410.455 504.079,420.621 500,433.5C 493.994,445.084 484.494,449.584 471.5,447C 427.212,423.523 383.212,399.523 339.5,375C 336.036,370.578 333.203,365.744 331,360.5C 324.671,347.002 318.837,333.335 313.5,319.5C 300.583,326.636 288.249,334.803 276.5,344C 310.333,379.833 344.167,415.667 378,451.5C 384.953,467.308 380.787,479.142 365.5,487C 356.637,489.451 348.637,487.784 341.5,482C 301.667,440.167 261.833,398.333 222,356.5C 215.494,347.263 214.827,337.596 220,327.5C 234.625,309.74 249.125,291.907 263.5,274C 255.726,256.952 247.559,240.119 239,223.5C 234.055,235.667 228.722,247.667 223,259.5C 221.833,260.667 220.667,261.833 219.5,263C 195.671,276.08 172.005,289.413 148.5,303C 144.654,304.669 140.654,305.836 136.5,306.5C 109.852,354.973 82.8519,403.14 55.5,451C 53.6079,451.973 51.6079,452.64 49.5,453C 40.1667,453.667 30.8333,453.667 21.5,453C 16.0896,451.257 12.2563,447.757 10,442.5C 9.50034,435.174 9.33368,427.841 9.5,420.5C 22.8375,420.333 36.1708,420.5 49.5,421C 52.7875,421.616 55.6208,423.116 58,425.5C 81.0867,384.995 103.92,344.328 126.5,303.5C 114.536,289.705 116.203,277.872 131.5,268C 151.167,257.167 170.833,246.333 190.5,235.5C 199.369,205.052 207.536,174.386 215,143.5C 221.342,120.32 236.175,106.32 259.5,101.5 Z"/>
                            </g>
                        </svg>
                    )}

                    {tool.toolId !== 'player' && (
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
                        )}
                </button>
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default PlayerSelector;

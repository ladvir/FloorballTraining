import React from "react";

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
    setActivePlayerTool: (tool: PlayerTool) => void;
    setActiveEquipmentTool: (tool: any) => void;
    setActiveMovementType: (type: any) => void;
};

const PLAYER_RADIUS = 24;
const PLAYER_STROKE_WIDTH = 1;

export const playerTools : PlayerTool[] = [
    { category: 'player', toolId: 'player-black', label: 'Player (Black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-black-G', label: 'Team B G', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'player-white', label: 'Player (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-white-G', label: 'Player (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Player (Red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH,  text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-red-G', label: 'Team A G', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'opponent', label: 'Opponent', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'C', textColor: 'black' }
];

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ playerTools, activePlayerTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementType }) => (
    <div className="tool-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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

export default PlayerSelector;

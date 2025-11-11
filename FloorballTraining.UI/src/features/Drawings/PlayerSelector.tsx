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
const PLAYER_STROKE_WIDTH = 1;

export const playerTools : PlayerTool[] = [
    { category: 'player', toolId: 'player-black', label: 'Player (Black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-black-G', label: 'Goalie (Black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'player-white', label: 'Player (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-white-G', label: 'Goalie (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Player (Red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH,  text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-red-G', label: 'Goalie (Red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
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
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default PlayerSelector;

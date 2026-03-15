import React from "react";
import {selectionTools} from "./SelectionSelector.tsx";

export type PlayerTool = {
    category: 'player';
    toolId: string;
    label: string;
    type: string;
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
    setActiveTextTool: (type: any) => void;
    setActiveNumberTool: (type: any) => void;
    setSelectedItems: (type:{players: number[], equipment: number[], lines: number[], freehandLines: number[], texts: number[], numbers: number[]}) => void;
};

const PLAYER_RADIUS = 16;
const PLAYER_STROKE_WIDTH = 1.5;

export const playerTools : PlayerTool[] = [
    { category: 'player', toolId: 'playerB', label: 'Player (black)', type: 'playerA', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'playerW', label: 'Player (white)', type: 'playerA', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'playerR', label: 'Player (red)', type: 'playerA', radius: PLAYER_RADIUS, fill: '#dd0000', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH-1, text: null, textColor: 'white' },

    { category: 'player', toolId: 'playerBG', label: 'Goalie (black)', type: 'playerA', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'playerWG', label: 'Goalie (white)', type: 'playerA', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'playerRG', label: 'Goalie (red)', type: 'playerA', radius: PLAYER_RADIUS, fill: '#dd0000', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH-1, text: null, textColor: 'white' },


    { category: 'player', toolId: 'player-black', label: 'Player (black)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-white', label: 'Player (white)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Player (red)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH,  text: null, textColor: 'white' },
    
    { category: 'player', toolId: 'player-black-G', label: 'Goalie (black)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'player-white-G', label: 'Goalie (white)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red-G', label: 'Goalie (red)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black',strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    
    { category: 'player', toolId: 'opponent', label: 'Opponent', type: 'opponent', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'coach', label: 'Coach', type: 'coach', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'C', textColor: 'black' }
];

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ playerTools, activePlayerTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementTool, setActiveSelectionTool, setSelectedItems, setActiveTextTool, setActiveNumberTool}) => (
    <div className="tool-group-inline">
        {playerTools.map((tool, idx) => (
            <div key={`player-${idx}`} className="tool-item">
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
                        setActiveTextTool(null);
                        setActiveNumberTool(null);
                        setSelectedItems({players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: []});
                    }}
                    title={tool.label}
                >
                    {tool.type === 'playerA' && (
                        
                        <svg width={32} height={32} viewBox="0 0 92.008 92.008" >
                            <g>
                                <path stroke={tool.stroke} strokeWidth={tool.strokeWidth }
                                                   fill={tool.fill} d="M46.004,21.672c5.975,0,10.836-4.861,10.836-10.836S51.979,0,46.004,0c-5.975,0-10.835,4.861-10.835,10.836
		S40.029,21.672,46.004,21.672z"/>
                                <path stroke={tool.stroke} strokeWidth={tool.strokeWidth }
                                                   fill={tool.fill} d="M68.074,54.008L59.296,26.81c-0.47-1.456-2.036-2.596-3.566-2.596h-1.312H53.48H38.526h-0.938h-1.312
		c-1.53,0-3.096,1.14-3.566,2.596l-8.776,27.198c-0.26,0.807-0.152,1.623,0.297,2.24s1.193,0.971,2.041,0.971h2.25
		c1.53,0,3.096-1.14,3.566-2.596l2.5-7.75v10.466v0.503v29.166c0,2.757,2.243,5,5,5h0.352c2.757,0,5-2.243,5-5V60.842h2.127v26.166
		c0,2.757,2.243,5,5,5h0.352c2.757,0,5-2.243,5-5V57.842v-0.503v-10.47l2.502,7.754c0.47,1.456,2.036,2.596,3.566,2.596h2.25
		c0.848,0,1.591-0.354,2.041-0.971S68.334,54.815,68.074,54.008z"/>
                            </g>
                        </svg>
                    )}

                    {(tool.type === "playerB" || tool.type === "coach" || tool.type === "opponent") && (
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

import React from "react";
import { selectionTools } from "./SelectionSelector.tsx";
import type { PlayerTool } from './playerConstants';


type PlayerSelectorProps = {
    playerTools: PlayerTool[];
    activePlayerTool: PlayerTool | null;
    setActivePlayerTool: (tool: PlayerTool | null) => void;
    setActiveEquipmentTool: (tool: null) => void;
    setActiveMovementTool: (tool: null) => void;
    setActiveSelectionTool: (tool: typeof selectionTools[0] | null) => void;
    setActiveTextTool: (tool: null) => void;
    setActiveNumberTool: (tool: null) => void;
    setActiveShapeTool: (tool: null) => void;
    setSelectedItems: (type: { players: number[]; equipment: number[]; lines: number[]; freehandLines: number[]; texts: number[]; numbers: number[] }) => void;
};

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ playerTools, activePlayerTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementTool, setActiveSelectionTool, setSelectedItems, setActiveTextTool, setActiveNumberTool, setActiveShapeTool }) => (
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
                        setActiveShapeTool(null);
                        setSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: [] });
                    }}
                    title={tool.label}
                >
                    {(tool.type === "playerB" || tool.type === "coach" || tool.type === "opponent") && (
                    <svg width={32} height={32}>
                        <circle cx={16} cy={16} r={tool.radius / 2} fill={tool.fill} stroke={tool.stroke} strokeWidth={tool.strokeWidth} />
                        {tool.text && (
                            <text x={16} y={21} textAnchor="middle" fontSize={14} fill={tool.textColor}>{tool.text}</text>
                        )}
                    </svg>
                        )}

                    {tool.type === "playerC" && (
                    <svg width={32} height={32}>
                        <polygon points="16,2 30,30 2,30" fill={tool.fill} stroke={tool.stroke} strokeWidth={tool.strokeWidth} strokeLinejoin="round" />
                        {tool.text && (
                            <text x={16} y={24} textAnchor="middle" fontSize={12} fill={tool.textColor}>{tool.text}</text>
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

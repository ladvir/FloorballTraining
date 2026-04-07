import React from "react";
import { selectionTools } from "./SelectionSelector.tsx";
import type { MovementTool } from './movementConstants';

const RUN_STROKE_DASH_ICON = '4,2';

type MovementSelectorProps = {
    movementTools: MovementTool[];
    activeMovementTool: MovementTool | null;
    setActiveMovementTool: (tool: MovementTool | null) => void;
    setActivePlayerTool: (tool: null) => void;
    setActiveEquipmentTool: (tool: null) => void;
    setActiveSelectionTool: (tool: typeof selectionTools[0] | null) => void;
    setActiveTextTool: (tool: null) => void;
    setActiveNumberTool: (tool: null) => void;
    setSelectedItems: (type: {
        players: number[];
        equipment: number[];
        lines: number[];
        freehandLines: number[];
        texts: number[];
        numbers: number[];
    }) => void;
};

const MovementSelector: React.FC<MovementSelectorProps> = ({
    movementTools,
    activeMovementTool,
    setActiveMovementTool,
    setActivePlayerTool,
    setActiveEquipmentTool,
    setActiveSelectionTool,
    setSelectedItems,
    setActiveTextTool,
    setActiveNumberTool
}) => (
    <div className="tool-group">
        {movementTools.map((tool) => (
            <div key={tool.toolId} className="tool-item">
                <button
                    className={activeMovementTool?.toolId === tool.toolId ? 'selected' : ''}
                    onClick={() => {
                        if (activeMovementTool?.toolId === tool.toolId) {
                            setActiveMovementTool(null);
                            setActiveSelectionTool(selectionTools[0]);
                        } else {
                            setActiveMovementTool(tool);
                            setActiveSelectionTool(null);
                        }
                        setActivePlayerTool(null);
                        setActiveEquipmentTool(null);
                        setActiveTextTool(null);
                        setActiveNumberTool(null);
                        setSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: [] });
                    }}
                    title={tool.label}
                >
                    <svg width={32} height={32}>
                        {tool.toolId === 'run-free' && (
                            <path d="m3 28c15-4-1-10 10-12s-2-4 12-7" stroke={tool.stroke}
                                  strokeWidth={tool.strokeWidth} strokeDasharray={RUN_STROKE_DASH_ICON} fill="none"
                                  markerEnd={`url(#arrow-${tool.stroke.replace('#', '')})`}/>
                        )}
                        {tool.toolId === 'run-straight' && (
                            <path d="M3,28 Q16,16 24,8" stroke={tool.stroke} strokeWidth={tool.strokeWidth}
                                  strokeDasharray={RUN_STROKE_DASH_ICON} fill="none"
                                  markerEnd={`url(#arrow-${tool.stroke.replace('#', '')})`}/>
                        )}
                        {tool.toolId === 'shoot' && (
                            <g>
                                <path d="M5,28 Q17,15 25,7" stroke={tool.stroke} strokeWidth={tool.strokeWidth}
                                      strokeDasharray={tool.strokeDasharray} fill="none"/>
                                <path d="M6,29 Q18,16 26,8" stroke={''} strokeWidth={tool.strokeWidth}
                                      strokeDasharray={tool.strokeDasharray} fill="none"
                                      markerEnd={`url(#arrow-${tool.stroke.replace('#', '')})`}/>
                                <path d="M7,30 Q19,17 27,9" stroke={tool.stroke} strokeWidth={tool.strokeWidth}
                                      strokeDasharray={tool.strokeDasharray} fill="none"/>
                            </g>
                        )}
                        {tool.toolId === 'pass' && (
                            <path d="M3,28 Q16,16 24,8" stroke={tool.stroke} strokeWidth={tool.strokeWidth}
                                  strokeDasharray={tool.strokeDasharray} fill="none"
                                  markerEnd={`url(#arrow-${tool.stroke.replace('#', '')})`}/>
                        )}
                        {tool.toolId === 'separator' && (
                            <line x1="15" y1="5" x2="15" y2="40" stroke={tool.stroke} strokeWidth={tool.strokeWidth}
                                  strokeDasharray={tool.strokeDasharray} fill="none" markerEnd="none"/>
                        )}
                    </svg>
                </button>
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default MovementSelector;

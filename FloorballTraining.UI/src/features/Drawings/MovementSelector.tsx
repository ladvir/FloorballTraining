import React from "react";
import {selectionTools} from "./SelectionSelector.tsx";

export type MovementTool = {
    category: 'movement';
    toolId: string;
    label: string;
    stroke: string;

    strokeWidth: number;
    strokeDasharray: string;
    arrow: boolean;
};

type MovementSelectorProps = {
    movementTools: MovementTool[];
    activeMovementTool: MovementTool | null;
    setActiveMovementTool: (tool: MovementTool | null) => void;
    setActivePlayerTool: (tool: any) => void;
    setActiveEquipmentTool: (tool: any) => void;
    setActiveSelectionTool: (type: any) => void;
    setActiveTextTool: (type: any) => void;
    setActiveNumberTool: (type: any) => void;
    setSelectedItems: (type: {
        players: number[],
        equipment: number[],
        lines: number[],
        freehandLines: number[],
        texts: number[],
        numbers: number[]
    }) => void;
};

const RUN_STROKE_DASH = '6,4';
const RUN_STROKE_DASH_ICON = '4,2';

export const movementTools: MovementTool[] = [
    {
        category: 'movement',
        toolId: 'run-straight',
        label: 'Run straight',
        stroke: '#000',
        strokeWidth: 1,
        strokeDasharray: RUN_STROKE_DASH,
        arrow: true
    },
    {
        category: 'movement',
        toolId: 'run-free',
        label: 'Run free',
        stroke: '#000',
        strokeWidth: 1,
        strokeDasharray: RUN_STROKE_DASH,
        arrow: true
    },
    {
        category: 'movement',
        toolId: 'shoot',
        label: 'Shoot',
        stroke: '#000',
        strokeWidth: 1,
        strokeDasharray: '',
        arrow: true
    },
    {
        category: 'movement',
        toolId: 'pass',
        label: 'Pass',
        stroke: '#000',
        strokeWidth: 1,
        strokeDasharray: '',
        arrow: true
    },
    {
        category: 'movement',
        toolId: 'separator',
        label: 'Separator',
        stroke: '#333',
        strokeWidth: 6,
        strokeDasharray: '',
        arrow: false
    }

];

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
                        setSelectedItems({players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: []});

                    }}

                    title={tool.label}
                >
                    <svg width={32} height={32}>
                        {tool.toolId === 'run-free' && (
                            /*<line x1={8} y1={24} x2={24} y2={8} stroke={tool.stroke} strokeWidth={tool.strokeWidth} strokeDasharray={tool.strokeDasharray} markerEnd={`url(#arrow-${tool.stroke.replace('#', '')})`}  />*/
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

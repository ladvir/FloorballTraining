import React from "react";
import type { MovementType } from "./MovementType";

export type MovementTool = {
    category: 'movement';
    toolId: string;
    label: string;
    type: 'arrow' | 'freehand-arrow';
    stroke: string;
    strokeWidth: number;
    strokeDasharray: string;
    markerEndId: string;
};

type MovementSelectorProps = {
    movementTools: MovementTool[];
    activeMovementTool: MovementTool | null;
    setActiveMovementTool: (tool: MovementTool) => void;
    setActivePlayerTool: (tool: any) => void;
    setActiveEquipmentTool: (tool: any) => void;
    setActiveMovementType: (type: MovementType) => void;
};

export const movementTools: MovementTool[] = [
    { category: 'movement', toolId: 'run-straight', label: 'Run Straight', type: 'arrow', stroke: '#000', strokeWidth: 1, strokeDasharray: '5,3', markerEndId: 'arrow' },
    { category: 'movement', toolId: 'run-free', label: 'Run Free', type: 'freehand-arrow', stroke: '#000', strokeWidth: 1, strokeDasharray: '5,3', markerEndId: 'arrow' }
];

const mapToolToMovementType = (tool: MovementTool): MovementType => ({
    id: tool.toolId,
    label: tool.label,
    color: tool.stroke,
    dash: tool.strokeDasharray,
    arrow: true,
    strokeWidth: tool.strokeWidth
});

const MovementSelector: React.FC<MovementSelectorProps> = ({ movementTools, activeMovementTool, setActiveMovementTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementType }) => (
    <div className="tool-group">
        {movementTools.map((tool) => (
            <div key={tool.toolId} className="tool-item">
                <button
                    className={activeMovementTool?.toolId === tool.toolId ? 'active' : ''}
                    onClick={() => {
                        setActiveMovementTool(tool);
                        setActivePlayerTool(null);
                        setActiveEquipmentTool(null);
                        setActiveMovementType(mapToolToMovementType(tool));
                    }}
                    title={tool.label}
                >
                    <svg width={32} height={32}>
                        <line x1={8} y1={24} x2={24} y2={8} stroke={tool.stroke} strokeWidth={tool.strokeWidth} strokeDasharray={tool.strokeDasharray} markerEnd="url(#arrow)" />
                        {tool.type === 'freehand-arrow' && (
                            <path d="M8,24 Q16,16 24,8" stroke={tool.stroke} strokeWidth={tool.strokeWidth} strokeDasharray={tool.strokeDasharray} fill="none" markerEnd="url(#arrow)" />
                        )}
                    </svg>
                </button>
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default MovementSelector;

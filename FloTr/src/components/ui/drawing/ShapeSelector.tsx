/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { selectionTools, type SelectionTool } from "./SelectionSelector.tsx";
import type { ShapeType } from './DrawingTypes';

export type ShapeTool = {
    toolId: ShapeType;
    category: 'shape';
    label: string;
    filled: boolean;
};

export const shapeTools: ShapeTool[] = [
    { toolId: 'rectangle', category: 'shape', label: 'Obdélník', filled: false },
    { toolId: 'rectangle', category: 'shape', label: 'Obdélník', filled: true },
    { toolId: 'square', category: 'shape', label: 'Čtverec', filled: false },
    { toolId: 'square', category: 'shape', label: 'Čtverec', filled: true },
    { toolId: 'circle', category: 'shape', label: 'Kružnice', filled: false },
    { toolId: 'circle', category: 'shape', label: 'Kruh', filled: true },
    { toolId: 'triangle', category: 'shape', label: 'Trojúhelník', filled: false },
    { toolId: 'triangle', category: 'shape', label: 'Trojúhelník', filled: true },
    { toolId: 'ellipse', category: 'shape', label: 'Elipsa', filled: false },
    { toolId: 'ellipse', category: 'shape', label: 'Elipsa', filled: true },
];

interface Props {
    activeShapeTool: ShapeTool | null;
    setActiveShapeTool: (tool: ShapeTool | null) => void;
    setActivePlayerTool: (tool: null) => void;
    setActiveEquipmentTool: (tool: null) => void;
    setActiveMovementTool: (tool: null) => void;
    setActiveSelectionTool: (tool: SelectionTool | null) => void;
    setActiveTextTool: (tool: null) => void;
    setActiveNumberTool: (tool: null) => void;
    setSelectedItems: (items: { players: number[]; equipment: number[]; lines: number[]; freehandLines: number[]; texts: number[]; numbers: number[] }) => void;
}

const SHAPE_STROKE_COLOR = '#1e3a5f';
const SHAPE_FILL_COLOR = 'rgba(30, 58, 95, 0.3)';

function ShapeIcon({ tool }: { tool: ShapeTool }) {
    const stroke = SHAPE_STROKE_COLOR;
    const fill = tool.filled ? SHAPE_FILL_COLOR : 'none';
    const sw = 1;

    switch (tool.toolId) {
        case 'rectangle':
            return (
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <rect x="4" y="8" width="24" height="16" fill={fill} stroke={stroke} strokeWidth={sw} />
                </svg>
            );
        case 'square':
            return (
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <rect x="6" y="6" width="20" height="20" fill={fill} stroke={stroke} strokeWidth={sw} />
                </svg>
            );
        case 'circle':
            return (
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="12" fill={fill} stroke={stroke} strokeWidth={sw} />
                </svg>
            );
        case 'triangle':
            return (
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <polygon points="16,4 28,28 4,28" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
                </svg>
            );
        case 'ellipse':
            return (
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <ellipse cx="16" cy="16" rx="14" ry="9" fill={fill} stroke={stroke} strokeWidth={sw} />
                </svg>
            );
    }
}

const ShapeSelector: React.FC<Props> = ({
    activeShapeTool,
    setActiveShapeTool,
    setActivePlayerTool,
    setActiveEquipmentTool,
    setActiveMovementTool,
    setActiveSelectionTool,
    setActiveTextTool,
    setActiveNumberTool,
    setSelectedItems,
}) => {
    const isActive = (tool: ShapeTool) =>
        activeShapeTool?.toolId === tool.toolId && activeShapeTool?.filled === tool.filled;

    return (
        <div className="tool-group">
            {shapeTools.map((tool) => (
                <div key={`${tool.toolId}-${tool.filled ? 'filled' : 'outline'}`} className="tool-item">
                    <button
                        className={isActive(tool) ? 'selected' : ''}
                        onClick={() => {
                            if (isActive(tool)) {
                                setActiveShapeTool(null);
                                setActiveSelectionTool(selectionTools[0]);
                            } else {
                                setActiveShapeTool(tool);
                                setActiveSelectionTool(null);
                            }
                            setActivePlayerTool(null);
                            setActiveEquipmentTool(null);
                            setActiveMovementTool(null);
                            setActiveTextTool(null);
                            setActiveNumberTool(null);
                            setSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: [] });
                        }}
                        title={tool.label}
                    >
                        <ShapeIcon tool={tool} />
                    </button>
                    <span>{tool.label}</span>
                </div>
            ))}
        </div>
    );
};

export default ShapeSelector;

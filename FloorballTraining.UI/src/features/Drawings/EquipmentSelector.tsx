import React from "react";
import {selectionTools} from "./SelectionSelector.tsx";
export type EquipmentTool = {
    category: 'equipment';
    toolId: string;
    label: string;
    type: 'equipment';
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    width?: number;
    height?: number;
    isSet?: boolean;
    length?: number;
};

type EquipmentSelectorProps = {
    equipmentTools: EquipmentTool[];
    activeEquipmentTool: EquipmentTool | null;
    setActiveEquipmentTool: (tool: EquipmentTool | null) => void;
    setActivePlayerTool: (tool: any) => void;
    setActiveMovementTool: (type: any) => void;
    setActiveSelectionTool: (type: any) => void;
    setActiveTextTool: (type: any) => void;
    setActiveNumberTool: (type: any) => void;
    setSelectedItems: (type:{players: number[], equipment: number[], lines: number[], freehandLines: number[], texts: number[], numbers: number[]}) => void;
};


export const EQUIPMENT_BALL_RADIUS = 3;
const EQUIPMENT_GATE_WIDTH = 22;
const EQUIPMENT_GATE_HEIGHT = 54;
export const EQUIPMENT_CONE_RADIUS = 8;
export const EQUIPMENT_CONE_HEIGHT = 20;

// Helper funkce pro získání škálovaných hodnot
export const getScaledBallRadius = (scaleFactor: number = 1) => EQUIPMENT_BALL_RADIUS * scaleFactor;
export const getScaledGateWidth = (scaleFactor: number = 1) => EQUIPMENT_GATE_WIDTH * scaleFactor;
export const getScaledGateHeight = (scaleFactor: number = 1) => EQUIPMENT_GATE_HEIGHT * scaleFactor;
export const getScaledConeRadius = (scaleFactor: number = 1) => EQUIPMENT_CONE_RADIUS * scaleFactor;
export const getScaledConeHeight = (scaleFactor: number = 1) => EQUIPMENT_CONE_HEIGHT * scaleFactor;

export const equipmentTools: EquipmentTool[] = [
    {
        category: 'equipment',
        toolId: 'ball',
        label: 'Ball',
        type: 'equipment',
        radius: EQUIPMENT_BALL_RADIUS,
        fill: 'orange',
        stroke: 'black'
    },
    {
        category: 'equipment',
        toolId: 'many-balls',
        label: 'Many balls',
        type: 'equipment',
        radius: EQUIPMENT_BALL_RADIUS,
        fill: 'orange',
        stroke: 'black',
        isSet: true
    },
    {
        category: 'equipment',
        toolId: 'gate',
        label: 'Gate',
        type: 'equipment',
        width: EQUIPMENT_GATE_WIDTH,
        height: EQUIPMENT_GATE_HEIGHT,
        fill: 'grey',
        stroke: 'black'
    },
    {
        category: 'equipment',
        toolId: 'cone',
        label: 'Cone',
        type: 'equipment',
        radius: EQUIPMENT_CONE_RADIUS,
        height: EQUIPMENT_CONE_HEIGHT,
        fill: 'red',
        stroke: 'black'
    }
    
];

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ equipmentTools, activeEquipmentTool, setActiveEquipmentTool, setActivePlayerTool, setActiveMovementTool, setActiveSelectionTool, setSelectedItems, setActiveTextTool, setActiveNumberTool }) => (
    <div className="tool-group">
        {equipmentTools.map(tool => (
            <div key={tool.toolId} className="tool-item">
                <button 
                    className={activeEquipmentTool?.toolId === tool.toolId ? 'selected' : ''}
                    onClick={() => {
                        if (activeEquipmentTool?.toolId === tool.toolId) {
                            setActiveEquipmentTool(null);
                            setActiveSelectionTool(selectionTools[0]);
                        } else {
                            setActiveEquipmentTool(tool);
                            setActiveSelectionTool(null);
                        }
                        setActivePlayerTool(null);
                        setActiveMovementTool(null);
                        setActiveTextTool(null);
                        setActiveNumberTool(null);
                        setSelectedItems({players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: []});
                    }}
                    
                    title={tool.label}
                >
                    {tool.toolId === 'ball' ? (
                        <svg width={32} height={32}><circle cx={16} cy={16} r={tool.radius} fill={tool.fill} stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                    ) : tool.toolId === 'many-balls' ? (
                        <svg width={32} height={32}>
                            <circle cx="15" cy="14" r={tool.radius} fill="orange" stroke="black" strokeWidth={tool.strokeWidth}></circle>
                            <circle cx="22" cy="18" r={tool.radius} fill="orange" stroke="black" strokeWidth={tool.strokeWidth}></circle>
                            <circle cx="19" cy="20" r={tool.radius} fill="orange" stroke="black" strokeWidth={tool.strokeWidth}></circle>
                            <circle cx="8" cy="18" r={tool.radius} fill="orange" stroke="black" strokeWidth={tool.strokeWidth}></circle>
                        </svg>
                    ) : tool.toolId === 'gate' ? (
                        <svg width={32} height={32}><rect x={6} y={6} width={10} height={20} fill={tool.fill} stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                    ) : tool.toolId === 'cone' ? (
                        <svg width={32} height={32}><polygon points="16,6 26,26 6,26" fill={tool.fill} stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                    ) : null}
                </button>
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default EquipmentSelector;

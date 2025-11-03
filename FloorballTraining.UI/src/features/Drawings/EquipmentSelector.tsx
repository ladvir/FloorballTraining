import React from "react";

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
    setActiveMovementType: (type: any) => void;
};


const EQUIPMENT_BALL_RADIUS = 6;
const EQUIPMENT_GATE_WIDTH = 40;
const EQUIPMENT_GATE_HEIGHT = 100;
const EQUIPMENT_CONE_RADIUS = 10;
const EQUIPMENT_CONE_HEIGHT = 25;
const EQUIPMENT_BARRIER_STROKE_WIDTH = 8;
const EQUIPMENT_BARRIER_CORNER_RADIUS = 90;

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
        label: 'Many Balls',
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
    },
    {
        category: 'equipment',
        toolId: 'barrier-corner',
        label: 'Barrier Corner',
        type: 'equipment',
        radius: EQUIPMENT_BARRIER_CORNER_RADIUS,
        fill: 'darkblue',
        stroke: 'darkblue',
        strokeWidth: EQUIPMENT_BARRIER_STROKE_WIDTH
    }
];

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ equipmentTools, activeEquipmentTool, setActiveEquipmentTool, setActivePlayerTool, setActiveMovementType }) => (
    <div className="tool-group">
        {equipmentTools.map(tool => (
            <div key={tool.toolId} className="tool-item">
                <button
                    className={activeEquipmentTool?.toolId === tool.toolId ? 'active' : ''}
                    onClick={() => {
                        setActiveEquipmentTool(tool);
                        setActivePlayerTool(null);
                        setActiveMovementType(null);
                    }}
                    title={tool.label}
                >
                    {tool.toolId === 'ball' ? (
                        <svg width={32} height={32}><circle cx={16} cy={16} r={tool.radius} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} /></svg>
                    ) : tool.toolId === 'many-balls' ? (
                        <svg width={32} height={32}>
                            <circle cx="15" cy="14" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                            <circle cx="22" cy="18" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                            <circle cx="19" cy="20" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                            <circle cx="8" cy="18" r="6" fill="orange" stroke="black" strokeWidth={1}></circle>
                        </svg>
                    ) : tool.toolId === 'gate' ? (
                        <svg width={32} height={32}><rect x={6} y={6} width={10} height={20} fill={tool.fill} stroke={tool.stroke} strokeWidth={2} /></svg>
                    ) : tool.toolId === 'cone' ? (
                        <svg width={32} height={32}><polygon points="16,6 26,26 6,26" fill={tool.fill} stroke={tool.stroke} strokeWidth={1} /></svg>
                    ) : tool.toolId === 'barrier-line' ? (
                        <svg width={32} height={32}><line x1={6} y1={16} x2={26} y2={16} stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                    ) : tool.toolId === 'barrier-corner' ? (
                        <svg width={32} height={32}><path d="M 6 26 Q 16 6 26 26" fill="none" stroke={tool.stroke} strokeWidth={tool.strokeWidth} /></svg>
                    ) : null}
                </button>
                <span style={{ fontSize: 12 }}>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default EquipmentSelector;


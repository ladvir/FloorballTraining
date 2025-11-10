import React from "react";


export type SelectionTool = {
    toolId: string;
    label: string;
    icon: React.ReactNode;
};

const selectionTools: SelectionTool[] = [
    {
        toolId: "select",
        label: "Výběr prvků",
        icon: (
            <svg width={32} height={32} viewBox="0 0 32 32">
                <rect x={6} y={6} width={20} height={20} rx={4} fill="#fff" stroke="#333" strokeWidth={2} />
                <polyline points="10,10 22,10 22,22 10,22 10,10" fill="none" stroke="#333" strokeWidth={2} />
            </svg>
        )
    }
];

export type SelectionSelectorProps = {
    activeSelectionTool: SelectionTool | null;
    setActiveSelectionTool: (tool: SelectionTool | null) => void;
    
    setActivePlayerTool: (tool: any) => void;
    setActiveEquipmentTool: (tool: any) => void;
    setActiveMovementTool: (type: any) => void;    
};

const SelectionSelector: React.FC<SelectionSelectorProps> = ({ activeSelectionTool, setActiveSelectionTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementTool }) => (
    <div className="tool-group">
        {selectionTools.map(tool => (
            <div key={tool.toolId} className="tool-item">
                <button
                    className={activeSelectionTool?.toolId === tool.toolId ? 'active' : ''}
                    onClick={() => {
                        setActiveSelectionTool(tool);
                        setActivePlayerTool(null);
                        setActiveEquipmentTool(null);
                        setActiveMovementTool(null);
                    }}
                    title={tool.label}
                >
                    {tool.icon}
                </button>
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default SelectionSelector;
export { selectionTools };

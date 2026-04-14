/* eslint-disable react-refresh/only-export-components */
import React from "react";


export type SelectionTool = {
    toolId: string;
    label: string;
    icon: React.ReactNode;
};

const selectionTools: SelectionTool[] = [
    {
        toolId: "select",
        label: "Výběr",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 25 24"><path fill="#000000" d="M5.523 4.75a.75.75 0 0 0-.75.75v1.625a.75.75 0 0 1-1.5 0V5.5a2.25 2.25 0 0 1 2.25-2.25h1.625a.75.75 0 0 1 0 1.5zM9.648 4a.75.75 0 0 1 .75-.75h3.25a.75.75 0 1 1 0 1.5h-3.25a.75.75 0 0 1-.75-.75m6.5 0a.75.75 0 0 1 .75-.75h1.625a2.25 2.25 0 0 1 2.25 2.25v1.625a.75.75 0 1 1-1.5 0V5.5a.75.75 0 0 0-.75-.75h-1.625a.75.75 0 0 1-.75-.75M4.023 9.625a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0v-3.25a.75.75 0 0 1 .75-.75m16 0a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-.724.75l-.748-.546a.8.8 0 0 1-.028-.204v-3.25a.75.75 0 0 1 .75-.75M12.127 20.65l-.151-1.4h-1.578a.75.75 0 0 0 0 1.5h1.742zm-8.104-4.525a.75.75 0 0 1 .75.75V18.5c0 .414.336.75.75.75h1.625a.75.75 0 0 1 0 1.5H5.523a2.25 2.25 0 0 1-2.25-2.25v-1.625a.75.75 0 0 1 .75-.75"/><path fill="#000000" d="M13.01 11.726a.75.75 0 0 1 .818.044l6.525 4.767a.75.75 0 0 1-.305 1.343l-2.364.438l1.259 2.181a.75.75 0 0 1-1.3.75l-1.259-2.181l-1.562 1.829a.75.75 0 0 1-1.316-.407l-.866-8.034a.75.75 0 0 1 .37-.73m1.8 6.874l.778-.91a2.25 2.25 0 0 1 1.3-.75l1.176-.218l-3.75-2.74z" clipRule="evenodd"/></svg>
        )
    }
];

export type SelectionSelectorProps = {
    activeSelectionTool: SelectionTool | null;
    setActiveSelectionTool: (tool: SelectionTool | null) => void;
    setActivePlayerTool: (tool: null) => void;
    setActiveEquipmentTool: (tool: null) => void;
    setActiveMovementTool: (tool: null) => void;
    setActiveTextTool: (tool: null) => void;
    setActiveNumberTool: (tool: null) => void;
    setActiveShapeTool: (tool: null) => void;
    setSelectedItems: (items: {players: number[], equipment: number[], lines: number[], freehandLines: number[], texts: number[], numbers: number[]}) => void;
};

const SelectionSelector: React.FC<SelectionSelectorProps> = ({ activeSelectionTool, setActiveSelectionTool, setActivePlayerTool, setActiveEquipmentTool, setActiveMovementTool, setSelectedItems, setActiveTextTool, setActiveNumberTool, setActiveShapeTool }) => (
    <div className="tool-group">
        {selectionTools.map(tool => (
            <div key={tool.toolId} className="tool-item">
                <button
                    className={activeSelectionTool?.toolId === tool.toolId ? 'selected' : ''}
                    onClick={() => {
                        setActiveSelectionTool(tool);
                        setActivePlayerTool(null);
                        setActiveEquipmentTool(null);
                        setActiveMovementTool(null);
                        setActiveTextTool(null);
                        setActiveNumberTool(null);
                        setActiveShapeTool(null);
                        setSelectedItems({players: [], equipment: [], lines: [], freehandLines: [], texts:[], numbers: []});
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

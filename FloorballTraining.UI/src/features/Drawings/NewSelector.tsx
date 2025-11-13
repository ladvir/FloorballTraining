import React from "react";
import { selectionTools } from "./SelectionSelector";

export type NewTool = {
    toolId: string;
    label: string;
    icon: React.ReactNode;
};

const newTools: NewTool[] = [
    {
        toolId: "new",
        label: "New",
        icon: (
            <svg width={32} height={32} viewBox="0 0 256 256" fill="none">
                <path fill="#000000" d="M152 152Zm52.97 50.404a4 4 0 008 0V88a4 4 0 00-1.17-2.83l-56-56A4 4 0 00152 28H56A12 12 0 0044 40V201a4 4 0 008 0V40a4 4 0 014-4h92V88a4 4 0 004 4h52.291ZM156.729 83.726V41.65L198.34 84Z"/></svg>
        )
    }
];

export type NewSelectorProps = {
    onNew: () => void;
    setActiveSelectionTool: (tool: any) => void;
};

const NewSelector: React.FC<NewSelectorProps> = ({ onNew, setActiveSelectionTool }) => (
    <div className="tool-group">
        {newTools.map(tool => (
            <div key={tool.toolId} className="tool-item">
                <button
                    onClick={() => {
                        onNew();
                        setActiveSelectionTool(selectionTools[0]);
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

export default NewSelector;


import React from 'react';
import type { TextItem } from './DrawingTypes';

interface TextLayerProps {
    texts: TextItem[];
    selectedItems: number[];
    handleSelect: (type: 'text', idx: number, e: React.MouseEvent) => void;
    onEditText: (item: TextItem, e: React.MouseEvent) => void;
}

const TextLayer: React.FC<TextLayerProps> = ({ texts, selectedItems, handleSelect, onEditText }) => {
    return (
        <g id="text-layer">
            {texts.map((t, i) => {
                const isSelected = selectedItems.includes(i);
                const lines = t.text.split(/\r?\n/);
                const lineHeight = t.fontSize * 1.2;
                const approxWidth = Math.max(...lines.map(l => l.length || 1)) * (t.fontSize * 0.6);
                const totalHeight = lines.length * lineHeight;
                return (
                    <g key={t.id}>
                        <text key={t.id}
                            data-type="text"
                            x={t.x}
                            y={t.y}
                            fontSize={t.fontSize}
                            // fontFamily="Arial, sans-serif"
                            fill={t.color}
                            // style={{ userSelect: 'none', cursor: 'text', whiteSpace: 'pre' }}
                            onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                    handleSelect('text', i, e);
                                } else {
                                    onEditText(t, e);
                                }
                            }}
                        >
                            {lines.map((line, li) => (
                                <tspan key={li} x={t.x} dy={li === 0 ? 0 : lineHeight}>{line || ' '}</tspan>
                            ))}
                        </text>
                        {isSelected && (
                            <rect
                                x={t.x - 2}
                                y={t.y - t.fontSize}
                                width={approxWidth + 4}
                                height={totalHeight + 4 - (lineHeight - t.fontSize)}
                                stroke="#007bff"
                                strokeWidth={1}
                                fill="none"
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
};

export default TextLayer;

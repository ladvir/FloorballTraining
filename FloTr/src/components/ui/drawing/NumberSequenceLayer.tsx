import React from 'react';
import type { NumberItem } from './DrawingTypes';

interface Props {
  numbers: NumberItem[];
  selectedItems: number[];
  handleSelect: (type: 'number', idx: number, e: React.MouseEvent) => void;
  onEdit?: (item: NumberItem, e: React.MouseEvent) => void;
}

const NumberSequenceLayer: React.FC<Props> = ({ numbers, selectedItems, handleSelect }) => {
  return (
    <g id="number-sequence-layer">
      {numbers.map((n, i) => {
        const isSelected = selectedItems.includes(i);
        return (
          <g key={n.id}>
            <text
              x={n.x}
              y={n.y}
              fontSize={n.fontSize}
              fontFamily="Arial, sans-serif"
              fill={n.color}
              dominantBaseline="hanging"
              textAnchor="start"
              style={{ userSelect: 'none', cursor: 'move' }}
              onMouseDown={(e) => handleSelect('number', i, e)}
              onTouchStart={(e) => handleSelect('number', i, e as unknown as React.MouseEvent)}
            >{n.value}</text>
            {isSelected && (
              <rect
                x={n.x - 4}
                y={n.y - n.fontSize}
                width={n.fontSize * 0.8 + 8}
                height={n.fontSize + 6}
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

export default NumberSequenceLayer;

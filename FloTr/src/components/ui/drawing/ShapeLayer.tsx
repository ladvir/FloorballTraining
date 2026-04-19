import React from 'react';
import type { ShapeOnCanvas } from './DrawingTypes';

interface Props {
    shapes: ShapeOnCanvas[];
    selectedItems: number[];
    handleSelect: (type: 'shape', idx: number, e: React.MouseEvent) => void;
}

const SELECTION_STROKE = '#2196F3';

const ShapeLayer: React.FC<Props> = ({ shapes, selectedItems, handleSelect }) => (
    <g id="shape-layer">
        {shapes.map((shape, idx) => {
            const isSelected = selectedItems.includes(idx);
            const stroke = isSelected ? SELECTION_STROKE : shape.strokeColor;
            const fill = shape.filled ? shape.fillColor : 'none';
            const sw = isSelected ? 3 : 2;

            switch (shape.type) {
                case 'rectangle':
                case 'square':
                    return (
                        <rect
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={sw}
                            style={{ cursor: 'move' }}
                            onMouseDown={(e) => handleSelect('shape', idx, e)}
                            onTouchStart={(e) => handleSelect('shape', idx, e as unknown as React.MouseEvent)}
                        />
                    );
                case 'circle':
                    return (
                        <circle
                            key={shape.id}
                            cx={shape.cx}
                            cy={shape.cy}
                            r={shape.r}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={sw}
                            style={{ cursor: 'move' }}
                            onMouseDown={(e) => handleSelect('shape', idx, e)}
                            onTouchStart={(e) => handleSelect('shape', idx, e as unknown as React.MouseEvent)}
                        />
                    );
                case 'triangle':
                    if (shape.points.length < 3) return null;
                    return (
                        <polygon
                            key={shape.id}
                            points={shape.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={sw}
                            strokeLinejoin="round"
                            style={{ cursor: 'move' }}
                            onMouseDown={(e) => handleSelect('shape', idx, e)}
                            onTouchStart={(e) => handleSelect('shape', idx, e as unknown as React.MouseEvent)}
                        />
                    );
                case 'ellipse':
                    return (
                        <ellipse
                            key={shape.id}
                            cx={shape.cx}
                            cy={shape.cy}
                            rx={shape.width}
                            ry={shape.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={sw}
                            style={{ cursor: 'move' }}
                            onMouseDown={(e) => handleSelect('shape', idx, e)}
                            onTouchStart={(e) => handleSelect('shape', idx, e as unknown as React.MouseEvent)}
                        />
                    );
                default:
                    return null;
            }
        })}
    </g>
);

export default ShapeLayer;

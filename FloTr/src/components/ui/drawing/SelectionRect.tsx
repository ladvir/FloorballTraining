import React from 'react';

interface SelectionRectProps {
  selectionRect: {x1: number, y1: number, x2: number, y2: number} | null;
}

const SelectionRect: React.FC<SelectionRectProps> = ({ selectionRect }) => {
  if (!selectionRect) return null;
  return (
    <rect
      x={Math.min(selectionRect.x1, selectionRect.x2)}
      y={Math.min(selectionRect.y1, selectionRect.y2)}
      width={Math.abs(selectionRect.x2 - selectionRect.x1)}
      height={Math.abs(selectionRect.y2 - selectionRect.y1)}
      fill="rgba(0,128,255,0.1)"
      stroke="#0080ff"
      strokeDasharray="4 2"
      strokeWidth={2}
    />
  );
};

export default SelectionRect;


import React from 'react';
import type { Line } from './DrawingTypes';
import type {MovementTool} from "./movementConstants";

interface PreviewLineProps {
  preview: Line | null;
  activeMovementTool: MovementTool | null;
}

const PreviewLine: React.FC<PreviewLineProps> = ({ preview, activeMovementTool }) => {
  if (!preview || !activeMovementTool) return null;
  if (activeMovementTool?.toolId === 'shoot') {
    const dx = preview.x2 - preview.x1;
    const dy = preview.y2 - preview.y1;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const off = 2;
    const ox = -dy / len * off;
    const oy = dx / len * off;
    return (
      <g>
        <line x1={preview.x1 + ox} y1={preview.y1 + oy} x2={preview.x2 + ox} y2={preview.y2 + oy} stroke={activeMovementTool.stroke} strokeWidth={activeMovementTool.strokeWidth} strokeDasharray={activeMovementTool.strokeDasharray} />
        <line x1={preview.x1} y1={preview.y1} x2={preview.x2} y2={preview.y2} stroke={''} strokeWidth={activeMovementTool.strokeWidth} strokeDasharray={activeMovementTool.strokeDasharray} markerEnd={activeMovementTool.arrow ? `url(#arrow-${activeMovementTool.stroke.replace('#', '')})` : undefined} />
        <line x1={preview.x1 - ox} y1={preview.y1 - oy} x2={preview.x2 - ox} y2={preview.y2 - oy} stroke={activeMovementTool.stroke} strokeWidth={activeMovementTool.strokeWidth} strokeDasharray={activeMovementTool.strokeDasharray} />
      </g>
    );
  }
  return (
    <line
      x1={preview.x1}
      y1={preview.y1}
      x2={preview.x2}
      y2={preview.y2}
      stroke={activeMovementTool.stroke}
      strokeWidth={activeMovementTool.strokeWidth}
      strokeDasharray={activeMovementTool.strokeDasharray}      
      markerEnd={activeMovementTool.arrow ? `url(#arrow-${activeMovementTool.stroke.replace('#', '')})` : undefined}
    />
  );
};

export default PreviewLine;


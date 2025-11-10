import React from 'react';
import type { Line } from './DrawingTypes';
import { pointsToSmoothPath } from './DrawingUtils';

interface LineLayerProps {
  lines: Line[];
  selectedItems: number[];
  handleSelect: (type: 'line', idx: number, e: React.MouseEvent) => void;
}

const LineLayer: React.FC<LineLayerProps> = ({ lines, selectedItems, handleSelect }) => (
  <>
    {lines.map((l, i) => {
      const selected = selectedItems.includes(i);
      const specialTypes = ['shoot', 'run-free', 'pass', 'assist'];
      if (specialTypes.includes(l.type)) {
        const dx = l.x2 - l.x1;
        const dy = l.y2 - l.y1;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const off = 1;
        const ox = -dy / len * off;
        const oy = dx / len * off;
        return (
          <g key={i} onClick={e => handleSelect('line', i, e)} style={{cursor:'pointer'}}>
            <line x1={l.x1 + ox} y1={l.y1 + oy} x2={l.x2 + ox} y2={l.y2 + oy} stroke={l.color} strokeWidth={l.strokeWidth} strokeDasharray={l.dash} />
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={''} strokeWidth={l.strokeWidth} strokeDasharray={l.dash} markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined} />
            <line x1={l.x1 - ox} y1={l.y1 - oy} x2={l.x2 - ox} y2={l.y2 - oy} stroke={l.color} strokeWidth={l.strokeWidth} strokeDasharray={l.dash} />
          </g>
        );
      } else {
        return (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={selected ? "#0080ff" : l?.color} strokeWidth={selected ? (l?.strokeWidth || 1)  : l?.strokeWidth} strokeDasharray={l?.dash} markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined} opacity={selected ? 0.7 : 1} onClick={e => handleSelect('line', i, e)} style={{cursor:'pointer'}} />
        );
      }
    })}
  </>
);

export default LineLayer;


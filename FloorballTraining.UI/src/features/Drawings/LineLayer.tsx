import React from 'react';
import type { Line } from './DrawingTypes';

interface LineLayerProps {
  lines: Line[];
  selectedItems: number[];
  handleSelect: (type: 'line', idx: number, e: React.MouseEvent) => void;
}

const LineLayer: React.FC<LineLayerProps> = ({ lines, selectedItems, handleSelect }) => (
  <>
    {lines.map((l, i) => {
      const selected = selectedItems.includes(i);
      const specialTypes = ['shoot', 'run-free', 'assist'];
      if (l.type === 'shoot') {
        const dx = l.x2 - l.x1;
        const dy = l.y2 - l.y1;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const off = 1;
        const ox = -dy / len * off;
        const oy = dx / len * off;
        return (
          <g key={i} style={{cursor:'pointer'}}>
            <line x1={l.x1 + ox} y1={l.y1 + oy} x2={l.x2 + ox} y2={l.y2 + oy} stroke={selected ? "#0080ff" : l.color} strokeWidth={selected ? (l.strokeWidth || 1) + 2 : l.strokeWidth} strokeDasharray={l.dash} onClick={e => handleSelect('line', i, e)} />
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={''} strokeWidth={l.strokeWidth} strokeDasharray={l.dash} markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined} onClick={e => handleSelect('line', i, e)} />
            <line x1={l.x1 - ox} y1={l.y1 - oy} x2={l.x2 - ox} y2={l.y2 - oy} stroke={selected ? "#0080ff" : l.color} strokeWidth={selected ? (l.strokeWidth || 1) + 2 : l.strokeWidth} strokeDasharray={l.dash} onClick={e => handleSelect('line', i, e)} />
          </g>
        );
      } else if (l.type === 'pass') {
        return (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={selected ? "#0080ff" : l.color}
            strokeWidth={selected ? (l.strokeWidth || 1) + 2 : l.strokeWidth}
            strokeDasharray={l.dash}
            markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
            opacity={selected ? 0.7 : 1}
            onClick={e => handleSelect('line', i, e)}
            style={{cursor:'pointer'}}
          />
        );
      } else if (specialTypes.includes(l.type)) {
        // Další speciální typy (např. run-free, assist) – vykresli jako jednoduchou čáru
        return (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={selected ? "#0080ff" : l.color}
            strokeWidth={selected ? (l.strokeWidth || 1) + 2 : l.strokeWidth}
            strokeDasharray={l.dash}
            markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
            opacity={selected ? 0.7 : 1}
            onClick={e => handleSelect('line', i, e)}
            style={{cursor:'pointer'}}
          />
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

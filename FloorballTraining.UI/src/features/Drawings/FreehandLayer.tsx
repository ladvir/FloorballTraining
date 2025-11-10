import React from 'react';
import type { FreehandLine } from './DrawingTypes';
import { pointsToSmoothPath } from './DrawingUtils';

interface FreehandLayerProps {
  freehandLines: FreehandLine[];
  selectedItems: number[];
  handleSelect: (type: 'freehand', idx: number, e: React.MouseEvent) => void;
}

const FreehandLayer: React.FC<FreehandLayerProps> = ({ freehandLines, selectedItems, handleSelect }) => (
  <>
    {freehandLines.map((l, i) => {
      const selected = selectedItems.includes(i);
      if (l.points.length > 1) {
        return (
          <path
            key={i}
            d={pointsToSmoothPath(l.points, 5, 5)}
            fill="none"
            stroke={selected ? "#0080ff" : (l.color || 'black')}
            strokeWidth={selected ? (l.strokeWidth || 2) + 2 : l.strokeWidth || 2}
            strokeDasharray={l.dash || ''}
            markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
            opacity={selected ? 0.7 : 1}
            onClick={e => handleSelect('freehand', i, e)}
            style={{cursor:'pointer'}}
          />
        );
      } else {
        return null;
      }
    })}
  </>
);

export default FreehandLayer;


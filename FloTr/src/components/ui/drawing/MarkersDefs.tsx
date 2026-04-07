import React from 'react';
import { movementTools } from './movementConstants';

const MarkersDefs: React.FC = () => (
  <defs>
    {[...new Set(movementTools.map(i => i.stroke))].map(color => (
      <marker
        key={color}
        id={`arrow-${color.replace('#', '')}`}
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerUnits="strokeWidth"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      </marker>
    ))}
  </defs>
);

export default MarkersDefs;


import React from 'react';
import type { PlayerOnCanvas } from './DrawingTypes';

interface PlayerLayerProps {
  players: PlayerOnCanvas[];
  selectedItems: number[];
  handleSelect: (type: 'player', idx: number, e: React.MouseEvent) => void;
}

const PlayerLayer: React.FC<PlayerLayerProps> = ({ players, selectedItems, handleSelect }) => (
  <>
    {players.map((player, idx) => {
      const selected = selectedItems.includes(idx);
      return (
        <g key={idx} transform={`translate(${player.x},${player.y})`} onClick={e => handleSelect('player', idx, e)} style={{cursor:'pointer'}}>
          {selected && (
            <circle
              r={(player.tool.radius ?? 6) + 4}
              fill="rgba(0,128,255,0.1)"
              stroke="#0080ff"
              strokeDasharray="4 2"
              strokeWidth={2}
            />
          )}
          <circle r={player.tool.radius ?? 6} fill={player.tool.fill} stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth} />
          {player.tool.toolId === 'opponent' && (
            <g>
              <line x1={-player.tool.radius/2} y1={-player.tool.radius/2} x2={player.tool.radius/2} y2={player.tool.radius/2} stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth} />
              <line x1={-player.tool.radius/2} y1={player.tool.radius/2} x2={player.tool.radius/2} y2={-player.tool.radius/2} stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth} />
            </g>
          )}
          {player.tool.text && (
            <text x={0} y={6} textAnchor="middle" fontSize={18} fill={player.tool.textColor}>{player.tool.text}</text>
          )}
        </g>
      );
    })}
  </>
);

export default PlayerLayer;


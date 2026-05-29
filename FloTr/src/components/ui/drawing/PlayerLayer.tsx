import React from 'react';
import type {PlayerOnCanvas} from './DrawingTypes';

interface PlayerLayerProps {
    players: PlayerOnCanvas[];
    selectedItems: number[];
    handleSelect: (type: 'player', idx: number, e: React.MouseEvent) => void;
}

const PlayerLayer: React.FC<PlayerLayerProps> = ({players, selectedItems, handleSelect}) => (
    <>
        {players.map((player, idx) => {
            const selected = selectedItems.includes(idx);
            return (
                <g key={`player-main${idx}`}>
                <defs>
                        <filter id="dilate" x="-50%" y="-50%" width="200%" height="200%">

                            <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="dilated"/>
                            <feGaussianBlur in="dilated" stdDeviation="0.5" result="blurred"/>
                            <feComposite in="blurred" in2="SourceAlpha" operator="xor" result="outline"/>
                            <feColorMatrix in="outline" type="matrix"
                                           values="0 0 0 0 0
                       0 0 0 0 0.5
                       0 0 0 0 1
                       0 0 0 0.9 0"/>
                        </filter>
                    </defs>
                    
                    <g id={`player-${idx}`} key={`player-${idx}`}  transform={`translate(${player.x},${player.y})`}
                       onMouseDown={e => handleSelect('player', idx, e)}
                       onTouchStart={e => handleSelect('player', idx, e as unknown as React.MouseEvent)}
                       style={{cursor: 'move'}}>


                        {player.tool.type == "playerA" && (
                            <g transform="scale(0.74)">
                                <g >
                                    <path stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth }
                                          fill={player.tool.fill} d="M46.004,21.672c5.975,0,10.836-4.861,10.836-10.836S51.979,0,46.004,0c-5.975,0-10.835,4.861-10.835,10.836
		S40.029,21.672,46.004,21.672z"/>
                                    <path stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth }
                                          fill={player.tool.fill} d="M68.074,54.008L59.296,26.81c-0.47-1.456-2.036-2.596-3.566-2.596h-1.312H53.48H38.526h-0.938h-1.312
		c-1.53,0-3.096,1.14-3.566,2.596l-8.776,27.198c-0.26,0.807-0.152,1.623,0.297,2.24s1.193,0.971,2.041,0.971h2.25
		c1.53,0,3.096-1.14,3.566-2.596l2.5-7.75v10.466v0.503v29.166c0,2.757,2.243,5,5,5h0.352c2.757,0,5-2.243,5-5V60.842h2.127v26.166
		c0,2.757,2.243,5,5,5h0.352c2.757,0,5-2.243,5-5V57.842v-0.503v-10.47l2.502,7.754c0.47,1.456,2.036,2.596,3.566,2.596h2.25
		c0.848,0,1.591-0.354,2.041-0.971S68.334,54.815,68.074,54.008z"/>
                                </g>
                            </g>
                            
                        )}

                        {(player.tool.type === "playerB" || player.tool.type === "coach" || player.tool.type === "opponent") && (
                            <circle r={player.tool.radius ?? 6} fill={player.tool.fill} stroke={player.tool.stroke}
                                    strokeWidth={player.tool.strokeWidth}/>

                        )}

                        {player.tool.type === "playerC" && (() => {
                            const r = player.tool.radius ?? 16;
                            const h = r * Math.sqrt(3) / 2;
                            return (
                                <polygon
                                    points={`0,${-h * 2/3} ${r / 2},${h / 3} ${-r / 2},${h / 3}`}
                                    fill={player.tool.fill}
                                    stroke={player.tool.stroke}
                                    strokeWidth={player.tool.strokeWidth}
                                    strokeLinejoin="round"
                                />
                            );
                        })()}

                        {player.tool.toolId === 'opponent' && (
                            <g>
                                <line x1={-player.tool.radius / 2} y1={-player.tool.radius / 2}
                                      x2={player.tool.radius / 2} y2={player.tool.radius / 2}
                                      stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth}/>
                                <line x1={-player.tool.radius / 2} y1={player.tool.radius / 2}
                                      x2={player.tool.radius / 2} y2={-player.tool.radius / 2}
                                      stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth}/>
                            </g>
                        )}


                        {player.tool.text && (
                            <text x={0} y={5} textAnchor="middle" fontSize={13}
                                  fill={player.tool.textColor}>{player.tool.text}</text>
                        )}
                    </g>


                   {selected && (
                                <g>
                                    <g filter="url(#dilate)">
                                        <use href={`#player-${idx}`} key={`dilate-${idx}`}/>
                                    </g>
                                    <use href={`#player-${idx}`} key={`player-${idx}-selected`}/>
                                </g>
                            )}

                </g>
            );
        })}

    </>
);

export default PlayerLayer;

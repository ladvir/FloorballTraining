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
                       onClick={e => handleSelect('player', idx, e)} style={{cursor: 'pointer'}}>


                        {player.tool.type == "playerA" && (
                            // <g transform="scale(0.14)">
                            //     <g>
                            //         <path stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth * 1 / 0.155}
                            //               fill={player.tool.fill}
                            //               d="M 208.5,9.5 C 241.28,8.28155 259.614,23.9482 263.5,56.5C 261.661,82.5017 247.995,98.0017 222.5,103C 195.619,104.443 178.453,92.2759 171,66.5C 167.541,36.7024 180.041,17.7024 208.5,9.5 Z"/>
                            //     </g>
                            //     <g>
                            //         <path stroke={player.tool.stroke} strokeWidth={player.tool.strokeWidth * 1 / 0.155}
                            //               fill={player.tool.fill}
                            //               d="M 259.5,101.5 C 280.211,99.2338 297.378,105.9 311,121.5C 328.45,154.735 345.117,188.401 361,222.5C 364.112,230.616 366.446,238.949 368,247.5C 371.441,278.786 374.441,310.119 377,341.5C 414.42,362.127 451.92,382.627 489.5,403C 500.579,410.455 504.079,420.621 500,433.5C 493.994,445.084 484.494,449.584 471.5,447C 427.212,423.523 383.212,399.523 339.5,375C 336.036,370.578 333.203,365.744 331,360.5C 324.671,347.002 318.837,333.335 313.5,319.5C 300.583,326.636 288.249,334.803 276.5,344C 310.333,379.833 344.167,415.667 378,451.5C 384.953,467.308 380.787,479.142 365.5,487C 356.637,489.451 348.637,487.784 341.5,482C 301.667,440.167 261.833,398.333 222,356.5C 215.494,347.263 214.827,337.596 220,327.5C 234.625,309.74 249.125,291.907 263.5,274C 255.726,256.952 247.559,240.119 239,223.5C 234.055,235.667 228.722,247.667 223,259.5C 221.833,260.667 220.667,261.833 219.5,263C 195.671,276.08 172.005,289.413 148.5,303C 144.654,304.669 140.654,305.836 136.5,306.5C 109.852,354.973 82.8519,403.14 55.5,451C 53.6079,451.973 51.6079,452.64 49.5,453C 40.1667,453.667 30.8333,453.667 21.5,453C 16.0896,451.257 12.2563,447.757 10,442.5C 9.50034,435.174 9.33368,427.841 9.5,420.5C 22.8375,420.333 36.1708,420.5 49.5,421C 52.7875,421.616 55.6208,423.116 58,425.5C 81.0867,384.995 103.92,344.328 126.5,303.5C 114.536,289.705 116.203,277.872 131.5,268C 151.167,257.167 170.833,246.333 190.5,235.5C 199.369,205.052 207.536,174.386 215,143.5C 221.342,120.32 236.175,106.32 259.5,101.5 Z"/>
                            //     </g>
                            //
                            //
                            // </g>



                            
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

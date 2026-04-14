import React from 'react';
import type {Line} from './DrawingTypes';

interface LineLayerProps {
    lines: Line[];
    selectedItems: number[];
    handleSelect: (type: 'line', idx: number, e: React.MouseEvent) => void;
}

const LineLayer: React.FC<LineLayerProps> = ({lines, selectedItems, handleSelect}) => (
    <>
        {lines.map((l, i) => {
            const selected = selectedItems.includes(i);
            const specialTypes = ['shoot', 'run-free', 'assist'];
            
            if (l.type === 'shoot') {
                const dx = l.x2 - l.x1;
                const dy = l.y2 - l.y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const off = 2;
                const ox = -dy / len * off;
                const oy = dx / len * off;
                return (
                    <g key={`shoot-${i}`}> // změna zde
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

                        <g id={'line' + i} key={i} style={{cursor: 'pointer'}}>
                            <line x1={l.x1 + ox} y1={l.y1 + oy} x2={l.x2 + ox} y2={l.y2 + oy} stroke={l.color}
                                  strokeWidth={(l.strokeWidth || 1)} strokeDasharray={l.dash}
                                  onClick={e => handleSelect('line', i, e)}/>
                            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={''} strokeWidth={l.strokeWidth}
                                  strokeDasharray={l.dash}
                                  markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                                  onClick={e => handleSelect('line', i, e)}/>
                            <line x1={l.x1 - ox} y1={l.y1 - oy} x2={l.x2 - ox} y2={l.y2 - oy} stroke={l.color}
                                  strokeWidth={(l.strokeWidth || 1)} strokeDasharray={l.dash}
                                  onClick={e => handleSelect('line', i, e)}/>
                        </g>
                        {selected && (
                            <g>
                                <g filter="url(#dilate)">
                                    <use href={'#line' + i}/>
                                </g>
                                <use href={'#line' + i}/>
                            </g>
                        )}
                    </g>
                );
            } else if (l.type === 'pass') {
                return (
                    <g key={`pass-${i}`}> // změna zde
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
                        <line id={'line' + i}
                              key={i}
                              x1={l.x1}
                              y1={l.y1}
                              x2={l.x2}
                              y2={l.y2}
                              stroke={l.color}
                              strokeWidth={l.strokeWidth}
                              strokeDasharray={l.dash}
                              markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                              onClick={e => handleSelect('line', i, e)}
                              style={{cursor: 'pointer'}}
                        />

                        {selected && (
                            <g>
                                <g filter="url(#dilate)">
                                    <use href={'#line' + i}/>
                                </g>
                                <use href={'#line' + i}/>
                            </g>
                        )}
                    </g>

                );
            } else if (specialTypes.includes(l.type)) {
                return (
                    <g key={`${l.type}-${i}`}> // změna zde
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
                        <line id={'line' + i}
                              key={i}
                              x1={l.x1}
                              y1={l.y1}
                              x2={l.x2}
                              y2={l.y2}
                              stroke={l.color}
                              strokeWidth={l.strokeWidth}
                              strokeDasharray={l.dash}
                              markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                              onClick={e => handleSelect('line', i, e)}
                              style={{cursor: 'pointer'}}
                        />
                        {selected && (
                            <g>
                                <g filter="url(#dilate)">
                                    <use href={'#line' + i}/>
                                </g>
                                <use href={'#line' + i}/>
                            </g>
                        )}
                    </g>
                );
            } else {
                return (
                    <g key={`line-${i}`}> // změna zde
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
                        <line id={'line' + i} key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l?.color}
                              strokeWidth={(l?.strokeWidth || 1.5)} strokeDasharray={l?.dash} fill="none"
                              markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                              onClick={e => handleSelect('line', i, e)} style={{cursor: 'pointer'}}/>
                        {selected && (
                            <g>
                                <g filter="url(#dilate)">
                                    <use href={'#line' + i}/>
                                </g>
                                <use href={'#line' + i}/>
                            </g>
                        )}
                    </g>
                );
            }
        })}
    </>
);

export default LineLayer;

import React from 'react';
import type {FreehandLine} from './DrawingTypes';
import {pointsToSmoothPath} from './DrawingUtils';

interface FreehandLayerProps {
    freehandLines: FreehandLine[];
    selectedItems: number[];
    handleSelect: (type: 'freehand', idx: number, e: React.MouseEvent) => void;
}

const FreehandLayer: React.FC<FreehandLayerProps> = ({freehandLines, selectedItems, handleSelect}) => (
    <>
        {freehandLines.map((l, i) => {
            const selected = selectedItems.includes(i);
            if (l.points.length > 1) {
                return (

                    <g>
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
                        <path
                            id={'line' + i}
                            key={i}
                            d={pointsToSmoothPath(l.points, 5, 5)}
                            fill="none"
                            stroke={(l.color || 'black')}
                            strokeWidth={l.strokeWidth || 2}
                            strokeDasharray={l.dash || ''}
                            markerEnd={l.arrow ? `url(#arrow-${l.color.replace('#', '')})` : undefined}
                            onMouseDown={e => handleSelect('freehand', i, e)}
                            onTouchStart={e => handleSelect('freehand', i, e as unknown as React.MouseEvent)}
                            style={{cursor: 'move'}}
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
                return null;
            }
        })}
    </>
);

export default FreehandLayer;


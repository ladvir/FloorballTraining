import React from 'react';
import type { EquipmentOnCanvas } from './DrawingTypes';

interface EquipmentLayerProps {
  equipment: EquipmentOnCanvas[];
  selectedItems: number[];
  handleSelect: (type: 'equipment', idx: number, e: React.MouseEvent) => void;
}

const EquipmentLayer: React.FC<EquipmentLayerProps> = ({ equipment, selectedItems, handleSelect }) => (
  <>
    {equipment.map((item, idx) => {
      const selected = selectedItems.includes(idx);
      return (
          <g>
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
              
            <g id={'equipment' + idx} key={idx} transform={`translate(${item.x},${item.y})`} onClick={e => handleSelect('equipment', idx, e)} style={{cursor:'pointer'}}>
              {renderEquipmentOnCanvas(item, idx)}
            </g>
                
            </g>

              {selected && (
                  <g>
                      <g filter="url(#dilate)">
                          <use href={'#equipment' + idx}/>
                      </g>
                      <use href={'#equipment' + idx}/>
                  </g>
              )}
          
        </g>
      );
    })}
  </>
);

const renderEquipmentOnCanvas = (item: EquipmentOnCanvas, idx: number) => {
    const tool = item.tool;
    if (tool.toolId === 'ball') {
        return <circle id={'equipment' + idx} key={idx} cx={0} cy={0} r={tool.radius ?? 0} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />;
    } else if (tool.toolId === 'many-balls') {
        const radius = tool.radius ?? 6;
        return (
            <g id={'equipment' + idx} key={idx}>
                {(item.balls || []).map((b: {x: number, y: number}, i: number) => (
                    <circle key={i} cx={b.x} cy={b.y} r={radius} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />
                ))}
            </g>
        );
    } else if (tool.toolId === 'gate') {
        const width = tool.width ?? 0;
        const height = tool.height ?? 0;
        return <rect id={'equipment' + idx}  key={idx} x={-width/2} y={-height/2} width={width} height={height} fill={tool.fill} stroke={tool.stroke} strokeWidth={2} />;
    } else if (tool.toolId === 'cone') {
        const h = tool.height ?? 0, r = tool.radius ?? 0;
        return <polygon id={'equipment' + idx} key={idx} points={`0,${-h/2} ${r},${h/2} ${-r},${h/2}`} fill={tool.fill} stroke={tool.stroke} strokeWidth={1} />;
    }
    return null;
};


export default EquipmentLayer;


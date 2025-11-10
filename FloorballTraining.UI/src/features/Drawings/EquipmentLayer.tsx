import React from 'react';
import type { EquipmentOnCanvas } from './DrawingTypes';

interface EquipmentLayerProps {
  equipment: EquipmentOnCanvas[];
  selectedItems: number[];
  handleSelect: (type: 'equipment', idx: number, e: React.MouseEvent) => void;
  renderEquipmentOnCanvas: (item: EquipmentOnCanvas, idx: number) => React.ReactNode;
  renderEquipmentHighlight: (item: EquipmentOnCanvas) => React.ReactNode;
}

const EquipmentLayer: React.FC<EquipmentLayerProps> = ({ equipment, selectedItems, handleSelect, renderEquipmentOnCanvas, renderEquipmentHighlight }) => (
  <>
    {equipment.map((item, idx) => {
      const selected = selectedItems.includes(idx);
      return (
        <g key={idx} transform={`translate(${item.x},${item.y})`} onClick={e => handleSelect('equipment', idx, e)} style={{cursor:'pointer'}}>
          {selected && renderEquipmentHighlight(item)}
          {renderEquipmentOnCanvas(item, idx)}
        </g>
      );
    })}
  </>
);

export default EquipmentLayer;


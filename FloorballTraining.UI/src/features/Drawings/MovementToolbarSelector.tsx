import React from 'react';
import type {MovementType} from "./MovementType.tsx";

interface MovementToolbarSelectorProps {
  movementType: MovementType; // nebo enum, podle potřeby
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: () => void;
}

const MovementToolbarSelector: React.FC<MovementToolbarSelectorProps> = ({
  movementType,
  label,
  icon,
  active,
  onSelect,
}) => (
  
   <div key={movementType.id} className="tool-item">
    <button
      className={active ? 'active' : ''}
      onClick={onSelect}
      title={label}
      style={{ minWidth: 40, minHeight: 40 }}
    >
      {icon}
    </button>
    <span>{label}</span>
  </div>
);

export default MovementToolbarSelector;

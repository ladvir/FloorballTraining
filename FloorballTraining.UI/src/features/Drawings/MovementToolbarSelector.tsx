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
  <div className="tool-group" data-movement-type={movementType}>
    <button
      className={active ? 'active' : ''}
      onClick={onSelect}
      title={label}
      style={{ minWidth: 40, minHeight: 40 }}
    >
      {icon}
    </button>
    <span style={{ fontSize: 12 }}>{label}</span>
  </div>
);

export default MovementToolbarSelector;

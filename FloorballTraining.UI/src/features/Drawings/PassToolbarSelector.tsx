import React from 'react';

interface PassToolbarSelectorProps {
  active: boolean;
  onSelect: () => void;
}

const PassToolbarSelector: React.FC<PassToolbarSelectorProps> = ({ active, onSelect }) => (
  <div className="tool-group">
    <button
      className={active ? 'active' : ''}
      onClick={onSelect}
      title="Přihrávka"
      style={{ minWidth: 40, minHeight: 40 }}
    >
      {/* SVG ikona: tenká přerušovaná čára se šipkou */}
      <svg width="32" height="32">
        <defs>
          <marker id="pass-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="dimgray" />
          </marker>
        </defs>
        <line x1="6" y1="16" x2="26" y2="16" stroke="dimgray" strokeWidth="1.2" strokeDasharray="4 4" markerEnd="url(#pass-arrow)" />
      </svg>
    </button>
    <span style={{ fontSize: 12 }}>Přihrávka</span>
  </div>
);

export default PassToolbarSelector;


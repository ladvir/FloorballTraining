import React from 'react';

interface UndoRedoToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  undoDisabled: boolean;
  redoDisabled: boolean;
}

const UndoRedoToolbar: React.FC<UndoRedoToolbarProps> = ({ onUndo, onRedo, undoDisabled, redoDisabled }) => (
  <div className="tool-group">
    <div className="tool-item">
      <button onClick={onUndo} disabled={undoDisabled} title="Zpět (Undo)">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path d="M12 8 L4 16 L12 24" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M4 16 H20 Q28 16 28 24" stroke="#333" strokeWidth="2" fill="none" />
        </svg>
      </button>
      <span>Undo</span>
    </div>
    <div className="tool-item">
      <button onClick={onRedo} disabled={redoDisabled} title="Znovu (Redo)">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path d="M20 8 L28 16 L20 24" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M28 16 H12 Q4 16 4 24" stroke="#333" strokeWidth="2" fill="none" />
        </svg>
      </button>
      <span>Redo</span>
    </div>
  </div>
);

export default UndoRedoToolbar;


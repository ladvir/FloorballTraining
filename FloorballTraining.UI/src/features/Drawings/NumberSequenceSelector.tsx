import React, { useState } from 'react';

export type NumberSequenceTool = { toolId: 'number-seq'; category: 'number'; label: string; fontSize: number; color: string };

export const numberSequenceTools: NumberSequenceTool[] = [
  { toolId: 'number-seq', category: 'number', label: 'Number', fontSize: 18, color: '#000' }
];

interface Props {
  activeNumberTool: NumberSequenceTool | null;
  setActiveNumberTool: (tool: NumberSequenceTool | null) => void;
  setActivePlayerTool: (tool: any) => void;
  setActiveEquipmentTool: (tool: any) => void;
  setActiveMovementTool: (tool: any) => void;
  setActiveSelectionTool: (tool: any) => void;
  setActiveTextTool: (tool: any) => void;
  setSelectedItems: (value: any) => void;
  startingValue: number;
  setStartingValue: (n: number) => void;
}

const NumberSequenceSelector: React.FC<Props> = ({
  activeNumberTool,
  setActiveNumberTool,
  setActivePlayerTool,
  setActiveEquipmentTool,
  setActiveMovementTool,
  setActiveSelectionTool,
  setActiveTextTool,
  setSelectedItems,
  startingValue,
  setStartingValue
}) => {
  const [localValue, setLocalValue] = useState(startingValue);

  const handleSelect = (tool: NumberSequenceTool) => {
    if (activeNumberTool && activeNumberTool.toolId === tool.toolId) {
      setActiveNumberTool(null);
    } else {
      setActiveNumberTool(tool);
      setActivePlayerTool(null);
      setActiveEquipmentTool(null);
      setActiveMovementTool(null);
      setActiveSelectionTool(null);
      setActiveTextTool(null);
      setSelectedItems({ players: [], equipment: [], lines: [], freehandLines: [] , texts: [], numbers: [] });
    }
  };

  const applyStart = () => {
    setStartingValue(localValue);
  };
  const reset = () => {
    setLocalValue(1);
    setStartingValue(1);
  };

  return (
    <div className="tool-group">
      {numberSequenceTools.map(t => (
        <div key={t.toolId} className="tool-item">
          <button
            className={activeNumberTool?.toolId === t.toolId ? 'selected' : ''}
            onClick={() => handleSelect(t)}
            title="Number"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 24 24">
              <path d="M8.114 2.094a.75.75 0 01.386.656V9h1.252a.75.75 0 110 1.5H5.75a.75.75 0 010-1.5H7V4.103l-.853.533a.75.75 0 01-.795-1.272l2-1.25a.75.75 0 01.762-.02zm4.889 5.66a.75.75 0 01.75-.75h5.232a.75.75 0 01.53 1.28l-2.776 2.777c.55.097 1.057.253 1.492.483.905.477 1.504 1.284 1.504 2.418 0 .966-.471 1.75-1.172 2.27-.687.511-1.587.77-2.521.77-1.367 0-2.274-.528-2.667-.756a.75.75 0 01.755-1.297c.331.193.953.553 1.912.553.673 0 1.243-.188 1.627-.473.37-.275.566-.635.566-1.067 0-.5-.219-.836-.703-1.091-.538-.284-1.375-.443-2.471-.443a.75.75 0 01-.53-1.28l2.643-2.644h-3.421a.75.75 0 01-.75-.75zM7.88 15.215a1.4 1.4 0 00-1.446.83.75.75 0 01-1.37-.61 2.9 2.9 0 012.986-1.71 2.565 2.565 0 011.557.743c.434.446.685 1.058.685 1.778 0 1.641-1.254 2.437-2.12 2.986-.538.341-1.18.694-1.495 1.273H9.75a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75c0-1.799 1.337-2.63 2.243-3.21 1.032-.659 1.55-1.031 1.55-1.8 0-.355-.116-.584-.26-.732a1.068 1.068 0 00-.652-.298z"/>
            </svg>
          </button>
          <span>{t.label}</span>
        </div>
      ))}

      {activeNumberTool && (
      <div className="tool-item-inline">
        
               <label title={'Star from'} htmlFor={'StartingNumber'} style={{ fontSize: 12 }}>Start from</label>
        <input id={'StartingNumber'} title={'Starting number'}
          type="number"
          value={localValue}
          onChange={e => setLocalValue(Number(e.target.value))}
          style={{ width: 60, fontSize: 12, padding: '2px 4px 2px 6px', textAlign: 'center' }}        
        />
        <button type={'button'} onClick={applyStart} style={{width:'40px', padding: '2px 4px' }}>Set</button>
        <button type={'button'} onClick={reset} className={'inline'} style={{width:'40px', padding: '2px 4px' }}>Reset</button>        
      </div>)}
    </div> 
  );
};

export default NumberSequenceSelector;

import React, { useEffect, useRef, useState } from "react";

export interface FieldOption {
    id: string;
    label: string;
    svgMarkup: string;
    width: number;
    height: number;
}

interface FieldSelectorProps {
    options: FieldOption[];
    selectedId: string;
    onChange: (id: string) => void;
}

const FieldSelector: React.FC<FieldSelectorProps> = ({ options, selectedId, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);
    const selected = options.find(f => f.id === selectedId) || options[0];
    return (
        <div id="field-selector" className="tool-group" ref={ref}>
            <button
                type="button"
                className="custom-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                title="Select Field Background"
                onClick={() => setOpen(v => !v)}
            >
                <span
                    className="field-option-icon"
                    dangerouslySetInnerHTML={{
                        __html: selected.svgMarkup
                            ? `<svg width='40' height='30' viewBox='0 0 800 600'>${selected.svgMarkup}</svg>`
                            : ''
                    }}
                />
                {selected.label}
            </button>
            <span className="trigger-description">{selected.label}</span>
            {open && (
                <div className="custom-select-options" role="listbox">
                    <ul>
                        {options.map(opt => (
                            <li
                                key={opt.id}
                                role="option"
                                aria-selected={selectedId === opt.id}
                                onClick={() => { onChange(opt.id); setOpen(false); }}
                                style={{ cursor: 'pointer', padding: 4, background: selectedId === opt.id ? '#eee' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span
                                    className="field-option-icon"
                                    dangerouslySetInnerHTML={{
                                        __html: opt.svgMarkup
                                            ? `<svg width='40' height='30' viewBox='0 0 800 600'>${opt.svgMarkup}</svg>`
                                            : ''
                                    }}
                                />
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FieldSelector;


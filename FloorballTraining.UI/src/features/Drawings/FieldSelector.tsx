import React, { useEffect, useRef, useState } from "react";
import { getFieldOptionSvgMarkup } from './utils/fieldSvgUtils';

export const FieldOptions: FieldOption[] = [
    { id: 'Empty', label: 'Empty', svgMarkup: '', width: 800, height: 600 },
    { id: 'full-horizontal', label: 'Full horizontal', svgMarkup: `<g id="g3"><path id="path1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /><path id="path1-7" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /></g>`, width: 1175, height: 600 },
    { id: 'half-right', label: 'Half right', svgMarkup: '' , width: 800, height: 600 }
    ,{ id: 'half-left', label: 'Half left', svgMarkup: '' , width: 800, height: 600 }
    , { id: 'half-top', label: 'Half top', svgMarkup: '' , width: 800, height: 600 }
    , { id: 'half-bottom', label: 'Half bottom', svgMarkup: '<g id="g3"> <path id="path1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g>' , width: 800, height: 600 }
];

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

    // Log bounding box při změně pole
    React.useEffect(() => {
        if (!selected) return;
        
    }, [selectedId, selected.svgMarkup, selected.width, selected.height, selected.label]);

    return (
        <div id="field-selector" className="tool-group" ref={ref}>

            <div key={selected.id} className="tool-item">
            <button
                type="button"
                className="tool-item"
                aria-haspopup="listbox"
                aria-expanded={open}
                title="Select field"
                onClick={() => setOpen(v => !v)}
            >
                <span
                    dangerouslySetInnerHTML={{
                        __html: getFieldOptionSvgMarkup(selected, options)
                            ? `<svg width='64' height='64' viewBox='0 0 ${selected.width} ${selected.height}'>${getFieldOptionSvgMarkup(selected, options)}</svg>`
                            : ''
                    }}
                />
            </button>
            <span style={{ fontSize: 12 }}>{selected.label}</span>
            </div>
            {open && (
                <div className="custom-select-options" role="listbox">
                    <ul>
                        {options.map(opt => (
                            <li
                                key={opt.id}
                                role="option"
                                aria-selected={selectedId === opt.id}
                                onClick={() => { onChange(opt.id); setOpen(false); }}
                                style={{ cursor: 'pointer', padding: 4, background: selectedId === opt.id ? '#eee' : undefined, display: 'flex',  gap: 4 }}
                            >
                                <span
                                    className="field-option-icon"
                                    dangerouslySetInnerHTML={{
                                        __html: getFieldOptionSvgMarkup(opt, options)
                                            ? `<svg width='32' height='32' viewBox='0 0 ${opt.width} ${opt.height}'>${getFieldOptionSvgMarkup(opt, options)}</svg>`
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

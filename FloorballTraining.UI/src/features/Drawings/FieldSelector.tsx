import React from "react";
import { getFieldOptionSvgMarkup } from './utils/fieldSvgUtils';

export const DEFAULT_WIDTH: number = 800;
export const DEFAULT_HEIGHT: number = 600;

export const FieldOptions: FieldOption[] = [
    { id: 'Empty', label: 'Empty', svgMarkup: '', width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    { id: 'full-horizontal', label: 'Full horizontal', svgMarkup: `<g id="g3"><path id="path1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /><path id="path1-7" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /></g>`, width: 1175, height: 600 },
    { id: 'half-right', label: 'Half right', svgMarkup: '' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    ,{ id: 'half-left', label: 'Half left', svgMarkup: '' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    , { id: 'half-top', label: 'Half top', svgMarkup: '' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    , { id: 'half-bottom', label: 'Half bottom', svgMarkup: '<g id="g3" transform="translate(100, 0)"> <path id="path1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect id="rect5886-8" style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect id="rect5910" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path id="path1176-77" style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" /> <path id="path1176-77-8" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" /> </g> <g id="g6280" style="display:inline;stroke:#000000;" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path id="path1176-77-7" style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" /> <path id="path1176-77-7-1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" /> </g> </g>' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }    
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
    return (
        <div className="tool-group">
            {options.map(opt => (
                <div key={opt.id} className="tool-item">
                    <button
                        className={selectedId === opt.id ? 'active' : ''}
                        onClick={() => onChange(opt.id)}
                        title={opt.label}                        
                    >
                        <span
                            className="field-option-icon"                            
                            dangerouslySetInnerHTML={{
                                __html: getFieldOptionSvgMarkup(opt, options)
                                    ? `<svg width='32' height='32' viewBox='0 0 ${opt.width} ${opt.height}'>${getFieldOptionSvgMarkup(opt, options)}</svg>`
                                    : `<svg width='32' height='32' viewBox='0 0 ${opt.width} ${opt.height}'/>`
                            }}
                        />
                    </button>
                    <span>{opt.label}</span>
                </div>
            ))}
        </div>
    );
};

export default FieldSelector;

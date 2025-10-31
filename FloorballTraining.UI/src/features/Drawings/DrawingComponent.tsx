import React, { useRef, useState } from "react";
import './styles.css';
import FieldSelector, {type FieldOption} from './FieldSelector';
import { getFieldOptionSvgMarkup } from './utils/fieldSvgUtils';


// --- Možnosti hřiště (fieldOptions) převzato z původního config.js ---
const fieldOptions: FieldOption[] = [
    { id: 'Empty', label: 'Empty', svgMarkup: '', width: 800, height: 600 },
    { id: 'full-horizontal', label: 'Full horizontal', svgMarkup: `<g id="g3"><path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /><path id="path1-7" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /></g>`, width: 1175, height: 600 },
     { id: 'half-right', label: 'Half right', svgMarkup: '' , width: 800, height: 600 }
    ,{ id: 'half-left', label: 'Half left', svgMarkup: '' , width: 800, height: 600 }
    , { id: 'half-top', label: 'Half top', svgMarkup: '' , width: 800, height: 600 }
    , { id: 'half-bottom', label: 'Half bottom', svgMarkup: '<g id="g3"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g>' , width: 800, height: 600 }
//<g id="g3" transform="rotate(-90,289.70444,287.8732)"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> <g id="g1" transform="translate(5.8865683,1.5875)" /> <g id="g2" transform="translate(5.8865684,1.5875)" /> </g>
];

const DrawingComponent = () => {
    const [activeTool, setActiveTool] = useState<string>("select");
    const svgCanvasRef = useRef<SVGSVGElement | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState('Empty');
    const selectedField = fieldOptions.find(f => f.id === selectedFieldId) || fieldOptions[0];
    const [drawing, setDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
    type Line = { x1: number, y1: number, x2: number, y2: number, color: string };
    const [lines, setLines] = useState<Line[]>([]);
    const [previewLine, setPreviewLine] = useState<Line | null>(null);

    const color = "#000000";

    const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (activeTool !== "movement") return;
        const rect = svgCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDrawing(true);
        setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!drawing || !startPoint || activeTool !== "movement") return;
        const rect = svgCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x2 = e.clientX - rect.left;
        const y2 = e.clientY - rect.top;
        setPreviewLine({ x1: startPoint.x, y1: startPoint.y, x2, y2, color });
    };
    const handleCanvasMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!drawing || !startPoint || activeTool !== "movement") return;
        setDrawing(false);
        const rect = svgCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x2 = e.clientX - rect.left;
        const y2 = e.clientY - rect.top;
        setLines([...lines, { x1: startPoint.x, y1: startPoint.y, x2, y2, color }]);
        setStartPoint(null);
        setPreviewLine(null);
    };

    return (
        <div>
            {/* Toolbar */}
            <div id="drawing-toolbar" className="controls toolbar">
                <FieldSelector options={fieldOptions} selectedId={selectedFieldId} onChange={setSelectedFieldId} />
                {/* ...další toolbary... */}
            </div>
            {/* Main Content Area */}
            <div id="container">
                <div id="drawing-area">
                    <svg
                        id="svg-canvas"
                        ref={svgCanvasRef}
                       
                        viewBox={`-10 -10 ${selectedField.width} ${selectedField.height}`}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                    >
                        <g id="field-layer">
                            {selectedField && (
                                <g dangerouslySetInnerHTML={{ __html: getFieldOptionSvgMarkup(selectedField, fieldOptions) }} />
                            )}
                        </g>
                        <g id="content-layer">
                            {lines.map((line, idx) => (
                                <line key={idx} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.color} strokeWidth={3} />
                            ))}
                            {previewLine && (
                                <line x1={previewLine.x1} y1={previewLine.y1} x2={previewLine.x2} y2={previewLine.y2} stroke={previewLine.color} strokeWidth={2} strokeDasharray="6 4" />
                            )}
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default DrawingComponent;

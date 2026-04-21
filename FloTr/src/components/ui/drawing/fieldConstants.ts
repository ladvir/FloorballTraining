export const DEFAULT_WIDTH: number = 800;
export const DEFAULT_HEIGHT: number = 600;

export interface FieldOption {
    id: string;
    label: string;
    svgMarkup: string;
    width: number;
    height: number;
}

export const FieldOptions: FieldOption[] = [
    { id: 'Blank', label: 'Prázdné', svgMarkup: '', width: 970, height: 600 },
      { id: 'full-horizontal', label: 'Obrys', svgMarkup: `<g id="g3"><path id="path1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /><path id="path1-7" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /></g>`, width: 1160, height: 600 },
    { id: 'full', label: 'Celé', svgMarkup: `<g
        id="g5"
        transform="translate(575,-84)">
        <g
            id="field-layer"
            pointer-events="none">
            <g
                id="g4">
                <g
                    transform="rotate(90)"
                    id="g2">
                    <g
                        id="g3"
                        transform="translate(100)">
                        <path
                            id="path2"
                            style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none"
                            d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" />
                        <g
                            id="g9650"
                            style="display:inline"
                            transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)">
                            <rect
                                id="rect5886-8"
                                style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none"
                                height="50"
                                x="34.66135"
                                y="80.121231"
                                rx="0"
                                ry="0"
                                width="40" />
                            <rect
                                id="rect5910"
                                style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none"
                                width="10"
                                height="25"
                                x="40.5"
                                y="92.520615"
                                transform="translate(1.6148871e-6)" />
                        </g>
                        <g
                            id="g6200"
                            style="display:inline;stroke:#000000"
                            transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)">
                            <path
                                id="path1176-77"
                                style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none"
                                d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" />
                            <path
                                id="path1176-77-8"
                                style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none"
                                d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" />
                        </g>
                        <g
                            id="g6280"
                            style="display:inline;stroke:#000000"
                            transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)">
                            <path
                                id="path1176-77-7"
                                style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none"
                                d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" />
                            <path
                                id="path1176-77-7-1"
                                style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none"
                                d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" />
                        </g>
                    </g>
                </g>
            </g>
        </g>
        <g
            id="content-layer" />
        <g
            id="g4-4"
            transform="matrix(-1,0,0,1,-0.898917,0.231047)">
            <g
                transform="rotate(90)"
                id="g2-8">
                <g
                    id="g3-8"
                    transform="translate(100)">
                    <path
                        id="path2-2"
                        style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none"
                        d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" />
                    <g
                        id="g9650-4"
                        style="display:inline"
                        transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)">
                        <rect
                            id="rect5886-8-5"
                            style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none"
                            height="50"
                            x="34.66135"
                            y="80.121231"
                            rx="0"
                            ry="0"
                            width="40" />
                        <rect
                            id="rect5910-5"
                            style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none"
                            width="10"
                            height="25"
                            x="40.5"
                            y="92.520615"
                            transform="translate(1.6148871e-6)" />
                    </g>
                    <g
                        id="g6200-1"
                        style="display:inline;stroke:#000000"
                        transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)">
                        <path
                            id="path1176-77-71"
                            style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none"
                            d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" />
                        <path
                            id="path1176-77-8-1"
                            style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none"
                            d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" />
                    </g>
                    <g
                        id="g6280-5"
                        style="display:inline;stroke:#000000"
                        transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)">
                        <path
                            id="path1176-77-7-2"
                            style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none"
                            d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" />
                        <path
                            id="path1176-77-7-1-7"
                            style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none"
                            d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" />
                    </g>
                </g>
            </g>
        </g>
        <g
            id="content-layer-6"
            transform="matrix(-1,0,0,1,5.101083,0.23104693)" />
        <path
            style="opacity:0.98;fill:#000000;stroke:#000000;stroke-width:1.37953;stroke-dasharray:none;stroke-opacity:1"
            d="M 0.108303,99.74729 V 666.5343 l 1.444044,0.72202"
            id="path4" />
    </g>`, width: 1150, height: 600 },


    { id: 'half-right', label: 'Půlka pravá', svgMarkup: '' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    ,{ id: 'half-left', label: 'Půlka levá', svgMarkup: '' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    , { id: 'half-top', label: 'Půlka horní', svgMarkup: '' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    , { id: 'half-bottom', label: 'Půlka dolní', svgMarkup: '<g id="g3" transform="translate(100, 0)"> <path id="path1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:6;stroke-linejoin:round;stroke-dasharray:none;" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect id="rect5886-8" style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect id="rect5910" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path id="path1176-77" style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" /> <path id="path1176-77-8" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" /> </g> <g id="g6280" style="display:inline;stroke:#000000;" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path id="path1176-77-7" style="fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" /> <path id="path1176-77-7-1" style="display:inline;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linecap:square;stroke-dasharray:none;" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" /> </g> </g>' , width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
];

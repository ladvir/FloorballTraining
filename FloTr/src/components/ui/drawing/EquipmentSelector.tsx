/* eslint-disable react-refresh/only-export-components */
import React from "react";
import {selectionTools, type SelectionTool} from "./SelectionSelector.tsx";
export type EquipmentTool = {
    category: 'equipment';
    toolId: string;
    label: string;
    type: 'equipment';
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    width?: number;
    height?: number;
    isSet?: boolean;
    length?: number;
    /** If true, drawn by dragging a line (start→end) */
    isLine?: boolean;
    /** Spacing between repeated icons along line */
    spacing?: number;
};

type EquipmentSelectorProps = {
    equipmentTools: EquipmentTool[];
    activeEquipmentTool: EquipmentTool | null;
    setActiveEquipmentTool: (tool: EquipmentTool | null) => void;
    setActivePlayerTool: (tool: null) => void;
    setActiveMovementTool: (tool: null) => void;
    setActiveSelectionTool: (tool: SelectionTool | null) => void;
    setActiveTextTool: (tool: null) => void;
    setActiveNumberTool: (tool: null) => void;
    setActiveShapeTool: (tool: null) => void;
    setSelectedItems: (items: {players: number[], equipment: number[], lines: number[], freehandLines: number[], texts: number[], numbers: number[]}) => void;
};


export const EQUIPMENT_BALL_RADIUS = 3.8;
const EQUIPMENT_GATE_WIDTH = 22;
const EQUIPMENT_GATE_HEIGHT = 54;
export const EQUIPMENT_CONE_RADIUS = 8;
export const EQUIPMENT_CONE_HEIGHT = 20;

// Helper funkce pro získání škálovaných hodnot
export const getScaledBallRadius = (scaleFactor: number = 1) => EQUIPMENT_BALL_RADIUS * scaleFactor;
export const getScaledGateWidth = (scaleFactor: number = 1) => EQUIPMENT_GATE_WIDTH * scaleFactor;
export const getScaledGateHeight = (scaleFactor: number = 1) => EQUIPMENT_GATE_HEIGHT * scaleFactor;
export const getScaledConeRadius = (scaleFactor: number = 1) => EQUIPMENT_CONE_RADIUS * scaleFactor;
export const getScaledConeHeight = (scaleFactor: number = 1) => EQUIPMENT_CONE_HEIGHT * scaleFactor;

export const equipmentTools: EquipmentTool[] = [
    {
        category: 'equipment',
        toolId: 'ball',
        label: 'Míček',
        type: 'equipment',
        radius: EQUIPMENT_BALL_RADIUS,
        fill: 'orange',
        stroke: 'black'
    },
    {
        category: 'equipment',
        toolId: 'gate',
        label: 'Branka',
        type: 'equipment',
        width: EQUIPMENT_GATE_WIDTH,
        height: EQUIPMENT_GATE_HEIGHT,
        fill: 'grey',
        stroke: 'black'
    },    
    {
        category: 'equipment',
        toolId: 'low-cone',
        label: 'Klobouček',
        type: 'equipment',
        fill: '#ff6600',
        stroke: '#cc3300'
    },
    {
        category: 'equipment',
        toolId: 'slalom-pole',
        label: 'Kužel',
        type: 'equipment',
        fill: '',
        stroke: ''
    },
    {
        category: 'equipment',
        toolId: 'ladder',
        label: 'Žebřík',
        type: 'equipment',
        isLine: true,
        spacing: 0,
        fill: '#000',
        stroke: '#000'
    },
];

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ equipmentTools, activeEquipmentTool, setActiveEquipmentTool, setActivePlayerTool, setActiveMovementTool, setActiveSelectionTool, setSelectedItems, setActiveTextTool, setActiveNumberTool, setActiveShapeTool }) => (
    <div className="tool-group-inline">
        {equipmentTools.map(tool => (
            <div key={tool.toolId} className="tool-item">
                <button 
                    className={activeEquipmentTool?.toolId === tool.toolId ? 'selected' : ''}
                    onClick={() => {
                        if (activeEquipmentTool?.toolId === tool.toolId) {
                            setActiveEquipmentTool(null);
                            setActiveSelectionTool(selectionTools[0]);
                        } else {
                            setActiveEquipmentTool(tool);
                            setActiveSelectionTool(null);
                        }
                        setActivePlayerTool(null);
                        setActiveMovementTool(null);
                        setActiveTextTool(null);
                        setActiveNumberTool(null);
                        setActiveShapeTool(null);
                        setSelectedItems({players: [], equipment: [], lines: [], freehandLines: [], texts: [], numbers: []});
                    }}
                    
                    title={tool.label}
                >
                    {tool.toolId === 'ball' ||  false ? (
                        <svg width={32} height={32}>
                            <path d="M 16.020005,26.591533 C 15.725572,26.562518 14.907253,26.42175 14.619426,26.350607 11.339227,25.539809 8.6969398,23.054494 7.6892804,19.832162 7.3579546,18.772635 7.2464448,17.910315 7.2770082,16.644002 7.3091711,15.311358 7.5374851,14.268954 8.0600606,13.06884 8.5662092,11.90645 9.1714533,11.0293 10.120603,10.0826 c 1.42133,-1.4176623 3.134538,-2.3154152 5.099239,-2.6720967 1.309587,-0.2377492 2.881435,-0.1758598 4.182744,0.1646897 3.424366,0.8961497 6.126626,3.655285 6.950647,7.096942 0.203358,0.849354 0.241946,1.214871 0.241255,2.285154 -5.57e-4,0.888557 -0.01102,1.072678 -0.0847,1.492723 -0.298304,1.700631 -0.864006,3.015579 -1.890754,4.394978 -0.476528,0.640197 -1.477811,1.592296 -2.185852,2.07848 -0.468862,0.321951 -1.296169,0.770334 -1.807379,0.979562 -0.617288,0.252644 -1.380533,0.468126 -2.136356,0.603144 -0.360067,0.06432 -0.617008,0.08095 -1.382151,0.08945 -0.516924,0.0058 -1.006205,0.0039 -1.087291,-0.0041 z m 2.027154,-0.681785 c 0.697694,-0.08731 1.492857,-0.286563 2.129377,-0.533585 0.363911,-0.141227 1.128016,-0.502865 1.279927,-0.60577 0.05068,-0.03433 0.208244,-0.134672 0.350145,-0.222981 0.26462,-0.164681 0.285175,-0.179057 0.663432,-0.46397 0.460256,-0.346678 1.243011,-1.122674 1.556294,-1.542856 0.0451,-0.06049 0.145089,-0.19291 0.222197,-0.294268 0.749523,-0.985241 1.331668,-2.364096 1.595002,-3.777878 0.09917,-0.532444 0.140731,-1.850568 0.07741,-2.455191 C 25.805556,14.91159 25.523555,13.950252 25.013974,12.921411 23.735638,10.340463 21.331022,8.5501518 18.45259,8.0362559 17.834886,7.9259754 16.614595,7.8902942 16.431537,7.9771576 c -0.179418,0.08514 -1.457407,0.2655178 -1.535532,0.2167279 -0.08832,-0.055153 -0.745019,0.12897 -1.346697,0.3775867 -0.762951,0.3152543 -1.383443,0.6590301 -1.915327,1.0611598 -0.101358,0.076631 -0.233778,0.1762295 -0.294268,0.2213302 -0.441734,0.3293528 -1.3458284,1.2503688 -1.6056373,1.6356898 -0.029442,0.04367 -0.1320538,0.189213 -0.2280234,0.323434 -0.9076267,1.269393 -1.4711523,2.9017 -1.5770869,4.568187 -0.1444355,2.272168 0.5770843,4.522229 2.0107344,6.270473 1.3728492,1.674103 3.2518442,2.779624 5.4168732,3.187062 0.746651,0.140512 1.89307,0.170737 2.690586,0.07093 z M 13.45004,23.93973 c -0.811847,-0.1968 -1.495855,-0.932014 -1.354723,-1.456139 0.157291,-0.584133 1.294341,-0.440779 1.969242,0.248272 0.363268,0.370885 0.475001,0.81963 0.259964,1.044081 -0.113898,0.118884 -0.375995,0.222751 -0.550168,0.218027 -0.06227,-0.0017 -0.208213,-0.0261 -0.324315,-0.05424 z m 6.115087,-0.383257 c -0.162858,-0.05256 -0.359903,-0.2209 -0.416159,-0.355539 -0.07376,-0.176541 -0.0634,-0.422036 0.02818,-0.667589 0.09958,-0.266997 0.463129,-0.640718 0.790386,-0.812503 0.439656,-0.230784 0.967953,-0.286508 1.285893,-0.135636 0.443957,0.210671 0.474109,0.801853 0.06628,1.299554 -0.166149,0.202763 -0.516586,0.464494 -0.784681,0.586055 -0.155336,0.07044 -0.280245,0.0951 -0.534431,0.105529 -0.182445,0.0075 -0.378406,-0.0014 -0.435471,-0.01987 z M 9.4385857,18.212292 C 9.2857256,18.130478 9.1479799,17.94317 9.0306515,17.657579 c -0.07117,-0.173241 -0.083305,-0.2697 -0.083447,-0.663433 -1.396e-4,-0.382964 0.013439,-0.49758 0.080439,-0.679155 0.203219,-0.550714 0.5273993,-0.74616 0.8578227,-0.517177 0.4770368,0.330587 0.5947368,1.568618 0.2042158,2.148055 -0.1902261,0.282249 -0.434655,0.382268 -0.6510963,0.266423 z m 6.5814193,-0.554084 c -0.486512,-0.106563 -0.816224,-0.325365 -1.090069,-0.723383 -0.267726,-0.389127 -0.336195,-0.967404 -0.169059,-1.427856 0.467036,-1.28667 2.168528,-1.500375 2.920911,-0.366862 0.394296,0.594031 0.347191,1.378296 -0.11719,1.951131 -0.333026,0.410801 -1.052259,0.674809 -1.544593,0.56697 z m 7.445183,-0.991023 c -0.34117,-0.155837 -0.631195,-0.61902 -0.7388,-1.179898 -0.05803,-0.302461 -0.06054,-0.381073 -0.02008,-0.626574 0.160055,-0.970876 0.950901,-1.055754 1.474858,-0.158289 0.325259,0.557123 0.33936,1.321592 0.0326,1.76745 -0.178982,0.260142 -0.452944,0.332352 -0.748585,0.197311 z M 11.283836,11.502402 c -0.103088,-0.103088 -0.09962,-0.372392 0.0071,-0.548509 0.320408,-0.528941 0.96503,-0.9891396 1.485451,-1.0604714 0.209274,-0.028687 0.411164,0.06575 0.442146,0.2068084 0.06787,0.309006 -0.260459,0.797905 -0.773654,1.152014 -0.428868,0.295921 -0.993568,0.417596 -1.161006,0.250158 z m 7.51152,-1.109741 c -0.710473,-0.07266 -1.301058,-0.4855246 -1.301058,-0.9095459 0,-0.1400597 0.01753,-0.1780064 0.122806,-0.2658975 0.258409,-0.2157294 0.734855,-0.2732082 1.230099,-0.148401 0.64735,0.1631407 1.098109,0.5153111 1.098109,0.8579359 0,0.1156515 -0.02509,0.1706725 -0.122012,0.2675975 -0.183964,0.183963 -0.524967,0.249749 -1.027944,0.198311 z"/>
                        </svg>
                    ) : tool.toolId === 'gate' ? (
                        <svg width={32} height={32}>
                            <rect width="32" height="32" fill="#f8f9fa" rx="2" />

                            {/* Branková čára */}
                            <line x1="6.4" y1="9.6" x2="25.6" y2="9.6" stroke="#ccc" strokeWidth="0.5" />

                            <g fill="none" stroke="#e11d48" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                {/* Hlavní konstrukce tyčí */}
                                <path d="M6.4 9.6 L6.4 16.5 C6.4 18.5 8.4 20.5 10.4 20.5 L21.6 20.5 C23.6 20.5 25.6 18.5 25.6 16.5 L25.6 9.6" />

                                {/* Síť (jemné linky) */}
                                <g stroke="#e11d48" strokeOpacity="0.4" strokeWidth="0.5">
                                    <path d="M6.4 13.5 H25.6" />
                                    <path d="M6.4 17.0 H25.6" />
                                    <path d="M11 20.5 V9.6 M16 20.5 V9.6 M21 20.5 V9.6" />
                                </g>
                            </g>
                            
                        </svg>
                    ) : tool.toolId === 'low-cone' ? (
                        <svg width={32} height={32}>
                            <g>
                                <path
                                    fill={tool.fill}
                                    stroke={tool.stroke}
                                    strokeWidth={tool.strokeWidth}
                                    d="M25.0329,18.0406c0.0011-0.0208,0.0091-0.0401,0.0091-0.0611c0-0.017-0.008-0.0313-0.0096-0.0478   c-0.0031-0.033-0.0096-0.064-0.0194-0.0962c-0.0104-0.0338-0.0231-0.0646-0.04-0.095c-0.0076-0.0137-0.0089-0.0291-0.0178-0.0423   l-4.1357-6.0697C20.5443,10.414,17.7112,10.0801,16,10.0801c-1.7117,0-4.5448,0.3339-4.8199,1.5485l-4.1347,6.0697   c-0.009,0.0132-0.0104,0.0287-0.018,0.0425c-0.0167,0.03-0.0294,0.0605-0.0397,0.0939c-0.0101,0.0328-0.0167,0.0645-0.0198,0.0982   c-0.0016,0.0161-0.0094,0.0301-0.0094,0.0466c0,0.0206,0.0079,0.0395,0.0089,0.0598c0.0022,0.0182,0.0037,0.0356,0.0079,0.0535   c0.178,1.8553,4.6221,2.8271,9.0247,2.8271c4.4031,0,8.8483-0.972,9.0253-2.8278C25.0293,18.0749,25.0307,18.0582,25.0329,18.0406z    M19.8193,11.8223c-0.252,0.252-1.5254,0.7422-3.8193,0.7422c-2.4458,0-3.7319-0.5566-3.8564-0.6953   c0.125-0.2324,1.4116-0.7891,3.8564-0.7891C18.293,11.0801,19.5674,11.5703,19.8193,11.8223z"
                                />
                            </g>
                        </svg>
                    ) : tool.toolId === 'slalom-pole' ? (
                        <svg width={32} height={32}>

                            <g>
                                <path fill="#D68847" d="M25.38 32H6.62c-.94 0-1.66-.72-1.66-1.66s.72-1.66 1.66-1.66h18.76c.94 0 1.66.72 1.66 1.66S26.32 32 25.38 32"/>

                                <g fill="#ECBA16">
                                    <polygon points="24.83 28.69 20.69 11.03 16 11.03 11.26 11.03 7.17 28.69"/>
                                    <path d="M19.42 5.52l-1.1-4.69c-.11-.5-.55-.83-1.05-.83h-2.65c-.5 0-.94.33-1.05.83l-1.1 4.69H16h3.42z"/>
                                </g>

                                <g fill="#F7F6DD">
                                    <polygon points="20.69 11.03 19.42 5.52 16 5.52 12.47 5.52 11.26 11.03 16 11.03"/>
                                    <path d="M16 17.1h-6.18l-1.27 5.52H16h7.45l-1.27-5.52H16z"/>
                                </g>
                            </g>    
                        </svg>
                    ) : tool.toolId === 'ladder' ? (
                        <svg width={32} height={32}>
                            <path
                                fill={tool.fill}
                                stroke={tool.stroke}
                                strokeWidth={tool.strokeWidth}
                                d="m25.303 4.3926-0.32715-0.29492c-0.09863-0.13086-0.29492-0.13086-0.42578 0l-20.451 20.451c-0.13086 0.13086-0.13086 0.32715 0 0.42578l0.29492 0.32715c0.13086 0.13086 0.32715 0.13086 0.458 0l2.6505-2.6505 2.88 2.8468-2.6835 2.6505c-0.09863 0.13086-0.09863 0.32715 0 0.458l0.32715 0.29492c0.09863 0.13086 0.29492 0.13086 0.42578 0l20.451-20.451c0.13086-0.13086 0.13086-0.32715 0-0.42578l-0.29492-0.32715c-0.13086-0.09863-0.32715-0.09863-0.458 0l-2.6505 2.6835-2.8468-2.88 2.6505-2.6505c0.13086-0.13086 0.13086-0.32715 0-0.458zm-17.049 17.507 1.6358-1.669 2.88 2.88-1.669 1.6358zm2.3887-2.4219 1.669-1.6358 2.8468 2.88-1.6358 1.6358zm2.4219-2.3887 1.6358-1.6358 2.8468 2.8468-1.6358 1.669zm2.3887-2.3887 1.6358-1.6358 2.88 2.8468-1.669 1.6358zm2.3887-2.3887 1.6358-1.669 2.88 2.88-1.669 1.6358zm2.3887-2.4219 1.669-1.6358 2.8468 2.8468-1.6358 1.669z"
                            />
                        </svg>
                    ) : null}
                </button>
                <span>{tool.label}</span>
            </div>
        ))}
    </div>
);

export default EquipmentSelector;

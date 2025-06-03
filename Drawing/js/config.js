//***** js/config.js ******
// js/config.js

export const SVG_NS = "http://www.w3.org/2000/svg";

// Element Sizing & Layout
export const MIN_ELEMENT_WIDTH = 20;
export const MIN_ELEMENT_HEIGHT = 20;
export const MOVE_HANDLE_HEIGHT = 4; // Deprecated?
export const MOVE_HANDLE_OFFSET = 2; // Deprecated?
export const MOVE_HANDLE_WIDTH_PERCENT = 0.2; // Deprecated?
export const PLACEMENT_GAP = 5;
export const TITLE_PADDING = 5;

// Player Specifics
export const PLAYER_RADIUS = 15;
export const PLAYER_DIAMETER = PLAYER_RADIUS * 2;
export const DEFAULT_PLAYER_TOOL_ID = 'coach'; // Changed default to coach

// Equipment Specifics
export const BALL_RADIUS = 6;
export const GATE_WIDTH = 40;
export const GATE_HEIGHT = 100;
export const CONE_RADIUS = 10;
export const CONE_HEIGHT = 25;
export const BARRIER_STROKE_WIDTH = 8;
export const BARRIER_CORNER_RADIUS = 50;

// --- Arrow / Line Specifics ---
// Unified values
export const ARROW_STROKE_WIDTH_UNIFIED = 1.2; // *** NEW: Unified thickness ***
export const ARROW_MARKER_SIZE_UNIFIED = 6;   // *** NEW: Unified marker size ***
export const SHOT_ARROW_SIZE = 8;
export const MARKER_ARROW_UNIFIED_ID = "arrowhead-standard"; // *** NEW: Unified marker ID ***
export const MARKER_SHOT_ARROW_ID = "shot-arrow";

// Specific styles
export const ARROW_DASH_RUN = "5,3"; // Dash style only for runs
export const FREEHAND_SIMPLIFICATION_TOLERANCE = 1.5;
export const ARROW_COLOR = 'dimgray'; // Default color for arrows

// Basic line widths (separate from arrows)
export const LINE_STROKE_WIDTH_SIMPLE = 1.5;
export const LINE_STROKE_WIDTH_THIN = 1;
export const LINE_STROKE_WIDTH_THICK = 3;

// Number / Text Specifics
export const NUMBER_FONT_SIZE = 20;
export const TEXT_FONT_SIZE = 16;
export const NUMBER_TOOL_ID = 'number-tool'; // Define ID for the generic number tool

// Shape Specifics
export const DEFAULT_SHAPE_SIZE = 40;
export const DEFAULT_SHAPE_STROKE_WIDTH = 2;
export const DEFAULT_SHAPE_FILL_COLOR = '#cccccc';
export const DEFAULT_STROKE_COLOR = '#000000';

// Sidebar Drag Preview Defaults
export const DEFAULT_GHOST_WIDTH = 120;
export const DEFAULT_GHOST_HEIGHT = 80;

// Interaction Parameters
export const ROTATION_STEP = 45;
export const SELECTION_RECT_MIN_SIZE = 5;

// Resize Handle Parameters (NEW)
export const RESIZE_HANDLE_SIZE = 8;
export const RESIZE_HANDLE_COLOR = 'white';
export const RESIZE_HANDLE_STROKE = 'dodgerblue';
export const RESIZE_HANDLE_STROKE_WIDTH = 1.5;
export const RESIZE_HANDLE_OFFSET = RESIZE_HANDLE_SIZE / 2; // Offset from the element's edge

// Default Resize Limits for Activities/Library SVGs (NEW)
export const DEFAULT_ACTIVITY_MIN_WIDTH = 50;
export const DEFAULT_ACTIVITY_MIN_HEIGHT = 50;
export const DEFAULT_ACTIVITY_MAX_WIDTH = 800;
export const DEFAULT_ACTIVITY_MAX_HEIGHT = 600;


// Default Sidebar Data
export const DEFAULT_ACTIVITIES = [
    {
        id: 1, name: "Activity A", title: "Warm-up Drill", description: "Basic passing sequence.", svg: "<circle cx='20' cy='20' r='18' fill='blue' class='activity-svg' />",
        minWidth: 50, minHeight: 50, maxWidth: 400, maxHeight: 300 // Added resize limits
    },
    {
        id: 2, name: "Activity B", title: "Shooting Practice", description: "Shoot from various angles.", svg: "<rect x='5' y='5' width='30' height='30' fill='red' class='activity-svg' />",
        minWidth: 50, minHeight: 50, maxWidth: 400, maxHeight: 300 // Added resize limits
    },
    {
        id: 3, name: "Activity C", title: "Cone Weave", description: "Dribbling exercise.", svg: "<svg class='activity-svg' viewBox='0 0 40 40' width='40' height='40'><path fill='#555' d='M20 1.6c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24S23.46 1.6 20 1.6zm-7.68 14.24c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm-23.04 14.4c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24z'/></svg>",
        minWidth: 50, minHeight: 50, maxWidth: 400, maxHeight: 300 // Added resize limits
    }
];

// --- SVG Marker Definitions (Unified) ---
// *** REMOVED specific IDs like MARKER_ARROW_PASS_ID, etc. ***
export const MARKER_DEFINITIONS = `
    <marker id="${MARKER_ARROW_UNIFIED_ID}"
            viewBox="0 0 10 10" refX="8" refY="5"
            markerUnits="strokeWidth"
            markerWidth="${ARROW_MARKER_SIZE_UNIFIED}" markerHeight="${ARROW_MARKER_SIZE_UNIFIED}"
            orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="${ARROW_COLOR}" />
    </marker>
     <marker id="${MARKER_SHOT_ARROW_ID}"
            viewBox="0 0 10 10" refX="0" refY="5"
             markerUnits="strokeWidth"
             markerWidth="${SHOT_ARROW_SIZE}" markerHeight="${SHOT_ARROW_SIZE}"
             orient="auto-start-reverse">
         <path d="M 0 0 L 10 5 L 0 10 z" fill="${ARROW_COLOR}" />
     </marker>
      <pattern id="diamondNet" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0,5 L5,0 L10,5 L5,10 Z" fill="none" stroke="grey" stroke-width="1.0"/>
        </pattern>
 `; // *** Only one standard marker definition now ***



// --- Field Background Options ---
// To add a new field, add an object to this array.
// The svgMarkup should ideally be a <g> element with a viewBox attribute.
// Example: { id: 'my-new-field', label: 'My New Field', svgMarkup: '<g id="my-new-field-group" viewBox="0 0 500 300" ...>...</g>' }
// If your SVG markup is a full <svg> element, the code will try to use its viewBox.
export const fieldOptions = [
    { id: 'Empty', label: 'Empty', svgMarkup: '' }
    // Add your new field objects here:    
    , { id: 'full-vertical', label: 'Full vertical', svgMarkup: '<g id="g4" transform="rotate(-90,580.79567,578.76941)"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /> <path id="path1-7" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="M 579.663,571.478 580,290 579.663,4.03634" id="path3" transform="translate(0,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(-2.8381759,0,0,2.8381759,1185.011,-17.134469)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-width:0.183923;stroke-dasharray:none;stroke-opacity:1" transform="matrix(-1.4385549,0,0,1.438555,1128.7301,62.160761)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-width:0.186446;stroke-dasharray:none;stroke-opacity:1" transform="matrix(-1.419088,0,0,1.419088,1134.5163,212.84276)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:2.83818;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8-1" height="141.9088" x="72.494118" y="208.65559" rx="0" ry="0" width="113.52704" transform="translate(0,1.5875)" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:2.83818;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910-4" width="28.38176" height="70.954399" x="89.065239" y="243.84723" transform="translate(0,1.5875)" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77-3" transform="matrix(1.4385549,0,0,1.438555,30.399979,62.140179)" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8-2" transform="matrix(1.4385549,0,0,1.438555,30.399979,62.140179)" /> <g id="g6200-2" style="display:inline;stroke:#000000;stroke-width:0.183923;stroke-dasharray:none;stroke-opacity:1" transform="matrix(1.4385549,0,0,1.438555,30.399979,62.140179)" /> <g id="g6280-2" style="display:inline;stroke:#000000;stroke-width:0.186446;stroke-dasharray:none;stroke-opacity:1" transform="matrix(1.419088,0,0,1.419088,24.61383,212.82218)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7-16" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1-8" /> </g> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 575.23747,290 10.23636,-0.0914" id="path21" transform="translate(0,1.5875)" /> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 574.17433,480.24261 10.23634,-0.0914" id="path21-8" transform="translate(0,1.5875)" /> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 574.38068,90.018414 10.23634,-0.0914" id="path21-2" transform="translate(0,1.5875)" /> <g id="g21" transform="translate(0,1.5875)" /> <g id="g3" /> </g>' }
    , { id: 'full-horizontal', label: 'Full horizontal', svgMarkup: '<g id="g3"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.15141,571.69097 h 471.58219 c 55.0322,0 99.336,-44.30379 99.336,-99.33599 V 103.39265 c 0,-55.032183 -44.3038,-99.3374327 -99.336,-99.3374327 H 579.15141" /> <path id="path1-7" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 579.97872,571.67038 h -471.5822 c -55.03218,0 -99.33596,-44.30378 -99.33596,-99.33599 V 103.37206 c 0,-55.03218 44.30378,-99.33743 99.33596,-99.33743 h 471.5822" /> <g id="g21" transform="translate(0,1.5875)"> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="M 579.663,571.478 580,290 579.663,4.03634" id="path3" /> <g id="g9650" style="display:inline" transform="matrix(-2.8381759,0,0,2.8381759,1185.011,-18.721969)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-width:0.183923;stroke-dasharray:none;stroke-opacity:1" transform="matrix(-1.4385549,0,0,1.438555,1128.7301,60.573261)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-width:0.186446;stroke-dasharray:none;stroke-opacity:1" transform="matrix(-1.419088,0,0,1.419088,1134.5163,211.25526)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:2.83818;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8-1" height="141.9088" x="72.494118" y="208.65559" rx="0" ry="0" width="113.52704" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:2.83818;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910-4" width="28.38176" height="70.954399" x="89.065239" y="243.84723" /> <g id="g6200-2" style="display:inline;stroke:#000000;stroke-width:0.183923;stroke-dasharray:none;stroke-opacity:1" transform="matrix(1.4385549,0,0,1.438555,30.39998,60.55268)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77-3" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.183923;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8-2" /> </g> <g id="g6280-2" style="display:inline;stroke:#000000;stroke-width:0.186446;stroke-dasharray:none;stroke-opacity:1" transform="matrix(1.419088,0,0,1.419088,24.61383,211.23468)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7-16" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.186446;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1-8" /> </g> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 575.23747,290 10.23636,-0.0914" id="path21" /> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 574.17433,480.24261 10.23634,-0.0914" id="path21-8" /> <path style="fill:#000000;stroke:#939393;stroke-width:1;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1" d="m 574.38068,90.018414 10.23634,-0.0914" id="path21-2" /> </g> </g>' }
    , { id: 'half-right', label: 'Half right', svgMarkup: '<g id="g3" transform="rotate(-90,289.70444,287.8732)"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> <g id="g1" transform="translate(5.8865683,1.5875)" /> <g id="g2" transform="translate(5.8865684,1.5875)" /> </g>' }
    ,{ id: 'half-left', label: 'Half left', svgMarkup: '<g id="g3" transform="rotate(90,289.70444,287.8732)"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> <g id="g1" transform="translate(5.8865683,1.5875)" /> <g id="g2" transform="translate(5.8865684,1.5875)" /> </g>' }
    , { id: 'half-top', label: 'Half top', svgMarkup: '<g id="g3" transform="rotate(180,289.70444,287.8732)"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0" transform="translate(5.8865683,1.5875)" /> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,596.2995,607.44711)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40" /> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,517.00427,551.16624)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,366.32227,556.95239)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> <g id="g1" transform="translate(5.8865683,1.5875)" /> <g id="g2" transform="translate(5.8865684,1.5875)" /> </g>' }
    , { id: 'half-bottom', label: 'Half bottom', svgMarkup: '<g id="g2" transform="translate(5.8865684,1.5875)"> <path id="path1" style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:3.30647;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:0.996764" d="m 0,0 v 471.5822 c 0,55.03218 44.303784,99.33596 99.335988,99.33596 H 468.29832 c 55.03218,0 99.33743,-44.30378 99.33743,-99.33596 V 0"  /> <g id="g1"> <g id="g9650" style="display:inline" transform="matrix(0,-2.8381759,-2.8381759,0,590.41294,605.8596)"> <rect style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5886-8" height="50" x="34.66135" y="80.121231" rx="0" ry="0" width="40"/> <rect style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" id="rect5910" width="10" height="25" x="40.5" y="92.520615" transform="translate(1.6148871e-6)" /> </g> <g id="g6200" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.4385549,-1.438555,0,511.1177,549.57874)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.650162,20.436801 c 3.288213,0 6.576438,0 9.864677,0" id="path1176-77" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.867671;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.582501,15.504463 c 0,3.288212 0,6.576437 0,9.864676" id="path1176-77-8" /> </g> <g id="g6280" style="display:inline;stroke:#000000;stroke-opacity:1" transform="matrix(0,-1.419088,-1.419088,0,360.4357,555.3649)"> <path style="opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 35.5825,189.51725 c 3.33332,0 6.666653,0 10,0" id="path1176-77-7" /> <path style="display:inline;opacity:0.97;fill:#000000;fill-opacity:0;fill-rule:evenodd;stroke:#000000;stroke-width:0.873602;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="m 40.209609,184.51725 c 0,3.33332 0,6.66665 0,10" id="path1176-77-7-1" /> </g> </g> </g>' }

];
export const fieldOptionsMap = new Map(fieldOptions.map(field => [field.id, field]));

// --- Drawing Tool Definitions ---
const playerTools = [
    // Team A (Red)
    { category: 'player', playerCategory: 'teamA', toolId: 'team-a-LF', label: 'Team A LF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LF', textColor: 'white' },
    { category: 'player', playerCategory: 'teamA', toolId: 'team-a-CF', label: 'Team A CF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'CF', textColor: 'white' },
    { category: 'player', playerCategory: 'teamA', toolId: 'team-a-RF', label: 'Team A RF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RF', textColor: 'white' },
    { category: 'player', playerCategory: 'teamA', toolId: 'team-a-LD', label: 'Team A LD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LD', textColor: 'white' },
    { category: 'player', playerCategory: 'teamA', toolId: 'team-a-RD', label: 'Team A RD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RD', textColor: 'white' },
    { category: 'player', playerCategory: 'teamA', toolId: 'team-a-G', label: 'Team A G', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'G', textColor: 'white' },
    // Team B (Black)
    { category: 'player', playerCategory: 'teamB', toolId: 'team-b-LF', label: 'Team B LF', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: 'LF', textColor: 'white' },
    { category: 'player', playerCategory: 'teamB', toolId: 'team-b-CF', label: 'Team B CF', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: 'CF', textColor: 'white' },
    { category: 'player', playerCategory: 'teamB', toolId: 'team-b-RF', label: 'Team B RF', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: 'RF', textColor: 'white' },
    { category: 'player', playerCategory: 'teamB', toolId: 'team-b-LD', label: 'Team B LD', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: 'LD', textColor: 'white' },
    { category: 'player', playerCategory: 'teamB', toolId: 'team-b-RD', label: 'Team B RD', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: 'RD', textColor: 'white' },
    { category: 'player', playerCategory: 'teamB', toolId: 'team-b-G', label: 'Team B G', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: 'G', textColor: 'white' },
    // Other Players
    { category: 'player', playerCategory: 'other', toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', text: 'C', textColor: 'black' },
    { category: 'player', playerCategory: 'other', toolId: 'generic-player-red', label: 'Player (Red)', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: null, textColor: 'white' },
    { category: 'player', playerCategory: 'other', toolId: 'generic-player-black', label: 'Player (Black)', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', text: null, textColor: 'white' },
    { category: 'player', playerCategory: 'other', toolId: 'generic-player-white', label: 'Player (White)', type: 'player', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', text: null, textColor: 'black' },
    { category: 'player', playerCategory: 'other', toolId: 'opponent', label: 'Opponent', type: 'player', radius: PLAYER_RADIUS, fill: 'blue', stroke: 'black', text: 'X', textColor: 'white' },
];

const equipmentTools = [{
    category: 'equipment',
    toolId: 'ball',
    label: 'Ball',
    type: 'equipment',
    radius: BALL_RADIUS,
    fill: 'orange',
    stroke: 'black'
}, {
    category: 'equipment',
    toolId: 'many-balls',
    label: 'Many Balls',
    type: 'equipment',
    radius: BALL_RADIUS,
    fill: 'orange',
    stroke: 'black',
    isSet: true
}, {
    category: 'equipment',
    toolId: 'gate',
    label: 'Gate',
    type: 'equipment',
    width: GATE_WIDTH,
    height: GATE_HEIGHT,
    fill: 'grey',
    stroke: 'black'
}, {
    category: 'equipment',
    toolId: 'cone',
    label: 'Cone',
    type: 'equipment',
    radius: CONE_RADIUS,
    height: CONE_HEIGHT,
    fill: 'red',
    stroke: 'black'
}, {
    category: 'equipment',
    toolId: 'barrier-line',
    label: 'Barrier Line',
    type: 'equipment',
    stroke: 'darkblue',
    strokeWidth: BARRIER_STROKE_WIDTH,
    length: 100
}, {
    category: 'equipment',
    toolId: 'barrier-corner',
    label: 'Barrier Corner',
    type: 'equipment',
    radius: BARRIER_CORNER_RADIUS,
    stroke: 'darkblue',
    strokeWidth: BARRIER_STROKE_WIDTH
}];



// --- NEW: Text Tool Configuration ---
export const DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
export const DEFAULT_FONT_WEIGHT = 'normal'; // 'normal' or 'bold'
export const DEFAULT_FONT_STYLE = 'normal'; // 'normal' or 'italic'
export const AVAILABLE_FONTS = [
    'Arial, sans-serif',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Georgia, serif',
    'Times New Roman, Times, serif',
    'Courier New, Courier, monospace',
    'Comic Sans MS, cursive, sans-serif'
];

// *** UPDATED Movement Tools ***
const movementTools = [
    { category: 'movement', toolId: 'run-straight', label: 'Run Straight', type: 'arrow', stroke: ARROW_COLOR, strokeWidth: ARROW_STROKE_WIDTH_UNIFIED, strokeDasharray: ARROW_DASH_RUN, markerEndId: MARKER_ARROW_UNIFIED_ID },
    { category: 'movement', toolId: 'run-free', label: 'Run Free', type: 'freehand-arrow', stroke: ARROW_COLOR, strokeWidth: ARROW_STROKE_WIDTH_UNIFIED, strokeDasharray: ARROW_DASH_RUN, markerEndId: MARKER_ARROW_UNIFIED_ID }
];

// *** UPDATED Pass/Shot Tools ***
const passShotTools = [
    { category: 'passShot', toolId: 'pass', label: 'Pass', type: 'arrow', stroke: ARROW_COLOR, strokeWidth: ARROW_STROKE_WIDTH_UNIFIED, markerEndId: MARKER_ARROW_UNIFIED_ID }, // Solid line (no dasharray)
    { category: 'passShot', toolId: 'shot', label: 'Shot', type: 'arrow', stroke: ARROW_COLOR, strokeWidth: ARROW_STROKE_WIDTH_UNIFIED, markerEndId: MARKER_SHOT_ARROW_ID, isDoubleLine: true } // Solid line (no dasharray)
];

// *** REPLACED Number Tools with a single tool definition ***
const numberTools = [
    { category: 'number', toolId: NUMBER_TOOL_ID, label: 'Number', type: 'number', text: '#', fontSize: NUMBER_FONT_SIZE, fill: 'black' }
];

export const TEXT_TOOL_ID = 'text-tool'; // Define ID for the Text Tool

// --- NEW: Separate Line Tools from Shape Tools ---
const lineTools = [
    { category: 'line', toolId: 'line-simple', label: 'Line (Simple)', type: 'line', stroke: DEFAULT_STROKE_COLOR, strokeWidth: LINE_STROKE_WIDTH_SIMPLE },
    { category: 'line', toolId: 'line-thin', label: 'Line (Thin)', type: 'line', stroke: DEFAULT_STROKE_COLOR, strokeWidth: LINE_STROKE_WIDTH_THIN },
    { category: 'line', toolId: 'line-thick', label: 'Line (Thick)', type: 'line', stroke: DEFAULT_STROKE_COLOR, strokeWidth: LINE_STROKE_WIDTH_THICK },
];

const shapeTools = [ 
    { category: 'shape', toolId: 'rect-outline', label: 'Rect (Outline)', type: 'shape', shapeType: 'rectangle', isFilled: false, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'rect-filled', label: 'Rect (Filled)', type: 'shape', shapeType: 'rectangle', isFilled: true, fill: DEFAULT_SHAPE_FILL_COLOR, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'square-outline', label: 'Square (Outline)', type: 'shape', shapeType: 'square', isFilled: false, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'square-filled', label: 'Square (Filled)', type: 'shape', shapeType: 'square', isFilled: true, fill: DEFAULT_SHAPE_FILL_COLOR, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'circle-outline', label: 'Circle (Outline)', type: 'shape', shapeType: 'circle', isFilled: false, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'circle-filled', label: 'Circle (Filled)', type: 'shape', shapeType: 'circle', isFilled: true, fill: DEFAULT_SHAPE_FILL_COLOR, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'triangle-outline', label: 'Triangle (Outline)', type: 'shape', shapeType: 'triangle', isFilled: false, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH }, 
    { category: 'shape', toolId: 'triangle-filled', label: 'Triangle (Filled)', type: 'shape', shapeType: 'triangle', isFilled: true, fill: DEFAULT_SHAPE_FILL_COLOR, stroke: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH },
];

const textTools = [ 
    { category: 'text', toolId: TEXT_TOOL_ID, label: 'Text', type: 'text', icon: 'T', fontSize: TEXT_FONT_SIZE, fill: 'black', fontFamily: DEFAULT_FONT_FAMILY, fontWeight: DEFAULT_FONT_WEIGHT, fontStyle: DEFAULT_FONT_STYLE } 
];

export const drawingTools = [ 
    ...playerTools, 
    ...equipmentTools, 
    ...movementTools, 
    ...passShotTools, 
    ...shapeTools, 
    ...lineTools, // Add the lineTools array to drawingTools
    ...numberTools, 
    ...textTools 
];
export const drawingToolMap = new Map(drawingTools.map(tool => [tool.toolId, tool]));
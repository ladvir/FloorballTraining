// js/config.js

export const SVG_NS = "http://www.w3.org/2000/svg";

// Element Sizing & Layout
export const MIN_ELEMENT_WIDTH = 20; // Reduced minimum for numbers/arrows
export const MIN_ELEMENT_HEIGHT = 20;
export const MOVE_HANDLE_HEIGHT = 4;
export const MOVE_HANDLE_OFFSET = 2;
export const MOVE_HANDLE_WIDTH_PERCENT = 0.2;
export const PLACEMENT_GAP = 5; // Reduced gap slightly

// Player Specifics
export const PLAYER_RADIUS = 15;
export const PLAYER_DIAMETER = PLAYER_RADIUS * 2;
export const DEFAULT_PLAYER_TOOL_ID = 'player'; // ID of the default black player

// Equipment Specifics
export const BALL_RADIUS = 8;
export const GATE_WIDTH = 15;
export const GATE_HEIGHT = 50;
export const CONE_RADIUS = 10; // Base radius
export const CONE_HEIGHT = 25;
export const BARRIER_STROKE_WIDTH = 8;
export const BARRIER_CORNER_RADIUS = 50; // Outer radius for 100px diameter effect

// Arrow / Line Specifics
export const ARROW_STROKE_WIDTH_PASS = 1.5;
export const ARROW_STROKE_WIDTH_RUN = 2;
export const ARROW_STROKE_WIDTH_SHOT = 2; // Base stroke for double line
export const ARROW_DASH_RUN = "5,5";
export const ARROW_MARKER_SIZE = 6; // Viewbox units for marker

// Number / Text Specifics
export const NUMBER_FONT_SIZE = 20;
export const TEXT_FONT_SIZE = 16;

// Sidebar Drag Preview Defaults
export const DEFAULT_GHOST_WIDTH = 120;
export const DEFAULT_GHOST_HEIGHT = 80;

// Interaction Parameters
export const ROTATION_STEP = 45; // Degrees
export const SELECTION_RECT_MIN_SIZE = 5; // Min width/height to trigger marquee selection

// Default Sidebar Data (if localStorage is empty)
export const DEFAULT_ACTIVITIES = [
    { id: 1, name: "Activity A", svg: "<circle cx='20' cy='20' r='18' fill='blue' class='activity-svg' />" },
    { id: 2, name: "Activity B", svg: "<rect x='5' y='5' width='30' height='30' fill='red' class='activity-svg' />" },
    { id: 3, name: "Activity C", svg: "<svg class='activity-svg' viewBox='0 0 40 40' width='40' height='40'><path fill='#555' d='M20 1.6c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24S23.46 1.6 20 1.6zm-7.68 14.24c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm-23.04 14.4c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24z'/></svg>" }
];

// --- SVG Marker Definitions ---
// These IDs will be referenced by marker-end attributes
export const MARKER_ARROW_PASS_ID = "arrowhead-pass";
export const MARKER_ARROW_RUN_ID = "arrowhead-run";
export const MARKER_ARROW_SHOT_ID = "arrowhead-shot";

// --- Drawing Tool Definitions ---

const playerTools = [
    { category: 'player', toolId: DEFAULT_PLAYER_TOOL_ID, label: 'Generic Player', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black', text: null, textColor: 'white' },
    { category: 'player', toolId: 'team-a', label: 'Team A Player', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: null, textColor: 'white' },
    { category: 'player', toolId: 'team-a-LF', label: 'Team A LF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LF', textColor: 'white' },
    { category: 'player', toolId: 'team-a-CF', label: 'Team A CF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'CF', textColor: 'white' },
    { category: 'player', toolId: 'team-a-RF', label: 'Team A RF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RF', textColor: 'white' },
    { category: 'player', toolId: 'team-a-LD', label: 'Team A LD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LD', textColor: 'white' },
    { category: 'player', toolId: 'team-a-RD', label: 'Team A RD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RD', textColor: 'white' },
    { category: 'player', toolId: 'team-a-G', label: 'Team A G', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'team-b', label: 'Team B Player', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: null, textColor: 'white' },
    { category: 'player', toolId: 'team-b-LF', label: 'Team B LF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'LF', textColor: 'white' },
    { category: 'player', toolId: 'team-b-CF', label: 'Team B CF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'CF', textColor: 'white' },
    { category: 'player', toolId: 'team-b-RF', label: 'Team B RF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'RF', textColor: 'white' },
    { category: 'player', toolId: 'team-b-LD', label: 'Team B LD', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'LD', textColor: 'white' },
    { category: 'player', toolId: 'team-b-RD', label: 'Team B RD', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'RD', textColor: 'white' },
    { category: 'player', toolId: 'team-b-G', label: 'Team B G', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', text: 'C', textColor: 'black' },
];

const equipmentTools = [
    { category: 'equipment', toolId: 'ball', label: 'Ball', type: 'equipment', radius: BALL_RADIUS, fill: 'orange', stroke: 'black' },
    { category: 'equipment', toolId: 'many-balls', label: 'Many Balls', type: 'equipment', radius: BALL_RADIUS, fill: 'orange', stroke: 'black', isSet: true },
    { category: 'equipment', toolId: 'gate', label: 'Gate', type: 'equipment', width: GATE_WIDTH, height: GATE_HEIGHT, fill: 'grey', stroke: 'black' },
    { category: 'equipment', toolId: 'cone', label: 'Cone', type: 'equipment', radius: CONE_RADIUS, height: CONE_HEIGHT, fill: 'red', stroke: 'black' },
    { category: 'equipment', toolId: 'barrier-line', label: 'Barrier Line', type: 'equipment', stroke: 'darkblue', strokeWidth: BARRIER_STROKE_WIDTH, length: 100 },
    { category: 'equipment', toolId: 'barrier-corner', label: 'Barrier Corner', type: 'equipment', radius: BARRIER_CORNER_RADIUS, stroke: 'darkblue', strokeWidth: BARRIER_STROKE_WIDTH }
];

// Defer freehand for now, represent as dashed straight arrow
const movementTools = [
    { category: 'movement', toolId: 'run-straight', label: 'Run Straight', type: 'arrow', stroke: 'blue', strokeWidth: ARROW_STROKE_WIDTH_RUN, strokeDasharray: ARROW_DASH_RUN, markerEndId: MARKER_ARROW_RUN_ID },
    { category: 'movement', toolId: 'run-free', label: 'Run Free', type: 'arrow', stroke: 'blue', strokeWidth: ARROW_STROKE_WIDTH_RUN, strokeDasharray: ARROW_DASH_RUN, markerEndId: MARKER_ARROW_RUN_ID } // Placeholder: use same as straight for now
];

const passShotTools = [
    { category: 'passShot', toolId: 'pass', label: 'Pass', type: 'arrow', stroke: 'black', strokeWidth: ARROW_STROKE_WIDTH_PASS, markerEndId: MARKER_ARROW_PASS_ID },
    { category: 'passShot', toolId: 'shot', label: 'Shot', type: 'arrow', stroke: 'red', strokeWidth: ARROW_STROKE_WIDTH_SHOT, markerEndId: MARKER_ARROW_SHOT_ID, isDoubleLine: true } // Flag for double line
];

const numberTools = [
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({
        category: 'number',
        toolId: `number-${n}`,
        label: `${n}`,
        type: 'number',
        text: `${n}`,
        fontSize: NUMBER_FONT_SIZE,
        fill: 'black'
    }))
];

const textTools = [
    { category: 'text', toolId: 'text-tool', label: 'Text', type: 'text', icon: 'T', fontSize: TEXT_FONT_SIZE, fill: 'black' }
];


// Combine all tools
export const drawingTools = [
    ...playerTools,
    ...equipmentTools,
    ...movementTools,
    ...passShotTools,
    ...numberTools,
    ...textTools
];
export const drawingToolMap = new Map(drawingTools.map(tool => [tool.toolId, tool]));
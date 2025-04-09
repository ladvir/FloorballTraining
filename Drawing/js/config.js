// js/config.js

export const SVG_NS = "http://www.w3.org/2000/svg";

// Element Sizing & Layout
export const MIN_ELEMENT_WIDTH = 40;
export const MIN_ELEMENT_HEIGHT = 40;
export const MOVE_HANDLE_HEIGHT = 4;
export const MOVE_HANDLE_OFFSET = 2;
export const MOVE_HANDLE_WIDTH_PERCENT = 0.2;
export const PLACEMENT_GAP = 10; // Min distance between element BBoxes

// Player Specifics
export const PLAYER_RADIUS = 15;
export const PLAYER_DIAMETER = PLAYER_RADIUS * 2;
export const DEFAULT_PLAYER_TOOL_ID = 'player'; // ID of the default black player

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

// Player Tool Definitions (ensure Default player is accessible easily)
export const playerTools = [
    { toolId: DEFAULT_PLAYER_TOOL_ID, label: 'Generic Player', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black', text: null, textColor: 'white' },
    { toolId: 'team-a', label: 'Team A Player', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: null, textColor: 'white' }, // Extended label
    { toolId: 'team-a-LF', label: 'Team A LF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LF', textColor: 'white' }, { toolId: 'team-a-CF', label: 'Team A CF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'CF', textColor: 'white' }, { toolId: 'team-a-RF', label: 'Team A RF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RF', textColor: 'white' }, { toolId: 'team-a-LD', label: 'Team A LD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LD', textColor: 'white' }, { toolId: 'team-a-RD', label: 'Team A RD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RD', textColor: 'white' }, { toolId: 'team-a-G', label: 'Team A G', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'G', textColor: 'white' },
    { toolId: 'team-b', label: 'Team B Player', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: null, textColor: 'white' }, // Extended label
    { toolId: 'team-b-LF', label: 'Team B LF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'LF', textColor: 'white' }, { toolId: 'team-b-CF', label: 'Team B CF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'CF', textColor: 'white' }, { toolId: 'team-b-RF', label: 'Team B RF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'RF', textColor: 'white' }, { toolId: 'team-b-LD', label: 'Team B LD', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'LD', textColor: 'white' }, { toolId: 'team-b-RD', label: 'Team B RD', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'RD', textColor: 'white' }, { toolId: 'team-b-G', label: 'Team B G', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'G', textColor: 'white' },
    { toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', text: 'C', textColor: 'black' },
];
export const playerToolMap = new Map(playerTools.map(tool => [tool.toolId, tool]));
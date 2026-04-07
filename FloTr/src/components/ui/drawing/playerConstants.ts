export type PlayerTool = {
    category: 'player';
    toolId: string;
    label: string;
    type: string;
    radius: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    text: string | null;
    textColor: string;
};

export const PLAYER_RADIUS = 16;
export const PLAYER_STROKE_WIDTH = 1.5;

export const playerTools: PlayerTool[] = [
    { category: 'player', toolId: 'player-black', label: 'Player (black)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-white', label: 'Player (white)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Player (red)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },

    { category: 'player', toolId: 'player-black-G', label: 'Goalie (black)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'player-white-G', label: 'Goalie (white)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red-G', label: 'Goalie (red)', type: 'playerB', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },

    { category: 'player', toolId: 'tri-black', label: 'Triangle (black)', type: 'playerC', radius: PLAYER_RADIUS * 2, fill: 'black', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'tri-white', label: 'Triangle (white)', type: 'playerC', radius: PLAYER_RADIUS * 2, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'tri-red', label: 'Triangle (red)', type: 'playerC', radius: PLAYER_RADIUS * 2, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },

    { category: 'player', toolId: 'coach', label: 'Coach', type: 'coach', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'C', textColor: 'black' }
];

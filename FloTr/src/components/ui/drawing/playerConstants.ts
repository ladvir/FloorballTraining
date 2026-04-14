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
    { category: 'player', toolId: 'player-black', label: 'Hráč', type: 'playerB', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'player-white', label: 'Hráč', type: 'playerB', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'player-red', label: 'Hráč', type: 'playerB', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'tri-black', label: 'Protivník', type: 'playerC', radius: PLAYER_RADIUS * 2, fill: 'black', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    { category: 'player', toolId: 'tri-white', label: 'Protivník', type: 'playerC', radius: PLAYER_RADIUS * 2, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'black' },
    { category: 'player', toolId: 'tri-red', label: 'Protivník', type: 'playerC', radius: PLAYER_RADIUS * 2, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: null, textColor: 'white' },
    
    { category: 'player', toolId: 'player-black-G', label: 'Brankář', type: 'playerB', radius: PLAYER_RADIUS, fill: 'black', stroke: 'white', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },
    { category: 'player', toolId: 'player-white-G', label: 'Brankář', type: 'playerB', radius: PLAYER_RADIUS, fill: 'white', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'black' },
    { category: 'player', toolId: 'player-red-G', label: 'Brankář', type: 'playerB', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'G', textColor: 'white' },

    

    { category: 'player', toolId: 'coach', label: 'Trenér', type: 'coach', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', strokeWidth: PLAYER_STROKE_WIDTH, text: 'C', textColor: 'black' }
];

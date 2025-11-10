import { playerTools } from './PlayerSelector';
import { equipmentTools } from './EquipmentSelector';

export type PlayerOnCanvas = {
    tool: typeof playerTools[number];
    x: number;
    y: number;
};

export type EquipmentOnCanvas = {
    tool: typeof equipmentTools[number];
    x: number;
    y: number;
    balls?: { x: number; y: number }[];
};

export type Line = { x1: number, y1: number, x2: number, y2: number, color: string, type: string, dash?: string, arrow?: boolean, strokeWidth:number };

export type FreehandLine = { points: {x: number, y: number}[], color: string, dash: string, strokeWidth: number, arrow: boolean };


import { playerTools } from './playerConstants';
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
    /** For line-type equipment (ladder, slalom pole, low cone row) */
    x2?: number;
    y2?: number;
    /** Rotation in degrees around the item's own center */
    rotation?: number;
};

export type Line = { x1: number, y1: number, x2: number, y2: number, color: string, type: string, dash?: string, arrow?: boolean, strokeWidth:number };

export type FreehandLine = { points: {x: number, y: number}[], color: string, dash: string, strokeWidth: number, arrow: boolean };

export type TextItem = { id: string; x: number; y: number; text: string; fontSize: number; color: string; fontWeight?: string; fontStyle?: string };

export type NumberItem = { id: string; x: number; y: number; value: number; fontSize: number; color: string };

export type ShapeType = 'rectangle' | 'square' | 'circle' | 'triangle' | 'ellipse';

export type ShapeOnCanvas = {
    id: string;
    type: ShapeType;
    /** Rectangle/Square: top-left x,y + width,height */
    x: number;
    y: number;
    width: number;
    height: number;
    /** Circle: center cx,cy + radius r; Ellipse: center cx,cy + rx (width), ry (height) stored in width/height */
    cx: number;
    cy: number;
    r: number;
    /** Triangle: three vertices */
    points: { x: number; y: number }[];
    /** Style */
    filled: boolean;
    strokeColor: string;
    fillColor: string;
};

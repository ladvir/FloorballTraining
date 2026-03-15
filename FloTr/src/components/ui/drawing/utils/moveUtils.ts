/**
 * Utility functions for moving items on canvas
 */

import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine, TextItem, NumberItem } from '../DrawingTypes';
import type { SelectedItems } from './selectionUtils';

export interface DragStartPositions {
    players: PlayerOnCanvas[];
    equipment: EquipmentOnCanvas[];
    lines: Line[];
    freehandLines: FreehandLine[];
    texts: TextItem[];
    numbers: NumberItem[];
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Moves a point within canvas bounds
 */
export function movePoint(
    x: number,
    y: number,
    dx: number,
    dy: number,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
): { x: number; y: number } {
    return {
        x: clamp(x + dx, minX, maxX),
        y: clamp(y + dy, minY, maxY)
    };
}

/**
 * Moves players based on drag offset
 */
export function movePlayers(
    players: PlayerOnCanvas[],
    selectedItems: SelectedItems,
    dragStartPositions: DragStartPositions,
    dx: number,
    dy: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): PlayerOnCanvas[] {
    return players.map((p, i) => {
        if (!selectedItems.players.includes(i)) return p;
        const arr = dragStartPositions.players;
        const selIdx = selectedItems.players.indexOf(i);
        if (selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return p;
        const newPos = movePoint(arr[selIdx].x, arr[selIdx].y, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        return { ...p, x: newPos.x, y: newPos.y };
    });
}

/**
 * Moves equipment based on drag offset
 */
export function moveEquipment(
    equipment: EquipmentOnCanvas[],
    selectedItems: SelectedItems,
    dragStartPositions: DragStartPositions,
    dx: number,
    dy: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): EquipmentOnCanvas[] {
    return equipment.map((eq, i) => {
        if (!selectedItems.equipment.includes(i)) return eq;
        const arr = dragStartPositions.equipment;
        const selIdx = selectedItems.equipment.indexOf(i);
        if (selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return eq;
        const newPos = movePoint(arr[selIdx].x, arr[selIdx].y, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        return { ...eq, x: newPos.x, y: newPos.y };
    });
}

/**
 * Moves lines based on drag offset
 */
export function moveLines(
    lines: Line[],
    selectedItems: SelectedItems,
    dragStartPositions: DragStartPositions,
    dx: number,
    dy: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Line[] {
    return lines.map((l, i) => {
        if (!selectedItems.lines.includes(i)) return l;
        const arr = dragStartPositions.lines;
        const selIdx = selectedItems.lines.indexOf(i);
        if (selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return l;
        const l0 = arr[selIdx];
        const p1 = movePoint(l0.x1, l0.y1, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        const p2 = movePoint(l0.x2, l0.y2, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        return { ...l, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
}

/**
 * Moves freehand lines based on drag offset
 */
export function moveFreehandLines(
    freehandLines: FreehandLine[],
    selectedItems: SelectedItems,
    dragStartPositions: DragStartPositions,
    dx: number,
    dy: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): FreehandLine[] {
    return freehandLines.map((fl, i) => {
        if (!selectedItems.freehandLines.includes(i)) return fl;
        const arr = dragStartPositions.freehandLines;
        const selIdx = selectedItems.freehandLines.indexOf(i);
        if (selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return fl;
        const orig = arr[selIdx].points;
        const newPoints = orig.map(pt => movePoint(pt.x, pt.y, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY));
        return { ...fl, points: newPoints };
    });
}

/**
 * Moves texts based on drag offset
 */
export function moveTexts(
    texts: TextItem[],
    selectedItems: SelectedItems,
    dragStartPositions: DragStartPositions,
    dx: number,
    dy: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): TextItem[] {
    return texts.map((t, i) => {
        if (!selectedItems.texts.includes(i)) return t;
        const arr = dragStartPositions.texts;
        const selIdx = selectedItems.texts.indexOf(i);
        if (selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return t;
        const newPos = movePoint(arr[selIdx].x, arr[selIdx].y, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        return { ...t, x: newPos.x, y: newPos.y };
    });
}

/**
 * Moves numbers based on drag offset
 */
export function moveNumbers(
    numbers: NumberItem[],
    selectedItems: SelectedItems,
    dragStartPositions: DragStartPositions,
    dx: number,
    dy: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): NumberItem[] {
    return numbers.map((n, i) => {
        if (!selectedItems.numbers.includes(i)) return n;
        const arr = dragStartPositions.numbers;
        const selIdx = selectedItems.numbers.indexOf(i);
        if (selIdx < 0 || selIdx >= arr.length || !arr[selIdx]) return n;
        const newPos = movePoint(arr[selIdx].x, arr[selIdx].y, dx, dy, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        return { ...n, x: newPos.x, y: newPos.y };
    });
}



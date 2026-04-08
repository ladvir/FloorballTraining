/**
 * Utility functions for selection logic
 */

import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine, TextItem, NumberItem, ShapeOnCanvas } from '../DrawingTypes';

export interface SelectedItems {
    players: number[];
    equipment: number[];
    lines: number[];
    freehandLines: number[];
    texts: number[];
    numbers: number[];
    shapes: number[];
}

export const EMPTY_SELECTION: SelectedItems = {
    players: [],
    equipment: [],
    lines: [],
    freehandLines: [],
    texts: [],
    numbers: [],
    shapes: []
};

/**
 * Creates a safe SelectedItems object from any input
 */
export function getSafeSelectedItems(items: any): SelectedItems {
    const base = (items && typeof items === 'object') ? items : {};
    return {
        players: Array.isArray(base.players) ? base.players : [],
        equipment: Array.isArray(base.equipment) ? base.equipment : [],
        lines: Array.isArray(base.lines) ? base.lines : [],
        freehandLines: Array.isArray(base.freehandLines) ? base.freehandLines : [],
        texts: Array.isArray(base.texts) ? base.texts : [],
        numbers: Array.isArray(base.numbers) ? base.numbers : [],
        shapes: Array.isArray(base.shapes) ? base.shapes : []
    };
}

/**
 * Checks if a point is inside a rectangle
 */
function isInside(px: number, py: number, minX: number, minY: number, maxX: number, maxY: number): boolean {
    return px > minX && px < maxX && py > minY && py < maxY;
}

/**
 * Checks if a point is touching a rectangle (inclusive boundaries)
 */
function isTouching(px: number, py: number, minX: number, minY: number, maxX: number, maxY: number): boolean {
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

/**
 * Selects items within a selection rectangle
 */
export function selectItemsInRect(
    rect: { x1: number; y1: number; x2: number; y2: number },
    items: {
        players: PlayerOnCanvas[];
        equipment: EquipmentOnCanvas[];
        lines: Line[];
        freehandLines: FreehandLine[];
        texts: TextItem[];
        numbers: NumberItem[];
        shapes: ShapeOnCanvas[];
    }
): SelectedItems {
    const { x1, y1, x2, y2 } = rect;
    const leftToRight = x2 > x1;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const checkInside = (px: number, py: number) => isInside(px, py, minX, minY, maxX, maxY);
    const checkTouching = (px: number, py: number) => isTouching(px, py, minX, minY, maxX, maxY);
    const select = (px: number, py: number) => leftToRight ? checkInside(px, py) : checkTouching(px, py);

    return {
        players: items.players
            .map((p, i) => select(p.x, p.y) ? i : -1)
            .filter(i => i !== -1),
        equipment: items.equipment
            .map((e, i) => select(e.x, e.y) ? i : -1)
            .filter(i => i !== -1),
        lines: items.lines
            .map((l, i) => {
                if (leftToRight) {
                    return checkInside(l.x1, l.y1) && checkInside(l.x2, l.y2) ? i : -1;
                } else {
                    return checkTouching(l.x1, l.y1) || checkTouching(l.x2, l.y2) ? i : -1;
                }
            })
            .filter(i => i !== -1),
        freehandLines: items.freehandLines
            .map((l, i) => {
                if (leftToRight) {
                    return l.points.every(pt => checkInside(pt.x, pt.y)) ? i : -1;
                } else {
                    return l.points.some(pt => checkTouching(pt.x, pt.y)) ? i : -1;
                }
            })
            .filter(i => i !== -1),
        texts: items.texts
            .map((t, i) => select(t.x, t.y) ? i : -1)
            .filter(i => i !== -1),
        numbers: items.numbers
            .map((n, i) => select(n.x, n.y) ? i : -1)
            .filter(i => i !== -1),
        shapes: items.shapes
            .map((s, i) => {
                if (s.type === 'circle') return select(s.cx, s.cy) ? i : -1;
                if (s.type === 'triangle' && s.points.length >= 3) {
                    const cx = (s.points[0].x + s.points[1].x + s.points[2].x) / 3;
                    const cy = (s.points[0].y + s.points[1].y + s.points[2].y) / 3;
                    return select(cx, cy) ? i : -1;
                }
                return select(s.x + s.width / 2, s.y + s.height / 2) ? i : -1;
            })
            .filter(i => i !== -1)
    };
}

/**
 * Checks if there are any selected items
 */
export function hasSelection(selectedItems: SelectedItems): boolean {
    return (
        selectedItems.players.length > 0 ||
        selectedItems.equipment.length > 0 ||
        selectedItems.lines.length > 0 ||
        selectedItems.freehandLines.length > 0 ||
        selectedItems.texts.length > 0 ||
        selectedItems.numbers.length > 0 ||
        (selectedItems.shapes?.length ?? 0) > 0
    );
}



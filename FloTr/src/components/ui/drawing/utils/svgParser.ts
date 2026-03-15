/**
 * Utility functions for parsing SVG XML
 */

import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine } from '../DrawingTypes';

export interface ParsedSvgData {
    isFlotr: boolean;
    players: PlayerOnCanvas[];
    equipment: EquipmentOnCanvas[];
    lines: Line[];
    freehandLines: FreehandLine[];
}

/**
 * Parses SVG XML and extracts drawing elements
 */
export function parseSvgXmlToCollections(svgXml: string): ParsedSvgData {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(svgXml, "image/svg+xml");
    const svg = doc.querySelector('svg');
    
    if (!svg) {
        return { isFlotr: false, players: [], equipment: [], lines: [], freehandLines: [] };
    }
    
    const isFlotr = svg.getAttribute('src') === 'flotr';
    if (!isFlotr) {
        return { isFlotr: false, players: [], equipment: [], lines: [], freehandLines: [] };
    }

    // Parse players
    const players: PlayerOnCanvas[] = [];
    doc.querySelectorAll('circle[data-type="player"]').forEach(el => {
        players.push({
            tool: {
                toolId: el.getAttribute('data-tool-id') || 'player',
                category: 'player',
                label: el.getAttribute('data-label') || '',
                type: 'player',
                radius: Number(el.getAttribute('r')),
                fill: el.getAttribute('fill') || '',
                stroke: el.getAttribute('stroke') || '',
                strokeWidth: Number(el.getAttribute('stroke-width')),
                text: el.getAttribute('data-text') || '',
                textColor: el.getAttribute('data-text-color') || '#000'
            },
            x: Number(el.getAttribute('cx')),
            y: Number(el.getAttribute('cy'))
        });
    });

    // Parse equipment
    const equipment: EquipmentOnCanvas[] = [];
    doc.querySelectorAll('[data-type="equipment"]').forEach(el => {
        const ballsAttr = el.getAttribute('data-balls');
        equipment.push({
            tool: {
                toolId: el.getAttribute('data-tool-id') || 'equipment',
                category: 'equipment',
                label: el.getAttribute('data-label') || '',
                type: 'equipment',
                radius: Number(el.getAttribute('r')),
                fill: el.getAttribute('fill') || undefined,
                stroke: el.getAttribute('stroke') || undefined,
                strokeWidth: Number(el.getAttribute('stroke-width')),
                width: Number(el.getAttribute('width')),
                height: Number(el.getAttribute('height')),
                length: Number(el.getAttribute('data-length'))
            },
            x: Number(el.getAttribute('cx')) || Number(el.getAttribute('x')) || 0,
            y: Number(el.getAttribute('cy')) || Number(el.getAttribute('y')) || 0,
            balls: ballsAttr ? JSON.parse(ballsAttr) : undefined
        });
    });

    // Parse lines
    const lines: Line[] = [];
    doc.querySelectorAll('line[data-type="line"]').forEach(el => {
        lines.push({
            x1: Number(el.getAttribute('x1')),
            y1: Number(el.getAttribute('y1')),
            x2: Number(el.getAttribute('x2')),
            y2: Number(el.getAttribute('y2')),
            color: el.getAttribute('stroke') || '',
            type: el.getAttribute('data-line-type') || 'line',
            dash: el.getAttribute('stroke-dasharray') || '',
            arrow: el.getAttribute('data-arrow') === 'true',
            strokeWidth: Number(el.getAttribute('stroke-width'))
        });
    });

    // Parse freehand lines
    const freehandLines: FreehandLine[] = [];
    doc.querySelectorAll('path[data-type="freehand"]').forEach(el => {
        const pointsAttr = el.getAttribute('data-points');
        const points = pointsAttr ? JSON.parse(pointsAttr) : [];
        freehandLines.push({
            points,
            color: el.getAttribute('stroke') || 'black',
            dash: el.getAttribute('stroke-dasharray') || '',
            strokeWidth: Number(el.getAttribute('stroke-width')),
            arrow: el.getAttribute('data-arrow') === 'true'
        });
    });

    return { isFlotr, players, equipment, lines, freehandLines };
}



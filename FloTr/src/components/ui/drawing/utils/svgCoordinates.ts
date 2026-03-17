/**
 * Utility functions for converting between screen coordinates and SVG coordinates
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Extracts client coordinates from mouse or touch event
 */
export function getClientCoordinates(e: MouseEvent | TouchEvent): Point {
    if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    } else if ('clientX' in e) {
        return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
}

/**
 * Converts screen coordinates to SVG coordinates
 */
export function screenToSvgCoordinates(
    svg: SVGSVGElement,
    clientX: number,
    clientY: number
): Point | null {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
}

/**
 * Converts SVG coordinates to screen coordinates
 */
export function svgToScreenCoordinates(
    svg: SVGSVGElement,
    svgX: number,
    svgY: number
): Point | null {
    const pt = svg.createSVGPoint();
    pt.x = svgX;
    pt.y = svgY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const screenPt = pt.matrixTransform(ctm);
    return { x: screenPt.x, y: screenPt.y };
}

/**
 * Gets SVG coordinates from a mouse or touch event
 */
export function getSvgCoordinatesFromEvent(
    svg: SVGSVGElement,
    e: MouseEvent | TouchEvent
): Point | null {
    const clientCoords = getClientCoordinates(e);
    return screenToSvgCoordinates(svg, clientCoords.x, clientCoords.y);
}



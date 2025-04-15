// js/elements.js
import {
    MIN_ELEMENT_HEIGHT, MIN_ELEMENT_WIDTH, MOVE_HANDLE_HEIGHT, MOVE_HANDLE_OFFSET, // Keep offset/height for potential future use? Or remove? Let's keep for now.
    MOVE_HANDLE_WIDTH_PERCENT, PLAYER_DIAMETER, PLAYER_RADIUS, SVG_NS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, ARROW_STROKE_WIDTH_PASS, ARROW_STROKE_WIDTH_RUN,
    ARROW_STROKE_WIDTH_SHOT, ARROW_DASH_RUN, MARKER_ARROW_PASS_ID,
    MARKER_ARROW_RUN_ID, MARKER_ARROW_SHOT_LARGE_ID,
    NUMBER_FONT_SIZE, TEXT_FONT_SIZE,
    PLACEMENT_GAP,
    FREEHAND_SIMPLIFICATION_TOLERANCE
} from './config.js';
import { dom } from './dom.js';
import { appState } from './state.js';
import { makeElementInteractive } from './interactions.js';
import { updateElementVisualSelection } from './selection.js';
import { getTransformedBBox } from './utils.js';


/** Creates a generic canvas element (Activities, Library) */
export function createCanvasElement(config, centerX, centerY) {
    config = config || {};
    const width = Math.max(MIN_ELEMENT_WIDTH, config.width || MIN_ELEMENT_WIDTH);
    const height = Math.max(MIN_ELEMENT_HEIGHT, config.height || MIN_ELEMENT_HEIGHT);
    const name = config.name || "Element";
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element");
    const initialTranslateX = centerX - width / 2;
    const initialTranslateY = centerY - height / 2;
    group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`);
    group.dataset.rotation = "0";
    group.dataset.elementType = config.type;
    if (config.id) group.dataset.activityId = String(config.id);
    if (config.name) group.dataset.elementName = name;
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "element-bg");
    rect.setAttribute("x", "0"); rect.setAttribute("y", "0"); rect.setAttribute("width", String(width)); rect.setAttribute("height", String(height)); rect.setAttribute("rx", "10"); rect.setAttribute("ry", "10"); rect.setAttribute("fill", "lightyellow"); rect.setAttribute("stroke", "black"); group.appendChild(rect);
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "10"); text.setAttribute("y", "20"); text.setAttribute("font-size", "12"); text.setAttribute("fill", "black"); text.setAttribute("class", "element-label"); text.style.pointerEvents = "none"; text.textContent = name; group.appendChild(text);
    const contentPaddingX = 10; const contentPaddingY = 30; const availableContentWidth = Math.max(0, width - 2 * contentPaddingX); const availableContentHeight = Math.max(0, height - contentPaddingY - 10);
    if (availableContentWidth > 0 && availableContentHeight > 0 && config.svgContent) {
        if (config.type === 'activity') {
            try {
                const parser = new DOMParser(); const svgDoc = parser.parseFromString(config.svgContent, "image/svg+xml"); const innerSvgElement = svgDoc.documentElement;
                if (innerSvgElement && innerSvgElement.nodeName === 'svg') {
                    const svgContainer = document.createElementNS(SVG_NS, "svg"); svgContainer.setAttribute("x", String(contentPaddingX)); svgContainer.setAttribute("y", String(contentPaddingY)); svgContainer.setAttribute("width", String(availableContentWidth)); svgContainer.setAttribute("height", String(availableContentHeight)); svgContainer.setAttribute("preserveAspectRatio", "xMidYMid meet");
                    if (!innerSvgElement.getAttribute('viewBox')) { const innerW = innerSvgElement.getAttribute('width') || '40'; const innerH = innerSvgElement.getAttribute('height') || '40'; svgContainer.setAttribute("viewBox", `0 0 ${innerW} ${innerH}`); }
                    else { svgContainer.setAttribute("viewBox", innerSvgElement.getAttribute('viewBox')); }
                    while (innerSvgElement.firstChild) { svgContainer.appendChild(document.importNode(innerSvgElement.firstChild, true)); }
                    svgContainer.style.pointerEvents = "none"; group.appendChild(svgContainer);
                }
            } catch(e) { console.error("Error creating activity SVG container:", e); }
        } else if (config.type === 'library') {
            try {
                const foreignObject = document.createElementNS(SVG_NS, "foreignObject"); foreignObject.setAttribute("x", String(contentPaddingX)); foreignObject.setAttribute("y", String(contentPaddingY)); foreignObject.setAttribute("width", String(availableContentWidth)); foreignObject.setAttribute("height", String(availableContentHeight)); foreignObject.style.pointerEvents = "none";
                foreignObject.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; overflow:hidden; display:flex; align-items:center; justify-content:center; pointer-events: none;">${config.svgContent}</div>`;
                const innerSvg = foreignObject.querySelector('svg'); if (innerSvg) { innerSvg.style.width = '100%'; innerSvg.style.height = '100%'; innerSvg.style.display = 'block'; innerSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); innerSvg.style.pointerEvents = 'none'; } group.appendChild(foreignObject);
            } catch(e) { console.error("Error creating library foreignObject:", e); }
        }
    }
    ensureHandles(group, width, height, false); // isPlayer false
    makeElementInteractive(group);
    return group;
}
/** Creates a player element */
export function createPlayerElement(config, centerX, centerY) {
    const radius = config.radius || PLAYER_RADIUS; const diameter = radius * 2; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "player-element"); group.dataset.elementType = 'player'; group.setAttribute("transform", `translate(${centerX}, ${centerY})`); group.dataset.rotation = "0"; group.dataset.playerType = config.toolId; group.dataset.elementName = config.label || "Player"; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", String(-radius)); bgRect.setAttribute("y", String(-radius)); bgRect.setAttribute("width", String(diameter)); bgRect.setAttribute("height", String(diameter)); bgRect.setAttribute("fill", "transparent"); bgRect.setAttribute("stroke", "none"); group.appendChild(bgRect); const circle = document.createElementNS(SVG_NS, "circle"); circle.setAttribute("cx", "0"); circle.setAttribute("cy", "0"); circle.setAttribute("r", String(radius)); circle.setAttribute("fill", config.fill || "black"); circle.setAttribute("stroke", config.stroke || "black"); circle.setAttribute("stroke-width", "1"); group.appendChild(circle); if (config.text) { const text = document.createElementNS(SVG_NS, "text"); text.setAttribute("x", "0"); text.setAttribute("y", "0"); text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central"); text.setAttribute("fill", config.textColor || "white"); text.setAttribute("font-size", "10"); text.setAttribute("font-weight", "bold"); text.style.pointerEvents = "none"; text.textContent = config.text; group.appendChild(text); } ensureHandles(group, diameter, diameter, true); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Ball element */
export function createBallElement(config, centerX, centerY) {
    const radius = config.radius || BALL_RADIUS; const diameter = radius * 2; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "equipment-element"); group.dataset.elementType = 'equipment'; group.dataset.equipmentType = config.toolId; group.dataset.elementName = config.label || "Ball"; group.setAttribute("transform", `translate(${centerX}, ${centerY})`); group.dataset.rotation = "0"; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", String(-radius)); bgRect.setAttribute("y", String(-radius)); bgRect.setAttribute("width", String(diameter)); bgRect.setAttribute("height", String(diameter)); bgRect.setAttribute("fill", "transparent"); bgRect.setAttribute("stroke", "none"); group.appendChild(bgRect); const circle = document.createElementNS(SVG_NS, "circle"); circle.setAttribute("cx", "0"); circle.setAttribute("cy", "0"); circle.setAttribute("r", String(radius)); circle.setAttribute("fill", config.fill || "orange"); circle.setAttribute("stroke", config.stroke || "black"); circle.setAttribute("stroke-width", "1"); group.appendChild(circle); ensureHandles(group, diameter, diameter, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a "Many Balls" element */
export function createManyBallsElement(config, centerX, centerY) {
    const radius = config.radius || BALL_RADIUS; const diameter = radius * 2; const numBalls = Math.floor(Math.random() * 5) + 3; const spreadFactor = radius * 5; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "equipment-element"); group.dataset.elementType = 'equipment'; group.dataset.equipmentType = config.toolId; group.dataset.elementName = config.label || "ManyBalls"; group.setAttribute("transform", `translate(${centerX}, ${centerY})`); group.dataset.rotation = "0"; let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; for (let i = 0; i < numBalls; i++) { const angle = Math.random() * Math.PI * 2; const dist = Math.random() * spreadFactor; const x = Math.cos(angle) * dist; const y = Math.sin(angle) * dist; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); const circle = document.createElementNS(SVG_NS, "circle"); circle.setAttribute("cx", String(x)); circle.setAttribute("cy", String(y)); circle.setAttribute("r", String(radius)); circle.setAttribute("fill", config.fill || "orange"); circle.setAttribute("stroke", config.stroke || "black"); circle.setAttribute("stroke-width", "1"); group.appendChild(circle); } const bgX = minX - radius; const bgY = minY - radius; const bgWidth = (maxX - minX) + diameter; const bgHeight = (maxY - minY) + diameter; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", String(bgX)); bgRect.setAttribute("y", String(bgY)); bgRect.setAttribute("width", String(bgWidth)); bgRect.setAttribute("height", String(bgHeight)); bgRect.setAttribute("fill", "transparent"); bgRect.setAttribute("stroke", "none"); group.appendChild(bgRect); ensureHandles(group, bgWidth, bgHeight, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Gate element */
export function createGateElement(config, centerX, centerY) {
    const width = config.width || GATE_WIDTH; const height = config.height || GATE_HEIGHT; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "equipment-element"); group.dataset.elementType = 'equipment'; group.dataset.equipmentType = config.toolId; group.dataset.elementName = config.label || "Gate"; const initialTranslateX = centerX - width / 2; const initialTranslateY = centerY - height / 2; group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`); group.dataset.rotation = "0"; const gateRect = document.createElementNS(SVG_NS, "rect"); gateRect.setAttribute("class", "element-bg"); gateRect.setAttribute("x", "0"); gateRect.setAttribute("y", "0"); gateRect.setAttribute("width", String(width)); gateRect.setAttribute("height", String(height)); gateRect.setAttribute("fill", config.fill || "grey"); gateRect.setAttribute("stroke", config.stroke || "black"); gateRect.setAttribute("stroke-width", "1"); group.appendChild(gateRect); ensureHandles(group, width, height, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Cone element */
export function createConeElement(config, centerX, centerY) {
    const baseRadius = config.radius || CONE_RADIUS; const height = config.height || CONE_HEIGHT; const width = baseRadius * 2; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "equipment-element"); group.dataset.elementType = 'equipment'; group.dataset.equipmentType = config.toolId; group.dataset.elementName = config.label || "Cone"; const initialTranslateX = centerX - baseRadius; const initialTranslateY = centerY - height; group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`); group.dataset.rotation = "0"; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", "0"); bgRect.setAttribute("y", "0"); bgRect.setAttribute("width", String(width)); bgRect.setAttribute("height", String(height)); bgRect.setAttribute("fill", "transparent"); bgRect.setAttribute("stroke", "none"); group.appendChild(bgRect); const polygon = document.createElementNS(SVG_NS, "polygon"); polygon.setAttribute("points", `${baseRadius},0 ${width},${height} 0,${height}`); polygon.setAttribute("fill", config.fill || "red"); polygon.setAttribute("stroke", config.stroke || "black"); polygon.setAttribute("stroke-width", "1"); group.appendChild(polygon); ensureHandles(group, width, height, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Barrier Line element */
export function createLineElement(config, centerX, centerY) {
    const length = config.length || 100; const strokeWidth = config.strokeWidth || BARRIER_STROKE_WIDTH; const halfLength = length / 2; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "equipment-element"); group.dataset.elementType = 'equipment'; group.dataset.equipmentType = config.toolId; group.dataset.elementName = config.label || "Barrier Line"; group.setAttribute("transform", `translate(${centerX}, ${centerY})`); group.dataset.rotation = "0"; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", String(-halfLength)); bgRect.setAttribute("y", String(-strokeWidth / 2)); bgRect.setAttribute("width", String(length)); bgRect.setAttribute("height", String(strokeWidth)); bgRect.setAttribute("fill", "transparent"); bgRect.setAttribute("stroke", "none"); group.appendChild(bgRect); const line = document.createElementNS(SVG_NS, "line"); line.setAttribute("x1", String(-halfLength)); line.setAttribute("y1", "0"); line.setAttribute("x2", String(halfLength)); line.setAttribute("y2", "0"); line.setAttribute("stroke", config.stroke || "darkblue"); line.setAttribute("stroke-width", String(strokeWidth)); line.setAttribute("stroke-linecap", "round"); group.appendChild(line); ensureHandles(group, length, strokeWidth, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Barrier Corner element */
export function createCornerElement(config, centerX, centerY) {
    const radius = config.radius || BARRIER_CORNER_RADIUS; const strokeWidth = config.strokeWidth || BARRIER_STROKE_WIDTH; const effectiveRadius = radius - strokeWidth / 2; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "equipment-element"); group.dataset.elementType = 'equipment'; group.dataset.equipmentType = config.toolId; group.dataset.elementName = config.label || "Barrier Corner"; group.setAttribute("transform", `translate(${centerX}, ${centerY})`); group.dataset.rotation = "0"; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", "0"); bgRect.setAttribute("y", "0"); bgRect.setAttribute("width", String(radius)); bgRect.setAttribute("height", String(radius)); bgRect.setAttribute("fill", "transparent"); bgRect.setAttribute("stroke", "none"); group.appendChild(bgRect); const path = document.createElementNS(SVG_NS, "path"); const d = `M ${effectiveRadius} ${strokeWidth / 2} A ${effectiveRadius} ${effectiveRadius} 0 0 0 ${strokeWidth / 2} ${effectiveRadius}`; path.setAttribute("d", d); path.setAttribute("fill", "none"); path.setAttribute("stroke", config.stroke || "darkblue"); path.setAttribute("stroke-width", String(strokeWidth)); path.setAttribute("stroke-linecap", "round"); group.appendChild(path); ensureHandles(group, radius, radius, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates an Arrow element (Line with marker) */
export function createArrowElement(config, startX, startY, endX, endY) {
    const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "arrow-element"); group.dataset.elementType = config.category; group.dataset.arrowType = config.toolId; group.dataset.elementName = config.label || "Arrow"; group.setAttribute("transform", ""); group.dataset.rotation = "0"; const strokeWidth = config.strokeWidth || 2; const strokeColor = config.stroke || "black"; const markerId = config.markerEndId; if (config.isDoubleLine) { const angle = Math.atan2(endY - startY, endX - startX); const offset = strokeWidth * 1.5; const dx = Math.sin(angle) * offset / 2; const dy = -Math.cos(angle) * offset / 2; const line1 = document.createElementNS(SVG_NS, "line"); line1.setAttribute("x1", String(startX + dx)); line1.setAttribute("y1", String(startY + dy)); line1.setAttribute("x2", String(endX + dx)); line1.setAttribute("y2", String(endY + dy)); line1.setAttribute("stroke", strokeColor); line1.setAttribute("stroke-width", String(strokeWidth)); group.appendChild(line1); const line2 = document.createElementNS(SVG_NS, "line"); line2.setAttribute("x1", String(startX - dx)); line2.setAttribute("y1", String(startY - dy)); line2.setAttribute("x2", String(endX - dx)); line2.setAttribute("y2", String(endY - dy)); line2.setAttribute("stroke", strokeColor); line2.setAttribute("stroke-width", String(strokeWidth)); group.appendChild(line2); const centerLine = document.createElementNS(SVG_NS, "line"); centerLine.setAttribute("x1", String(startX)); centerLine.setAttribute("y1", String(startY)); centerLine.setAttribute("x2", String(endX)); centerLine.setAttribute("y2", String(endY)); centerLine.setAttribute("stroke", "none"); centerLine.setAttribute("fill", "none"); centerLine.setAttribute("stroke-width", "1"); centerLine.style.pointerEvents = "none"; if (markerId) { centerLine.setAttribute("marker-end", `url(#${markerId})`); } group.appendChild(centerLine); } else { const line = document.createElementNS(SVG_NS, "line"); line.setAttribute("x1", String(startX)); line.setAttribute("y1", String(startY)); line.setAttribute("x2", String(endX)); line.setAttribute("y2", String(endY)); line.setAttribute("stroke", strokeColor); line.setAttribute("stroke-width", String(strokeWidth)); if (config.strokeDasharray) { line.setAttribute("stroke-dasharray", config.strokeDasharray); } if (markerId) { line.setAttribute("marker-end", `url(#${markerId})`); } group.appendChild(line); } const width = Math.abs(startX - endX); const height = Math.abs(startY - endY); ensureHandles(group, width, height, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Number element */
export function createNumberElement(config, centerX, centerY) {
    const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "number-element"); group.dataset.elementType = 'number'; group.dataset.numberValue = config.text; group.dataset.elementName = config.label || "Number"; group.setAttribute("transform", `translate(${centerX}, ${centerY})`); group.dataset.rotation = "0"; const text = document.createElementNS(SVG_NS, "text"); text.setAttribute("x", "0"); text.setAttribute("y", "0"); text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central"); text.setAttribute("font-size", String(config.fontSize || NUMBER_FONT_SIZE)); text.setAttribute("font-weight", "bold"); text.setAttribute("fill", config.fill || "black"); text.style.pointerEvents = "none"; text.textContent = config.text; group.appendChild(text); const estimatedSize = (config.fontSize || NUMBER_FONT_SIZE) * 1.2; ensureHandles(group, estimatedSize, estimatedSize, false); makeElementInteractive(group); return group; // Ensure return
}
/** Creates a Text element */
export function createTextElement(config, x, y, content) {
    const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "text-element"); group.dataset.elementType = 'text'; group.dataset.elementName = "Text"; group.setAttribute("transform", `translate(${x}, ${y})`); group.dataset.rotation = "0"; const text = document.createElementNS(SVG_NS, "text"); text.setAttribute("x", "0"); text.setAttribute("y", "0"); text.setAttribute("text-anchor", "start"); text.setAttribute("dominant-baseline", "auto"); text.setAttribute("font-size", String(config.fontSize || TEXT_FONT_SIZE)); text.setAttribute("fill", config.fill || "black"); text.style.pointerEvents = "none"; text.textContent = content; if (content.includes('\n')) { text.textContent = ''; const lines = content.split('\n'); const lineHeight = (config.fontSize || TEXT_FONT_SIZE) * 1.2; lines.forEach((line, index) => { const tspan = document.createElementNS(SVG_NS, 'tspan'); tspan.setAttribute('x', '0'); tspan.setAttribute('dy', index === 0 ? '0' : `${lineHeight}`); tspan.textContent = line; text.appendChild(tspan); }); } group.appendChild(text); dom.svgCanvas.appendChild(group); let bbox = { width: MIN_ELEMENT_WIDTH, height: MIN_ELEMENT_HEIGHT, x: 0, y: 0 }; try { bbox = text.getBBox(); } catch (e) { console.warn("Could not get text BBox accurately"); } dom.svgCanvas.removeChild(group); const approxWidth = bbox.width || content.length * (config.fontSize || TEXT_FONT_SIZE) * 0.6; const approxHeight = bbox.height || (content.split('\n').length) * (config.fontSize || TEXT_FONT_SIZE) * 1.2; ensureHandles(group, approxWidth, approxHeight, false); makeElementInteractive(group); return group; // Ensure return
}
/** Simplifies a path using the Ramer-Douglas-Peucker algorithm. */
function simplifyPath(points, tolerance) { if (points.length <= 2) return points; const firstPoint = points[0]; const lastPoint = points[points.length - 1]; let index = -1; let maxDist = 0; for (let i = 1; i < points.length - 1; i++) { const dist = perpendicularDistance(points[i], firstPoint, lastPoint); if (dist > maxDist) { maxDist = dist; index = i; } } if (maxDist > tolerance) { const results1 = simplifyPath(points.slice(0, index + 1), tolerance); const results2 = simplifyPath(points.slice(index), tolerance); return results1.slice(0, -1).concat(results2); } else { return [firstPoint, lastPoint]; } }
/** Helper for simplifyPath: Calculates perpendicular distance */
function perpendicularDistance(p, p1, p2) { const dx = p2.x - p1.x; const dy = p2.y - p1.y; const lenSq = dx * dx + dy * dy; if (lenSq === 0) return Math.sqrt((p.x - p1.x)**2 + (p.y - p1.y)**2); let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lenSq; t = Math.max(0, Math.min(1, t)); const projX = p1.x + t * dx; const projY = p1.y + t * dy; return Math.sqrt((p.x - projX)**2 + (p.y - projY)**2); }
/** Generates an SVG path data string (d attribute) from points */
export function pointsToPathData(points) { if (!points || points.length === 0) return ""; let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`; for (let i = 1; i < points.length; i++) { d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`; } return d; }
/** Creates a Freehand Arrow element (Path with marker) */
export function createFreehandArrowElement(config, points) {
    if (!points || points.length < 2) return null; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "arrow-element", "freehand-arrow"); group.dataset.elementType = config.category; group.dataset.arrowType = config.toolId; group.dataset.elementName = config.label || "Freehand Arrow"; group.setAttribute("transform", ""); group.dataset.rotation = "0"; const simplifiedPoints = simplifyPath(points, FREEHAND_SIMPLIFICATION_TOLERANCE); const path = document.createElementNS(SVG_NS, "path"); const pathData = pointsToPathData(simplifiedPoints); path.setAttribute("d", pathData); path.setAttribute("stroke", config.stroke || "blue"); path.setAttribute("stroke-width", String(config.strokeWidth || ARROW_STROKE_WIDTH_RUN)); path.setAttribute("fill", "none"); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round"); if (config.strokeDasharray) { path.setAttribute("stroke-dasharray", config.strokeDasharray); } if (config.markerEndId) { path.setAttribute("marker-end", `url(#${config.markerEndId})`); } group.appendChild(path); let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; simplifiedPoints.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }); const width = Math.max(maxX - minX, MIN_ELEMENT_WIDTH); const height = Math.max(maxY - minY, MIN_ELEMENT_HEIGHT); ensureHandles(group, width, height, false); makeElementInteractive(group); return group; // Ensure return
}


// --- End New Creation Functions ---


/** Ensures the correct handles and data attributes are present on an element. */
export function ensureHandles(element, currentWidth, currentHeight, isPlayer = false) {
    if (!element) return;

    const transformList = element.transform.baseVal;
    const elementType = element.dataset.elementType;
    const hasBgRect = !!element.querySelector('.element-bg');

    const width = currentWidth ?? (hasBgRect ? parseFloat(element.querySelector('.element-bg').getAttribute('width')) : MIN_ELEMENT_WIDTH);
    const height = currentHeight ?? (hasBgRect ? parseFloat(element.querySelector('.element-bg').getAttribute('height')) : MIN_ELEMENT_HEIGHT);

    let currentRotation = 0;
    const allowRotation = elementType !== 'player' && elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot';

    if (allowRotation) {
        let rotateTransform = null;
        for (let i = 0; i < transformList.numberOfItems; i++) { const item = transformList.getItem(i); if (item.type === SVGTransform.SVG_TRANSFORM_ROTATE) { rotateTransform = item; currentRotation = rotateTransform.angle; break; } }
        element.dataset.rotation = String(currentRotation % 360);
    } else {
        element.dataset.rotation = "0";
    }

    element.querySelector('.resize-handle')?.remove();
    element.querySelector('.rotate-handle')?.remove();
    element.classList.remove('collision-indicator');

    updateElementVisualSelection(element, appState.selectedElements.has(element));
}
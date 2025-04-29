//***** js/elements.js ******

// js/elements.js
import {
    MIN_ELEMENT_HEIGHT, MIN_ELEMENT_WIDTH, MOVE_HANDLE_HEIGHT, MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_WIDTH_PERCENT, PLAYER_DIAMETER, PLAYER_RADIUS, SVG_NS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS,
    // Use unified constants
    ARROW_STROKE_WIDTH_UNIFIED, MARKER_ARROW_UNIFIED_ID, ARROW_COLOR,
    ARROW_DASH_RUN,
    NUMBER_FONT_SIZE, TEXT_FONT_SIZE,
    PLACEMENT_GAP, TITLE_PADDING,
    FREEHAND_SIMPLIFICATION_TOLERANCE,
    DEFAULT_SHAPE_SIZE, DEFAULT_SHAPE_STROKE_WIDTH, DEFAULT_SHAPE_FILL_COLOR, ARROW_MARKER_SIZE_UNIFIED, SHOT_ARROW_SIZE
} from './config.js';
import {dom} from './dom.js';
import {appState} from './state.js';
import {makeElementInteractive} from './interactions.js';
import {updateElementVisualSelection} from './selection.js';
import {getTransformedBBox, getOrAddTransform} from './utils.js';


/** Creates a generic canvas element (Activities, Library) */
export function createCanvasElement(config, centerX, centerY) {
    config = config || {};
    const width = Math.max(MIN_ELEMENT_WIDTH, config.width || MIN_ELEMENT_WIDTH);
    const height = Math.max(MIN_ELEMENT_HEIGHT, config.height || MIN_ELEMENT_HEIGHT);
    const title = config.title || config.name || "Element";
    const description = config.description || "";
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element");
    group.dataset.elementType = config.type;
    group.dataset.elementTitle = title;
    group.dataset.elementDescription = description;
    const initialTitleX = TITLE_PADDING;
    const initialTitleY = TITLE_PADDING + 12;
    group.dataset.titleOffsetX = String(initialTitleX);
    group.dataset.titleOffsetY = String(initialTitleY);
    if (config.id && config.type === 'activity') group.dataset.activityId = String(config.id);
    if (config.name) group.dataset.elementName = config.name;
    const initialTranslateX = centerX - width / 2;
    const initialTranslateY = centerY - height / 2;
    group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`);
    group.dataset.rotation = "0";
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "element-bg");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("rx", "10");
    rect.setAttribute("ry", "10");
    rect.setAttribute("fill", "lightyellow");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "1");
    group.appendChild(rect);
    const titleText = document.createElementNS(SVG_NS, "text");
    titleText.setAttribute("x", String(initialTitleX));
    titleText.setAttribute("y", String(initialTitleY));
    titleText.setAttribute("font-size", "12");
    titleText.setAttribute("fill", "black");
    titleText.setAttribute("class", "element-label draggable-title");
    titleText.style.cursor = "grab";
    titleText.textContent = title;
    group.appendChild(titleText);
    const contentPaddingX = 10;
    const contentStartY = initialTitleY + 5;
    const availableContentWidth = Math.max(0, width - 2 * contentPaddingX);
    const availableContentHeight = Math.max(0, height - contentStartY - 10);
    if (availableContentWidth > 0 && availableContentHeight > 0 && config.svgContent) {
        if (config.type === 'activity') {
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(config.svgContent, "image/svg+xml");
                const innerSvgElement = svgDoc.documentElement;
                if (innerSvgElement && innerSvgElement.nodeName === 'svg') {
                    const svgContainer = document.createElementNS(SVG_NS, "svg");
                    svgContainer.setAttribute("x", String(contentPaddingX));
                    svgContainer.setAttribute("y", String(contentStartY));
                    svgContainer.setAttribute("width", String(availableContentWidth));
                    svgContainer.setAttribute("height", String(availableContentHeight));
                    svgContainer.setAttribute("preserveAspectRatio", "xMidYMid meet");
                    if (innerSvgElement.hasAttribute('viewBox')) {
                        svgContainer.setAttribute("viewBox", innerSvgElement.getAttribute('viewBox'));
                    } else {
                        const innerW = innerSvgElement.getAttribute('width') || '40';
                        const innerH = innerSvgElement.getAttribute('height') || '40';
                        svgContainer.setAttribute("viewBox", `0 0 ${innerW} ${innerH}`);
                    }
                    while (innerSvgElement.firstChild) {
                        svgContainer.appendChild(document.importNode(innerSvgElement.firstChild, true));
                    }
                    svgContainer.style.pointerEvents = "none";
                    group.appendChild(svgContainer);
                }
            } catch (e) {
                console.error("Error creating activity SVG container:", e);
            }
        } else if (config.type === 'library') {
            try {
                const foreignObject = document.createElementNS(SVG_NS, "foreignObject");
                foreignObject.setAttribute("x", String(contentPaddingX));
                foreignObject.setAttribute("y", String(contentStartY));
                foreignObject.setAttribute("width", String(availableContentWidth));
                foreignObject.setAttribute("height", String(availableContentHeight));
                foreignObject.style.pointerEvents = "none";
                foreignObject.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; overflow:hidden; display:flex; align-items:center; justify-content:center; pointer-events: none;">${config.svgContent}</div>`;
                const innerSvg = foreignObject.querySelector('svg');
                if (innerSvg) {
                    innerSvg.style.width = '100%';
                    innerSvg.style.height = '100%';
                    innerSvg.style.display = 'block';
                    innerSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    innerSvg.style.pointerEvents = 'none';
                }
                group.appendChild(foreignObject);
            } catch (e) {
                console.error("Error creating library foreignObject:", e);
            }
        }
    }
    ensureHandles(group, width, height, false);
    makeElementInteractive(group);
    return group;
}

// --- Player Element ---
export function createPlayerElement(config, centerX, centerY) {
    const radius = config.radius || PLAYER_RADIUS;
    const diameter = radius * 2;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "player-element");
    group.dataset.elementType = 'player';
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    group.dataset.rotation = "0";
    group.dataset.playerType = config.toolId;
    group.dataset.elementName = config.label || "Player";
    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", String(-radius));
    bgRect.setAttribute("y", String(-radius));
    bgRect.setAttribute("width", String(diameter));
    bgRect.setAttribute("height", String(diameter));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", config.fill === 'none' ? 'white' : config.fill || "black");
    circle.setAttribute("stroke", config.stroke || "black");
    circle.setAttribute("stroke-width", "1");
    group.appendChild(circle);
    if (config.text) {
        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", "0");
        text.setAttribute("y", "0");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("fill", config.textColor || "white");
        text.setAttribute("font-size", "10");
        text.setAttribute("font-weight", "bold");
        text.style.pointerEvents = "none";
        text.textContent = config.text;
        group.appendChild(text);
    }
    ensureHandles(group, diameter, diameter, true);
    makeElementInteractive(group);
    return group;
}

// --- Equipment Elements ---
export function createBallElement(config, centerX, centerY) {
    const radius = config.radius || BALL_RADIUS;
    const diameter = radius * 2;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "equipment-element");
    group.dataset.elementType = 'equipment';
    group.dataset.equipmentType = config.toolId;
    group.dataset.elementName = config.label || "Ball";
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    group.dataset.rotation = "0";
    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", String(-radius));
    bgRect.setAttribute("y", String(-radius));
    bgRect.setAttribute("width", String(diameter));
    bgRect.setAttribute("height", String(diameter));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", config.fill || "white");
    circle.setAttribute("stroke", config.stroke || "black");
    circle.setAttribute("stroke-width", "1");
    group.appendChild(circle);
    ensureHandles(group, diameter, diameter, false);
    makeElementInteractive(group);
    return group;
}

export function createManyBallsElement(config, centerX, centerY) {
    const radius = config.radius || BALL_RADIUS;
    const diameter = radius * 2;
    const numBalls = Math.floor(Math.random() * 5) + 3;
    const spreadFactor = radius * 5;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "equipment-element");
    group.dataset.elementType = 'equipment';
    group.dataset.equipmentType = config.toolId;
    group.dataset.elementName = config.label || "ManyBalls";
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    group.dataset.rotation = "0";
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < numBalls; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spreadFactor;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        minX = Math.min(minX, x - radius);
        maxX = Math.max(maxX, x + radius);
        minY = Math.min(minY, y - radius);
        maxY = Math.max(maxY, y + radius);
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", String(radius));
        circle.setAttribute("fill", config.fill || "orange");
        circle.setAttribute("stroke", config.stroke || "black");
        circle.setAttribute("stroke-width", "1");
        group.appendChild(circle);
    }
    const bgX = minX;
    const bgY = minY;
    const bgWidth = maxX - minX;
    const bgHeight = maxY - minY;
    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", String(bgX));
    bgRect.setAttribute("y", String(bgY));
    bgRect.setAttribute("width", String(bgWidth));
    bgRect.setAttribute("height", String(bgHeight));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);
    ensureHandles(group, bgWidth, bgHeight, false);
    makeElementInteractive(group);
    return group;
}

export function createGateElement(config, centerX, centerY) {
    const width = config.width || GATE_WIDTH;
    const height = config.height || GATE_HEIGHT;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "equipment-element");
    group.dataset.elementType = 'equipment';
    group.dataset.equipmentType = config.toolId;
    group.dataset.elementName = config.label || "Gate";
    const initialTranslateX = centerX - width / 2;
    const initialTranslateY = centerY - height / 2;
    group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`);
    group.dataset.rotation = "0";
    const gateRect = document.createElementNS(SVG_NS, "rect");
    gateRect.setAttribute("class", "element-bg");
    gateRect.setAttribute("x", "0");
    gateRect.setAttribute("y", "0");
    gateRect.setAttribute("width", String(width));
    gateRect.setAttribute("height", String(height));
    gateRect.setAttribute("stroke", config.stroke || "black");
    gateRect.setAttribute("stroke-width", "1");
    gateRect.setAttribute("fill", "url(#diamondNet)");    
    group.appendChild(gateRect);
    ensureHandles(group, width, height, false);
    makeElementInteractive(group);
    return group;
}

export function createConeElement(config, centerX, centerY) {
    const baseRadius = config.radius || CONE_RADIUS;
    const height = config.height || CONE_HEIGHT;
    const width = baseRadius * 2;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "equipment-element");
    group.dataset.elementType = 'equipment';
    group.dataset.equipmentType = config.toolId;
    group.dataset.elementName = config.label || "Cone";
    const initialTranslateX = centerX - baseRadius;
    const initialTranslateY = centerY - height;
    group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`);
    group.dataset.rotation = "0";
    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", "0");
    bgRect.setAttribute("y", "0");
    bgRect.setAttribute("width", String(width));
    bgRect.setAttribute("height", String(height));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);
    const polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", `${baseRadius},0 ${width},${height} 0,${height}`);
    polygon.setAttribute("fill", config.fill || "red");
    polygon.setAttribute("stroke", config.stroke || "black");
    polygon.setAttribute("stroke-width", "1");
    group.appendChild(polygon);
    ensureHandles(group, width, height, false);
    makeElementInteractive(group);
    return group;
}

export function createLineElement(config, centerX, centerY) {
    const length = config.length || 100;
    const strokeWidth = config.strokeWidth || BARRIER_STROKE_WIDTH;
    const halfLength = length / 2;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "equipment-element");
    group.dataset.elementType = 'equipment';
    group.dataset.equipmentType = config.toolId;
    group.dataset.elementName = config.label || "Barrier Line";
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    group.dataset.rotation = "0";
    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", String(-halfLength));
    bgRect.setAttribute("y", String(-strokeWidth / 2));
    bgRect.setAttribute("width", String(length));
    bgRect.setAttribute("height", String(strokeWidth));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(-halfLength));
    line.setAttribute("y1", "0");
    line.setAttribute("x2", String(halfLength));
    line.setAttribute("y2", "0");
    line.setAttribute("stroke", config.stroke || "darkblue");
    line.setAttribute("stroke-width", String(strokeWidth));
    line.setAttribute("stroke-linecap", "round");
    group.appendChild(line);
    ensureHandles(group, length, strokeWidth, false);
    makeElementInteractive(group);
    return group;
}

export function createCornerElement(config, centerX, centerY) {
    const radius = config.radius || BARRIER_CORNER_RADIUS;
    const strokeWidth = config.strokeWidth || BARRIER_STROKE_WIDTH;
    const effectiveRadius = radius - strokeWidth / 2;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "equipment-element");
    group.dataset.elementType = 'equipment';
    group.dataset.equipmentType = config.toolId;
    group.dataset.elementName = config.label || "Barrier Corner";
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    group.dataset.rotation = "0";
    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", "0");
    bgRect.setAttribute("y", "0");
    bgRect.setAttribute("width", String(radius));
    bgRect.setAttribute("height", String(radius));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);
    const path = document.createElementNS(SVG_NS, "path");
    const d = `M ${effectiveRadius} ${strokeWidth / 2} A ${effectiveRadius} ${effectiveRadius} 0 0 0 ${strokeWidth / 2} ${effectiveRadius}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", config.stroke || "darkblue");
    path.setAttribute("stroke-width", String(strokeWidth));
    path.setAttribute("stroke-linecap", "round");
    group.appendChild(path);
    ensureHandles(group, radius, radius, false);
    makeElementInteractive(group);
    return group;
}

// --- Arrow Elements (UPDATED) ---
export function createArrowElement(config, startX, startY, endX, endY) {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "arrow-element");
    group.dataset.elementType = config.category;
    group.dataset.arrowType = config.toolId;
    group.dataset.elementName = config.label || "Arrow";
    group.setAttribute("transform", "");
    group.dataset.rotation = "0";

    // *** Use strokeWidth directly from config ***
    const strokeWidth = config.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
    const strokeColor = config.stroke || ARROW_COLOR;
    const markerId = config.markerEndId; 

    if (config.isDoubleLine) { // Shot
        const angle = Math.atan2(endY - startY, endX - startX);
        const offset = strokeWidth * 2.5; // Visual separation remains based on actual strokeWidth
        const dx = Math.sin(angle) * offset / 2;
        const dy = -Math.cos(angle) * offset / 2;

        const line1 = document.createElementNS(SVG_NS, "line");
        line1.setAttribute("x1", String(startX + dx));
        line1.setAttribute("y1", String(startY + dy));
        line1.setAttribute("x2", String(endX + dx));
        line1.setAttribute("y2", String(endY + dy));
        line1.setAttribute("stroke", strokeColor);
        // *** Set stroke-width explicitly from config ***
        line1.setAttribute("stroke-width", String(strokeWidth));
        
        group.appendChild(line1);

        const line2 = document.createElementNS(SVG_NS, "line");
        line2.setAttribute("x1", String(startX - dx));
        line2.setAttribute("y1", String(startY - dy));
        line2.setAttribute("x2", String(endX - dx));
        line2.setAttribute("y2", String(endY - dy));
        line2.setAttribute("stroke", strokeColor);
        // *** Set stroke-width explicitly from config ***
        line2.setAttribute("stroke-width", String(strokeWidth));
        
        group.appendChild(line2);

        const line3 = document.createElementNS(SVG_NS, "line");
        line3.setAttribute("x1", String(startX));
        line3.setAttribute("y1", String(startY));
        line3.setAttribute("x2", String(endX));
        line3.setAttribute("y2", String(endY));
        line3.setAttribute("stroke", "none");
        // *** Set stroke-width explicitly from config ***
        line3.setAttribute("stroke-width", String(strokeWidth));
        if (markerId) {
            const markerEnd = document.getElementById(markerId);
            markerEnd.setAttribute("markerWidth", String(SHOT_ARROW_SIZE));
            markerEnd.setAttribute("markerHeight", String(SHOT_ARROW_SIZE));
            line3.setAttribute("marker-end", `url(#${markerId})`);
        }
        group.appendChild(line3);

    } else { // Pass or Run (Straight)
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", String(startX));
        line.setAttribute("y1", String(startY));
        line.setAttribute("x2", String(endX));
        line.setAttribute("y2", String(endY));
        line.setAttribute("stroke", strokeColor);
        // *** Set stroke-width explicitly from config ***
        line.setAttribute("stroke-width", String(strokeWidth));
        line.style.pointerEvents = "stroke";
        line.style.strokeWidth = strokeWidth; // Keep larger click area

        if (config.strokeDasharray) {
            line.setAttribute("stroke-dasharray", config.strokeDasharray);
        }
        if (markerId) {
            line.setAttribute("marker-end", `url(#${markerId})`);
        }
        group.appendChild(line);
    }

    const width = Math.abs(startX - endX);
    const height = Math.abs(startY - endY);
    ensureHandles(group, width, height, false);
    makeElementInteractive(group);
    return group;
}

// --- Freehand Arrow Element (UPDATED) ---
function simplifyPath(points, tolerance) {
    if (points.length <= 2) return points;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    let index = -1;
    let maxDist = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], firstPoint, lastPoint);
        if (dist > maxDist) {
            maxDist = dist;
            index = i;
        }
    }
    if (maxDist > tolerance) {
        const results1 = simplifyPath(points.slice(0, index + 1), tolerance);
        const results2 = simplifyPath(points.slice(index), tolerance);
        return results1.slice(0, -1).concat(results2);
    } else {
        return [firstPoint, lastPoint];
    }
}

function perpendicularDistance(p, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
    let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

export function pointsToPathData(points) {
    if (!points || points.length === 0) return "";
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    return d;
}

export function createFreehandArrowElement(config, points) {
    if (!points || points.length < 2) return null;
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "arrow-element", "freehand-arrow");
    group.dataset.elementType = config.category;
    group.dataset.arrowType = config.toolId;
    group.dataset.elementName = config.label || "Freehand Arrow";
    group.setAttribute("transform", "");
    group.dataset.rotation = "0";

    // *** Use strokeWidth directly from config ***
    const strokeWidth = config.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
    const markerId = config.markerEndId; // Should be MARKER_ARROW_UNIFIED_ID

    const simplifiedPoints = simplifyPath(points, FREEHAND_SIMPLIFICATION_TOLERANCE);
    const path = document.createElementNS(SVG_NS, "path");
    const pathData = pointsToPathData(simplifiedPoints);
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", config.stroke || ARROW_COLOR);
    // *** Set stroke-width explicitly from config ***
    path.setAttribute("stroke-width", String(strokeWidth));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.style.pointerEvents = "stroke";
    path.style.strokeWidth = strokeWidth; // Keep larger click area

    if (config.strokeDasharray) { // Apply dash for runs
        path.setAttribute("stroke-dasharray", config.strokeDasharray);
    }
    if (markerId) {
        path.setAttribute("marker-end", `url(#${markerId})`);
    }
    group.appendChild(path);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    simplifiedPoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    });
    const width = Math.max(maxX - minX, MIN_ELEMENT_WIDTH);
    const height = Math.max(maxY - minY, MIN_ELEMENT_HEIGHT);

    ensureHandles(group, width, height, false);
    makeElementInteractive(group);
    return group;
}

// --- Number & Text Elements --- (Keep unchanged)
export function createNumberElement(config, centerX, centerY) {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "number-element");
    group.dataset.elementType = 'number';
    group.dataset.numberValue = config.text;
    group.dataset.elementName = config.label || "Number";
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    group.dataset.rotation = "0";
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "0");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("font-size", String(config.fontSize || NUMBER_FONT_SIZE));
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", config.fill || "black");
    text.textContent = config.text;
    group.appendChild(text);
    const estimatedSize = (config.fontSize || NUMBER_FONT_SIZE) * 1.2;
    ensureHandles(group, estimatedSize, estimatedSize, false);
    makeElementInteractive(group);
    return group;
}

export function createTextElement(config, x, y, content) {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "text-element");
    group.dataset.elementType = 'text';
    group.dataset.elementName = "Text";
    group.setAttribute("transform", `translate(${x}, ${y})`);
    group.dataset.rotation = "0";
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "0");
    text.setAttribute("text-anchor", "start");
    text.setAttribute("dominant-baseline", "auto");
    text.setAttribute("font-size", String(config.fontSize || TEXT_FONT_SIZE));
    text.setAttribute("fill", config.fill || "black");
    text.textContent = content;
    if (content.includes('\n')) {
        text.textContent = '';
        const lines = content.split('\n');
        const lineHeight = (config.fontSize || TEXT_FONT_SIZE) * 1.2;
        lines.forEach((line, index) => {
            const tspan = document.createElementNS(SVG_NS, 'tspan');
            tspan.setAttribute('x', '0');
            tspan.setAttribute('dy', index === 0 ? '0' : `${lineHeight}`);
            tspan.textContent = line || ' ';
            text.appendChild(tspan);
        });
    }
    group.appendChild(text);
    dom.svgCanvas.appendChild(group);
    let bbox = {width: MIN_ELEMENT_WIDTH, height: MIN_ELEMENT_HEIGHT, x: 0, y: 0};
    try {
        bbox = text.getBBox();
    } catch (e) {
        console.warn("Could not get text BBox accurately");
    }
    dom.svgCanvas.removeChild(group);
    const approxWidth = bbox.width || content.length * (config.fontSize || TEXT_FONT_SIZE) * 0.6;
    const approxHeight = bbox.height || (content.split('\n').length) * (config.fontSize || TEXT_FONT_SIZE) * 1.2;
    ensureHandles(group, approxWidth, approxHeight, false);
    makeElementInteractive(group);
    return group;
}

// --- Shape Element --- (Keep unchanged)
export function createShapeElement(config, params) {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "shape-element");
    group.dataset.elementType = 'shape';
    group.dataset.shapeType = config.shapeType;
    group.dataset.elementName = config.label || "Shape";
    group.dataset.isFilled = String(config.isFilled);
    const isFilled = config.isFilled;
    const strokeColor = appState.selectedColor;
    let fillColor = "none";
    let fillOpacity = "1";
    if (isFilled) {
        fillColor = appState.selectedColor;
        fillOpacity = "0.6";
    }
    const strokeWidth = DEFAULT_SHAPE_STROKE_WIDTH;
    let shapeSvg;
    let finalWidth = 0, finalHeight = 0, finalX = 0, finalY = 0;
    switch (config.shapeType) {
        case 'rectangle':
        case 'square':
            finalWidth = params.width;
            finalHeight = params.height;
            finalX = params.x;
            finalY = params.y;
            shapeSvg = document.createElementNS(SVG_NS, "rect");
            shapeSvg.setAttribute("x", String(finalX));
            shapeSvg.setAttribute("y", String(finalY));
            shapeSvg.setAttribute("width", String(finalWidth));
            shapeSvg.setAttribute("height", String(finalHeight));
            shapeSvg.setAttribute("rx", "2");
            shapeSvg.setAttribute("ry", "2");
            break;
        case 'circle':
            finalWidth = params.radius * 2;
            finalHeight = params.radius * 2;
            finalX = params.cx - params.radius;
            finalY = params.cy - params.radius;
            shapeSvg = document.createElementNS(SVG_NS, "circle");
            shapeSvg.setAttribute("cx", String(params.cx));
            shapeSvg.setAttribute("cy", String(params.cy));
            shapeSvg.setAttribute("r", String(params.radius));
            break;
        case 'triangle':
            shapeSvg = document.createElementNS(SVG_NS, "polygon");
            shapeSvg.setAttribute("points", params.points);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            params.points.split(' ').forEach(pair => {
                const coords = pair.split(',');
                if (coords.length === 2) {
                    const x = parseFloat(coords[0]);
                    const y = parseFloat(coords[1]);
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            });
            if (isFinite(minX)) {
                finalX = minX;
                finalY = minY;
                finalWidth = maxX - minX;
                finalHeight = maxY - minY;
            } else {
                finalX = 0;
                finalY = 0;
                finalWidth = MIN_ELEMENT_WIDTH;
                finalHeight = MIN_ELEMENT_HEIGHT;
            }
            break;
        default:
            console.error("Unknown shapeType for creation:", config.shapeType);
            return null;
    }
    shapeSvg.setAttribute("fill", fillColor);
    shapeSvg.setAttribute("stroke", strokeColor);
    shapeSvg.setAttribute("stroke-width", String(strokeWidth));
    if (isFilled) {
        shapeSvg.setAttribute("fill-opacity", fillOpacity);
    }
    group.appendChild(shapeSvg);
    group.setAttribute("transform", "");
    group.dataset.rotation = "0";
    ensureHandles(group, finalWidth, finalHeight, false);
    makeElementInteractive(group);
    return group;
}

// --- Basic Line Element --- (Keep unchanged)
export function createBasicLineElement(config, startX, startY, endX, endY) {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "line-element");
    group.dataset.elementType = 'line';
    group.dataset.lineType = config.toolId;
    group.dataset.elementName = config.label || "Line";
    group.setAttribute("transform", "");
    group.dataset.rotation = "0";
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(startX));
    line.setAttribute("y1", String(startY));
    line.setAttribute("x2", String(endX));
    line.setAttribute("y2", String(endY));
    line.setAttribute("stroke", appState.selectedColor);
    line.setAttribute("stroke-width", String(config.strokeWidth));
    line.setAttribute("stroke-linecap", "round");
    line.style.pointerEvents = "stroke";
    line.style.strokeWidth = config.strokeWidth * 3 + 6;
    group.appendChild(line);
    const width = Math.abs(startX - endX);
    const height = Math.abs(startY - endY);
    ensureHandles(group, width, height, false);
    makeElementInteractive(group);
    return group;
}

// --- Utility: ensureHandles --- (Keep unchanged)
export function ensureHandles(element, currentWidth, currentHeight, isPlayer = false) {
    if (!element) return;
    const transformList = element.transform.baseVal;
    const elementType = element.dataset.elementType;
    const bgRect = element.querySelector(':scope > .element-bg');
    const primaryVisual = bgRect || element.querySelector('circle, rect, path, line, polygon');
    let width = 0, height = 0, relX = 0, relY = 0;
    let absX = 0, absY = 0;
    let hasGroupTransform = true;
    const transformAttr = element.getAttribute("transform");
    if (!transformAttr || transformAttr.trim() === "") {
        hasGroupTransform = false;
    }
    if (primaryVisual && primaryVisual.getBBox) {
        try {
            const bbox = primaryVisual.getBBox();
            width = bbox.width;
            height = bbox.height;
            if (hasGroupTransform) {
                relX = bbox.x;
                relY = bbox.y;
            } else {
                absX = bbox.x;
                absY = bbox.y;
                relX = 0;
                relY = 0;
            }
        } catch (e) {
            console.warn("Error getting BBox in ensureHandles:", e, element);
            width = currentWidth ?? MIN_ELEMENT_WIDTH;
            height = currentHeight ?? MIN_ELEMENT_HEIGHT;
            relX = 0;
            relY = 0;
            absX = 0;
            absY = 0;
        }
    } else {
        width = currentWidth ?? MIN_ELEMENT_WIDTH;
        height = currentHeight ?? MIN_ELEMENT_HEIGHT;
        relX = 0;
        relY = 0;
        absX = 0;
        absY = 0;
    }
    let currentRotation = parseFloat(element.dataset.rotation || "0");
    const allowRotation = !['player', 'number', 'text', 'shape', 'line', 'movement', 'passShot'].includes(elementType);
    if (!allowRotation && currentRotation !== 0) {
        currentRotation = 0;
        element.dataset.rotation = "0";
    }
    let parentRotateTransform = null;
    for (let i = transformList.numberOfItems - 1; i >= 0; i--) {
        if (transformList.getItem(i).type === SVGTransform.SVG_TRANSFORM_ROTATE) {
            parentRotateTransform = transformList.getItem(i);
            break;
        }
    }
    if (allowRotation) {
        const parentRotateCenterX = hasGroupTransform ? (relX + width / 2) : (absX + width / 2);
        const parentRotateCenterY = hasGroupTransform ? (relY + height / 2) : (absY + height / 2);
        if (!parentRotateTransform) {
            parentRotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, parentRotateCenterX, parentRotateCenterY);
        }
        if (parentRotateTransform.angle !== currentRotation) {
            parentRotateTransform.setRotate(currentRotation, parentRotateCenterX, parentRotateCenterY);
        }
    } else if (parentRotateTransform) {
        transformList.removeItem(transformList.getIndex(parentRotateTransform));
    }
    const titleText = element.querySelector('.element-label.draggable-title');
    if (titleText) {
        const titleX = parseFloat(element.dataset.titleOffsetX || String(TITLE_PADDING));
        const titleY = parseFloat(element.dataset.titleOffsetY || String(TITLE_PADDING + 12));
        titleText.setAttribute("x", String(titleX));
        titleText.setAttribute("y", String(titleY));
        if (hasGroupTransform) {
            const titleTransformList = titleText.transform.baseVal;
            const titleRotateCenterX = (relX + width / 2) - titleX;
            const titleRotateCenterY = (relY + height / 2) - titleY;
            let titleRotateTransform = null;
            for (let i = 0; i < titleTransformList.numberOfItems; ++i) {
                if (titleTransformList.getItem(i).type === SVGTransform.SVG_TRANSFORM_ROTATE) {
                    titleRotateTransform = titleTransformList.getItem(i);
                    break;
                }
            }
            if (currentRotation !== 0) {
                if (!titleRotateTransform) {
                    titleRotateTransform = getOrAddTransform(titleTransformList, SVGTransform.SVG_TRANSFORM_ROTATE, titleRotateCenterX, titleRotateCenterY);
                }
                titleRotateTransform.setRotate(-currentRotation, titleRotateCenterX, titleRotateCenterY);
            } else if (titleRotateTransform) {
                titleTransformList.removeItem(titleTransformList.getIndex(titleRotateTransform));
            }
        }
    }
    element.classList.remove('collision-indicator');
    let outline = element.querySelector(':scope > .selected-outline');
    if (appState.selectedElements.has(element)) {
        if (!outline) {
            outline = document.createElementNS(SVG_NS, 'rect');
            outline.setAttribute('class', 'selected-outline');
            const insertBeforeTarget = primaryVisual || element.firstChild;
            if (insertBeforeTarget) element.insertBefore(outline, insertBeforeTarget); else element.appendChild(outline);
        }
        const outlinePadding = PLACEMENT_GAP / 2;
        const cornerRadius = '5';
        outline.setAttribute('x', String((hasGroupTransform ? relX : absX) - outlinePadding));
        outline.setAttribute('y', String((hasGroupTransform ? relY : absY) - outlinePadding));
        outline.setAttribute('width', String(width + (outlinePadding * 2)));
        outline.setAttribute('height', String(height + (outlinePadding * 2)));
        outline.setAttribute('rx', cornerRadius);
        outline.setAttribute('ry', cornerRadius);
        outline.setAttribute('visibility', 'visible');
        element.classList.add('selected');
    } else {
        outline?.remove();
        element.classList.remove('selected');
    }
}
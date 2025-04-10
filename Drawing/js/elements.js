// js/elements.js
import {
    MIN_ELEMENT_HEIGHT, MIN_ELEMENT_WIDTH, MOVE_HANDLE_HEIGHT, MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_WIDTH_PERCENT, PLAYER_DIAMETER, PLAYER_RADIUS, SVG_NS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, ARROW_STROKE_WIDTH_PASS, ARROW_STROKE_WIDTH_RUN,
    ARROW_STROKE_WIDTH_SHOT, ARROW_DASH_RUN, MARKER_ARROW_PASS_ID,
    MARKER_ARROW_RUN_ID, MARKER_ARROW_SHOT_ID, NUMBER_FONT_SIZE, TEXT_FONT_SIZE
} from './config.js';
import { dom } from './dom.js';
import { appState } from './state.js';
import { makeElementInteractive } from './interactions.js';
import { updateElementVisualSelection } from './selection.js';
import { getTransformedBBox } from './utils.js';


/** Creates a generic canvas element (Activities, Library) */
export function createCanvasElement(config, centerX, centerY) {
    // ... (implementation remains the same) ...
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

    group.dataset.elementType = config.type; // 'activity' or 'library'

    if (config.id) group.dataset.activityId = String(config.id);
    if (config.name) group.dataset.elementName = name;

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "element-bg"); // Keep for these types
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("rx", "10");
    rect.setAttribute("ry", "10");
    rect.setAttribute("fill", "lightyellow");
    rect.setAttribute("stroke", "black");
    group.appendChild(rect);

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "10");
    text.setAttribute("y", "20");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "black");
    text.setAttribute("class", "element-label");
    text.style.pointerEvents = "none";
    text.textContent = name;
    group.appendChild(text);

    const contentPaddingX = 10;
    const contentPaddingY = 30;
    const availableContentWidth = Math.max(0, width - 2 * contentPaddingX);
    const availableContentHeight = Math.max(0, height - contentPaddingY - 10);

    if (availableContentWidth > 0 && availableContentHeight > 0 && config.svgContent) {
        if (config.type === 'activity') {
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(config.svgContent, "image/svg+xml");
                const innerSvgElement = svgDoc.documentElement;

                if (innerSvgElement && innerSvgElement.nodeName === 'svg') {
                    const svgContainer = document.createElementNS(SVG_NS, "svg");
                    svgContainer.setAttribute("x", String(contentPaddingX));
                    svgContainer.setAttribute("y", String(contentPaddingY));
                    svgContainer.setAttribute("width", String(availableContentWidth));
                    svgContainer.setAttribute("height", String(availableContentHeight));
                    svgContainer.setAttribute("preserveAspectRatio", "xMidYMid meet");

                    if (!innerSvgElement.getAttribute('viewBox')) {
                        const innerW = innerSvgElement.getAttribute('width') || '40';
                        const innerH = innerSvgElement.getAttribute('height') || '40';
                        svgContainer.setAttribute("viewBox", `0 0 ${innerW} ${innerH}`);
                    } else {
                        svgContainer.setAttribute("viewBox", innerSvgElement.getAttribute('viewBox'));
                    }
                    while (innerSvgElement.firstChild) {
                        svgContainer.appendChild(document.importNode(innerSvgElement.firstChild, true));
                    }
                    svgContainer.style.pointerEvents = "none";
                    group.appendChild(svgContainer);
                }
            } catch(e) { console.error("Error creating activity SVG container:", e); }

        } else if (config.type === 'library') {
            try {
                const foreignObject = document.createElementNS(SVG_NS, "foreignObject");
                foreignObject.setAttribute("x", String(contentPaddingX));
                foreignObject.setAttribute("y", String(contentPaddingY));
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
            } catch(e) { console.error("Error creating library foreignObject:", e); }
        }
    }

    ensureHandles(group, width, height, false);
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

/** Creates a player element */
export function createPlayerElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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
    bgRect.setAttribute("class", "element-bg"); // Keep for players
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
    circle.setAttribute("fill", config.fill || "black");
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

    ensureHandles(group, diameter, diameter, true); // isPlayer = true
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

// --- Equipment Creation Functions ---

/** Creates a Ball element */
export function createBallElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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
    bgRect.setAttribute("class", "element-bg"); // Keep for equipment
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
    circle.setAttribute("fill", config.fill || "orange");
    circle.setAttribute("stroke", config.stroke || "black");
    circle.setAttribute("stroke-width", "1");
    group.appendChild(circle);

    ensureHandles(group, diameter, diameter, false);
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

/** Creates a "Many Balls" element */
export function createManyBallsElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", String(radius));
        circle.setAttribute("fill", config.fill || "orange");
        circle.setAttribute("stroke", config.stroke || "black");
        circle.setAttribute("stroke-width", "1");
        group.appendChild(circle);
    }

    const bgX = minX - radius;
    const bgY = minY - radius;
    const bgWidth = (maxX - minX) + diameter;
    const bgHeight = (maxY - minY) + diameter;

    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg"); // Keep for equipment
    bgRect.setAttribute("x", String(bgX));
    bgRect.setAttribute("y", String(bgY));
    bgRect.setAttribute("width", String(bgWidth));
    bgRect.setAttribute("height", String(bgHeight));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);

    ensureHandles(group, bgWidth, bgHeight, false);
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}


/** Creates a Gate element */
export function createGateElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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
    gateRect.setAttribute("class", "element-bg"); // Keep for equipment
    gateRect.setAttribute("x", "0");
    gateRect.setAttribute("y", "0");
    gateRect.setAttribute("width", String(width));
    gateRect.setAttribute("height", String(height));
    gateRect.setAttribute("fill", config.fill || "grey");
    gateRect.setAttribute("stroke", config.stroke || "black");
    gateRect.setAttribute("stroke-width", "1");
    group.appendChild(gateRect);

    ensureHandles(group, width, height, false);
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

/** Creates a Cone element */
export function createConeElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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
    bgRect.setAttribute("class", "element-bg"); // Keep for equipment
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
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

/** Creates a Barrier Line element */
export function createLineElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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
    bgRect.setAttribute("class", "element-bg"); // Keep for equipment
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
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

/** Creates a Barrier Corner element */
export function createCornerElement(config, centerX, centerY) {
    // ... (implementation remains the same, keeps .element-bg) ...
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
    bgRect.setAttribute("class", "element-bg"); // Keep for equipment
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
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

// --- Arrow, Number, Text Creation Functions (NO element-bg) ---

/** Creates an Arrow element (Line with marker) */
export function createArrowElement(config, startX, startY, endX, endY) {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "arrow-element");
    group.dataset.elementType = config.category;
    group.dataset.arrowType = config.toolId;
    group.dataset.elementName = config.label || "Arrow";

    group.setAttribute("transform", "");
    group.dataset.rotation = "0";

    // REMOVED Background rect for selection

    // Create the main line
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(startX));
    line.setAttribute("y1", String(startY));
    line.setAttribute("x2", String(endX));
    line.setAttribute("y2", String(endY));
    line.setAttribute("stroke", config.stroke || "black");
    line.setAttribute("stroke-width", String(config.strokeWidth || 2));
    if (config.strokeDasharray) {
        line.setAttribute("stroke-dasharray", config.strokeDasharray);
    }
    if (config.markerEndId) {
        line.setAttribute("marker-end", `url(#${config.markerEndId})`);
    }
    group.appendChild(line);

    // Add second line for 'shot'
    if (config.isDoubleLine) {
        const angle = Math.atan2(endY - startY, endX - startX);
        const offset = (config.strokeWidth || ARROW_STROKE_WIDTH_SHOT) * 1.5;
        const dx = Math.sin(angle) * offset;
        const dy = -Math.cos(angle) * offset;

        const line2 = document.createElementNS(SVG_NS, "line");
        line2.setAttribute("x1", String(startX + dx));
        line2.setAttribute("y1", String(startY + dy));
        line2.setAttribute("x2", String(endX + dx));
        line2.setAttribute("y2", String(endY + dy));
        line2.setAttribute("stroke", config.stroke || "red");
        line2.setAttribute("stroke-width", String(config.strokeWidth || 2));
        if (config.markerEndId) {
            line2.setAttribute("marker-end", `url(#${config.markerEndId})`);
        }
        group.appendChild(line2);
    }

    // Note: ensureHandles needs adjustment for line-based elements
    // Calculate width/height based on line coords for approximate size
    const width = Math.abs(startX - endX);
    const height = Math.abs(startY - endY);
    ensureHandles(group, width, height, false); // Not a player
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}


/** Creates a Number element */
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
    text.style.pointerEvents = "none";
    text.textContent = config.text;
    group.appendChild(text);

    // REMOVED Background rect for selection

    // Estimate size for ensureHandles
    const estimatedSize = (config.fontSize || NUMBER_FONT_SIZE) * 1.2;
    ensureHandles(group, estimatedSize, estimatedSize, false);
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

/** Creates a Text element */
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
    text.style.pointerEvents = "none"; // Important: Text itself shouldn't block clicks on the group
    text.textContent = content;

    if (content.includes('\n')) {
        text.textContent = '';
        const lines = content.split('\n');
        const lineHeight = (config.fontSize || TEXT_FONT_SIZE) * 1.2;
        lines.forEach((line, index) => {
            const tspan = document.createElementNS(SVG_NS, 'tspan');
            tspan.setAttribute('x', '0');
            tspan.setAttribute('dy', index === 0 ? '0' : `${lineHeight}`);
            tspan.textContent = line;
            text.appendChild(tspan);
        });
    }
    group.appendChild(text);

    // REMOVED Background rect for selection

    // Estimate size for ensureHandles (getBBox is unreliable before adding to DOM)
    const approxWidth = content.length * (config.fontSize || TEXT_FONT_SIZE) * 0.6; // Very rough estimate
    const approxHeight = (content.split('\n').length) * (config.fontSize || TEXT_FONT_SIZE) * 1.2;
    ensureHandles(group, approxWidth, approxHeight, false);
    // dom.svgCanvas.appendChild(group); // app.js handles appending
    makeElementInteractive(group);
    return group;
}

// --- End New Creation Functions ---


/**
 * Ensures the correct handles and data attributes are present on an element.
 * Called after creation, load, or import.
 */
export function ensureHandles(element, currentWidth, currentHeight, isPlayer = false) {
    if (!element) return;

    const transformList = element.transform.baseVal;
    const elementType = element.dataset.elementType;
    const hasBgRect = !!element.querySelector('.element-bg'); // Check if bgRect exists

    // Determine width/height based on bgRect if available, otherwise use passed values/defaults
    const width = currentWidth ?? (hasBgRect ? parseFloat(element.querySelector('.element-bg').getAttribute('width')) : MIN_ELEMENT_WIDTH);
    const height = currentHeight ?? (hasBgRect ? parseFloat(element.querySelector('.element-bg').getAttribute('height')) : MIN_ELEMENT_HEIGHT);

    // --- Rotation Logic ---
    let currentRotation = 0;
    // Disable rotation tool for numbers and text elements, arrows
    const allowRotation = elementType !== 'player' && elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot';

    if (allowRotation) {
        let rotateTransform = null;
        for (let i = 0; i < transformList.numberOfItems; i++) {
            const item = transformList.getItem(i);
            if (item.type === SVGTransform.SVG_TRANSFORM_ROTATE) {
                rotateTransform = item;
                currentRotation = rotateTransform.angle;
                break;
            }
        }
        element.dataset.rotation = String(currentRotation % 360);
    } else {
        element.dataset.rotation = "0";
    }

    // --- Cleanup ---
    element.querySelector('.resize-handle')?.remove();
    element.querySelector('.rotate-handle')?.remove();
    element.classList.remove('collision-indicator');

    // --- Move Handle Logic ---
    let moveHandle = element.querySelector('.move-handle');
    // Add move handle ONLY if it's NOT a player, number, text, or arrow
    const addMoveHandle = elementType !== 'player' && elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot';

    if (addMoveHandle) {
        if (width > 0 && height > 0 && hasBgRect) { // Only add if bgRect exists for positioning
            const bgRect = element.querySelector('.element-bg');
            const moveHandleWidth = Math.max(10, width * MOVE_HANDLE_WIDTH_PERCENT);
            const bgRectX = parseFloat(bgRect.getAttribute('x') || '0');
            const bgRectY = parseFloat(bgRect.getAttribute('y') || '0');
            const moveHandleX = bgRectX + (width - moveHandleWidth) / 2;
            const moveHandleY = bgRectY + MOVE_HANDLE_OFFSET;

            if (!moveHandle) {
                moveHandle = document.createElementNS(SVG_NS, "rect");
                moveHandle.setAttribute("class", "move-handle");
                if (bgRect.nextSibling) {
                    element.insertBefore(moveHandle, bgRect.nextSibling);
                } else {
                    element.appendChild(moveHandle);
                }
            }
            moveHandle.setAttribute("x", String(moveHandleX));
            moveHandle.setAttribute("y", String(moveHandleY));
            moveHandle.setAttribute("width", String(moveHandleWidth));
            moveHandle.setAttribute("height", String(MOVE_HANDLE_HEIGHT));
        } else if (moveHandle) {
            moveHandle.remove(); // Remove if invalid dimensions or no bgRect
        }
    } else {
        moveHandle?.remove(); // Remove handle if not allowed for this type
    }

    // Re-apply visual selection based on current state
    updateElementVisualSelection(element, appState.selectedElements.has(element));
}
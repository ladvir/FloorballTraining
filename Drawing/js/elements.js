// js/elements.js
import {
    MIN_ELEMENT_HEIGHT,
    MIN_ELEMENT_WIDTH,
    MOVE_HANDLE_HEIGHT,
    MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_WIDTH_PERCENT,
    PLAYER_DIAMETER,
    PLAYER_RADIUS,
    SVG_NS
} from './config.js';
import {dom} from './dom.js';
import {appState} from './state.js'; // Needed to check selection state in ensureHandles
import {makeElementInteractive} from './interactions.js';
import {updateElementVisualSelection} from './selection.js'; // Needed for ensureHandles


/**
 * Creates a generic canvas element (rect with label and optional SVG content).
 * Used for dragging Activities and Library items onto the canvas.
 */
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

    if (config.id) group.dataset.activityId = String(config.id);
    if (config.name) group.dataset.elementName = name;

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
                        svgContainer.appendChild(document.importNode(innerSvgElement.firstChild, true)); // Use importNode?
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

                foreignObject.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; overflow:hidden; display:flex; align-items:center; justify-content:center;">${config.svgContent}</div>`;

                const innerSvg = foreignObject.querySelector('svg');
                if (innerSvg) {
                    innerSvg.style.width = '100%';
                    innerSvg.style.height = '100%';
                    innerSvg.style.display = 'block';
                    innerSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
                group.appendChild(foreignObject);
            } catch(e) { console.error("Error creating library foreignObject:", e); }
        }
    }

    ensureHandles(group, width, height, false);
    dom.svgCanvas.appendChild(group);
    makeElementInteractive(group);
    return group;
}

/** Creates a player element (circle with optional text) on the canvas. */
export function createPlayerElement(config, centerX, centerY) {
    const radius = config.radius || PLAYER_RADIUS;
    const diameter = radius * 2;

    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("canvas-element", "player-element");

    // === Centering Logic ===
    // 1. Translate group origin to target center
    group.setAttribute("transform", `translate(${centerX}, ${centerY})`);
    // 2. Center bgRect and circle around group origin (0,0)
    group.dataset.rotation = "0";
    group.dataset.playerType = config.toolId;
    group.dataset.elementName = config.label || "Player";

    const bgRect = document.createElementNS(SVG_NS, "rect");
    bgRect.setAttribute("class", "element-bg");
    bgRect.setAttribute("x", String(-radius)); // Centered
    bgRect.setAttribute("y", String(-radius)); // Centered
    bgRect.setAttribute("width", String(diameter));
    bgRect.setAttribute("height", String(diameter));
    bgRect.setAttribute("fill", "transparent");
    bgRect.setAttribute("stroke", "none");
    group.appendChild(bgRect);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "0"); // Centered at origin
    circle.setAttribute("cy", "0"); // Centered at origin
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", config.fill || "black");
    circle.setAttribute("stroke", config.stroke || "black");
    circle.setAttribute("stroke-width", "1");
    group.appendChild(circle);

    if (config.text) {
        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", "0"); // Centered
        text.setAttribute("y", "0"); // Centered
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("fill", config.textColor || "white");
        text.setAttribute("font-size", "10");
        text.setAttribute("font-weight", "bold");
        text.style.pointerEvents = "none";
        text.textContent = config.text;
        group.appendChild(text);
    }
    // === End Centering Logic ===

    ensureHandles(group, diameter, diameter, true);
    dom.svgCanvas.appendChild(group);
    makeElementInteractive(group);
    return group;
}

/**
 * Ensures the correct handles and data attributes are present on an element.
 * Called after creation, load, or import.
 */
export function ensureHandles(element, currentWidth, currentHeight, isPlayer = false) {
    if (!element) return;

    const transformList = element.transform.baseVal;
    const rect = element.querySelector('.element-bg');

    const width = currentWidth ?? parseFloat(rect?.getAttribute('width') || (isPlayer ? PLAYER_DIAMETER : MIN_ELEMENT_WIDTH));
    const height = currentHeight ?? parseFloat(rect?.getAttribute('height') || (isPlayer ? PLAYER_DIAMETER : MIN_ELEMENT_HEIGHT));

    // Sync Rotation Data
    let currentRotation = 0;
    if (!isPlayer) {
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

    // Remove unused/old handles and indicators
    element.querySelector('.resize-handle')?.remove();
    element.querySelector('.rotate-handle')?.remove();
    element.classList.remove('collision-indicator'); // Ensure indicator class off

    // Manage Move Handle
    let moveHandle = element.querySelector('.move-handle');
    if (isPlayer) {
        moveHandle?.remove(); // Players don't get move handles
    } else {
        // Non-players need a move handle
        if (width > 0 && height > 0) {
            const moveHandleWidth = Math.max(10, width * MOVE_HANDLE_WIDTH_PERCENT);
            const moveHandleX = (width - moveHandleWidth) / 2;

            if (!moveHandle) {
                moveHandle = document.createElementNS(SVG_NS, "rect");
                moveHandle.setAttribute("class", "move-handle");
                const firstChild = element.firstElementChild; // Insert after bg usually
                if (firstChild) element.insertBefore(moveHandle, firstChild.nextSibling);
                else element.appendChild(moveHandle);
            }
            moveHandle.setAttribute("x", String(moveHandleX));
            moveHandle.setAttribute("y", String(MOVE_HANDLE_OFFSET));
            moveHandle.setAttribute("width", String(moveHandleWidth));
            moveHandle.setAttribute("height", String(MOVE_HANDLE_HEIGHT));
        } else if (moveHandle) {
            moveHandle.remove(); // Remove if invalid dimensions
        }
    }
    // Re-apply visual selection based on current state
    updateElementVisualSelection(element, appState.selectedElements.has(element));
}
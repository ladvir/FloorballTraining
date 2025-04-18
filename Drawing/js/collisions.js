//***** js/collisions.js ******

// js/collisions.js
import { dom } from './dom.js';
import { PLACEMENT_GAP, SVG_NS } from './config.js';
import { getTransformedBBox } from './utils.js';

// Define types that should NOT cause collisions when checking AGAINST them
// Added 'shape' to this list. Basic 'line' elements will still cause collisions.
const NON_COLLIDING_TYPES = ['number', 'text', 'movement', 'passShot', 'shape'];

/** Finds all canvas elements whose BBox overlaps with the proposed BBox, excluding one element and non-colliding types. */
export function getCollidingElementsByBBox(proposedBox, elementToExclude = null) {
    const colliding = [];
    if (!proposedBox) return colliding;

    const existingElements = dom.svgCanvas.querySelectorAll(".canvas-element");
    for (const existingElement of existingElements) {
        if (existingElement === elementToExclude) continue; // Skip self-check

        // Skip elements that shouldn't cause collisions
        const elementType = existingElement.dataset.elementType;
        if (NON_COLLIDING_TYPES.includes(elementType)) {
            continue;
        }

        const existingBBox = getTransformedBBox(existingElement);
        if (!existingBBox) continue; // Skip elements we can't get BBox for

        // Check for overlap with PLACEMENT_GAP
        const overlaps = !(
            (proposedBox.right + PLACEMENT_GAP <= existingBBox.left) ||
            (proposedBox.left - PLACEMENT_GAP >= existingBBox.right) ||
            (proposedBox.bottom + PLACEMENT_GAP <= existingBBox.top) ||
            (proposedBox.top - PLACEMENT_GAP >= existingBBox.bottom)
        );

        if (overlaps) {
            colliding.push(existingElement);
        }
    }
    return colliding;
}


/** Ensures a collision indicator rect exists within an element for visual feedback. */
export function ensureCollisionIndicatorRect(element) {
    if (!element) return;
    // Do not add indicators to non-colliding types
    const elementType = element.dataset.elementType;
    if (NON_COLLIDING_TYPES.includes(elementType)) {
        return;
    }

    let indicator = element.querySelector('.collision-indicator-rect');
    if (!indicator) {
        indicator = document.createElementNS(SVG_NS, 'rect');
        indicator.setAttribute('class', 'collision-indicator-rect');
        const firstVisualChild = element.querySelector('circle, rect:not(.collision-indicator-rect):not(.element-bg):not(.selected-outline), path, line, polygon, text');
        if (firstVisualChild) { element.insertBefore(indicator, firstVisualChild); }
        else if (element.firstChild) { element.insertBefore(indicator, element.firstChild); }
        else { element.appendChild(indicator); }
    }

    // Size the indicator based on bgRect or primary visual element
    const bgRect = element.querySelector('.element-bg');
    const visualElement = bgRect || element.querySelector('circle, rect:not(.collision-indicator-rect):not(.element-bg):not(.selected-outline), path, line, polygon') || element.firstElementChild;
    const padding = 4;
    const cornerRadius = '7';
    let bbox = null;

    try { if (visualElement?.getBBox) { bbox = visualElement.getBBox(); } }
    catch(e) { console.warn("Could not get BBox for collision indicator sizing:", e, element); }

    if (bbox && bbox.width >= 0 && bbox.height >= 0) {
        indicator.setAttribute('x', String(bbox.x - padding));
        indicator.setAttribute('y', String(bbox.y - padding));
        indicator.setAttribute('width', String(bbox.width + (padding * 2)));
        indicator.setAttribute('height', String(bbox.height + (padding * 2)));
        indicator.setAttribute('rx', cornerRadius);
        indicator.setAttribute('ry', cornerRadius);
    } else {
        indicator.setAttribute('width', '0'); indicator.setAttribute('height', '0');
    }
}

/** Clears collision indicator class from a set of elements. */
export function clearCollisionHighlights(highlightSet) {
    if (!highlightSet) return;
    highlightSet.forEach(el => {
        el.classList.remove('collision-indicator');
    });
    highlightSet.clear();
}
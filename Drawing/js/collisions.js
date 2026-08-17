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
        // Insert before the first visual child if possible, otherwise just append
        const firstVisualChild = element.querySelector('circle, rect:not(.collision-indicator-rect):not(.element-bg):not(.selected-outline), path, line, polygon, text');
        if (firstVisualChild) { element.insertBefore(indicator, firstVisualChild); }
        else if (element.firstChild) { element.insertBefore(indicator, element.firstChild); }
        else { element.appendChild(indicator); }
    }

    // Size the indicator based on the element's calculated dimensions
    const { width, height, x, y } = getElementDimensions(element);

    const padding = 4; // Padding around the element's dimensions
    const cornerRadius = '7';

    if (width >= 0 && height >= 0) { // Ensure valid dimensions
        indicator.setAttribute('x', String(x - padding));
        indicator.setAttribute('y', String(y - padding));
        indicator.setAttribute('width', String(width + (padding * 2)));
        indicator.setAttribute('height', String(height + (padding * 2)));
        indicator.setAttribute('rx', cornerRadius);
        indicator.setAttribute('ry', cornerRadius);
    } else {
        // Hide the indicator if dimensions are invalid
        indicator.setAttribute('width', '0');
        indicator.setAttribute('height', '0');
    }
}

/**
 * Calculates the dimensions and position of an element based on its primary visual content.
 * This is used for sizing the collision indicator and potentially for collision checks.
 * Returns { x, y, width, height } relative to the element's origin (0,0).
 */
export function getElementDimensions(element) {
    if (!element) return { x: 0, y: 0, width: 0, height: 0 };

    // Prefer the element-bg rect if it exists, as it often defines the intended bounds
    const bgRect = element.querySelector(':scope > .element-bg');
    if (bgRect) {
        return {
            x: parseFloat(bgRect.getAttribute('x') || '0'),
            y: parseFloat(bgRect.getAttribute('y') || '0'),
            width: parseFloat(bgRect.getAttribute('width') || '0'),
            height: parseFloat(bgRect.getAttribute('height') || '0')
        };
    }

    // Fallback: Use the first visual element's BBox
    const visualElement = element.querySelector('circle, rect:not(.collision-indicator-rect):not(.element-bg):not(.selected-outline), path, line, polygon, text');

    if (visualElement && visualElement.getBBox) {
        try {
            const bbox = visualElement.getBBox();
            return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
        } catch (e) {
            console.warn("Could not get BBox for element dimensions:", e, element);
            return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    // Final fallback: Use the group's BBox (less reliable for elements with complex transforms or nested structures)
    try {
        const groupBBox = element.getBBox();
        return { x: groupBBox.x, y: groupBBox.y, width: groupBBox.width, height: groupBBox.height };
    } catch (e) {
        console.warn("Could not get group BBox for element dimensions:", e, element);
        return { x: 0, y: 0, width: 0, height: 0 };
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
// js/collisions.js
import { dom } from './dom.js';
import { PLACEMENT_GAP, SVG_NS } from './config.js';
import { getTransformedBBox } from './utils.js';

/** Finds all canvas elements whose BBox overlaps with the proposed BBox, excluding one element. */
export function getCollidingElementsByBBox(proposedBox, elementToExclude = null) {
    const colliding = [];
    if (!proposedBox) return colliding;

    const existingElements = dom.svgCanvas.querySelectorAll(".canvas-element");
    for (const existingElement of existingElements) {
        if (existingElement === elementToExclude) continue; // Skip self-check

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
export /** Ensures a collision indicator rect exists within an element for visual feedback. */
function ensureCollisionIndicatorRect(element) {
    if (!element) return;
    let indicator = element.querySelector('.collision-indicator-rect');
    if (!indicator) {
        indicator = document.createElementNS(SVG_NS, 'rect');
        indicator.setAttribute('class', 'collision-indicator-rect');
        element.appendChild(indicator);
    }

    // Align the indicator with the circle's bounding box
    const circle = element.querySelector('circle');
    if (circle) {
        const radius = parseFloat(circle.getAttribute('r') || '0');
        const padding = 4; // Slightly larger padding for visibility
        indicator.setAttribute('x', String(-radius - padding));
        indicator.setAttribute('y', String(-radius - padding));
        indicator.setAttribute('width', String((radius * 2) + (padding * 2)));
        indicator.setAttribute('height', String((radius * 2) + (padding * 2)));
        indicator.setAttribute('rx', '7'); // Rounded corners
        indicator.setAttribute('ry', '7');
    }
}

/** Clears collision indicator class from a set of elements. */
export function clearCollisionHighlights(highlightSet) {
    if (!highlightSet) return;
    highlightSet.forEach(el => {
        el.classList.remove('collision-indicator');
        // We don't remove the rect itself, just hide it via CSS (opacity)
    });
    highlightSet.clear();
}
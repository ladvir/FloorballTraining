// js/collisions.js
import { dom } from './dom.js';
import { PLACEMENT_GAP, SVG_NS } from './config.js';
import { getTransformedBBox } from './utils.js';

// Define types that should NOT cause collisions when checking AGAINST them
const NON_COLLIDING_TYPES = ['number', 'text', 'movement', 'passShot'];

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
        const mainVisual = element.querySelector('circle') || element.querySelector('.element-bg') || element.firstElementChild;
        if (mainVisual && mainVisual.nextSibling) {
            element.insertBefore(indicator, mainVisual.nextSibling);
        } else {
            element.appendChild(indicator);
        }
    }

    // Size the indicator based on bgRect or circle
    const bgRect = element.querySelector('.element-bg');
    const circle = element.querySelector('circle');
    const padding = 4;
    const cornerRadius = '7';

    if (circle) { // Player element case
        const radius = parseFloat(circle.getAttribute('r') || '0');
        indicator.setAttribute('x', String(-radius - padding));
        indicator.setAttribute('y', String(-radius - padding));
        indicator.setAttribute('width', String((radius * 2) + (padding * 2)));
        indicator.setAttribute('height', String((radius * 2) + (padding * 2)));
        indicator.setAttribute('rx', cornerRadius);
        indicator.setAttribute('ry', cornerRadius);
    } else if (bgRect) { // Generic element case
        const x = parseFloat(bgRect.getAttribute('x') || '0');
        const y = parseFloat(bgRect.getAttribute('y') || '0');
        const width = parseFloat(bgRect.getAttribute('width') || '0');
        const height = parseFloat(bgRect.getAttribute('height') || '0');
        indicator.setAttribute('x', String(x - padding));
        indicator.setAttribute('y', String(y - padding));
        indicator.setAttribute('width', String(width + (padding * 2)));
        indicator.setAttribute('height', String(height + (padding * 2)));
        indicator.setAttribute('rx', cornerRadius);
        indicator.setAttribute('ry', cornerRadius);
    } else {
        // Fallback (shouldn't be needed often now)
        try {
            const bbox = element.getBBox();
            if (bbox && bbox.width > 0 && bbox.height > 0) {
                indicator.setAttribute('x', String(bbox.x - padding));
                indicator.setAttribute('y', String(bbox.y - padding));
                indicator.setAttribute('width', String(bbox.width + (padding * 2)));
                indicator.setAttribute('height', String(bbox.height + (padding * 2)));
                indicator.setAttribute('rx', cornerRadius);
                indicator.setAttribute('ry', cornerRadius);
            } else { indicator.setAttribute('width', '0'); indicator.setAttribute('height', '0'); }
        } catch(e) { indicator.setAttribute('width', '0'); indicator.setAttribute('height', '0'); }
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
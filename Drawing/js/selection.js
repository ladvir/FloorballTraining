// js/selection.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getTransformedBBox } from './utils.js';
import { clearCollisionHighlights } from './collisions.js';
import { SVG_NS, SELECTION_RECT_MIN_SIZE } from './config.js';
// Note: setActiveTool is NOT called directly from here anymore, handled in event listeners (mousedown)

/** Updates the visual selection state (outline) of a single element. */
export function updateElementVisualSelection(element, isSelected) {
    if (!element) return;

    let existingOutline = element.querySelector('.selected-outline');

    if (isSelected) {
        element.classList.add('selected');
        if (!existingOutline) {
            const outline = document.createElementNS(SVG_NS, 'rect');
            outline.setAttribute('class', 'selected-outline');
            element.appendChild(outline);

            existingOutline = element.querySelector('.selected-outline');
        }

        // Align the outline with the circle's bounding box
        const circle = element.querySelector('circle');
        if (circle) {
            const radius = parseFloat(circle.getAttribute('r') || '0');
            const padding = 2; // Visual padding for the outline
            existingOutline.setAttribute('x', String(-radius - padding));
            existingOutline.setAttribute('y', String(-radius - padding));
            existingOutline.setAttribute('width', String((radius * 2) + (padding * 2)));
            existingOutline.setAttribute('height', String((radius * 2) + (padding * 2)));
            existingOutline.setAttribute('rx', '5'); // Rounded corners
            existingOutline.setAttribute('ry', '5');
        }
    } else {
        element.classList.remove('selected');
        existingOutline?.remove(); // Remove outline if it exists
    }
}

/** Clears the current element selection and visual feedback. */
export function clearSelection() {
    appState.selectedElements.forEach(el => updateElementVisualSelection(el, false));
    appState.selectedElements.clear();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions); // Also clear highlights
}

/** Handles element selection logic based on click events and Shift key. (Internal use by interactions.js) */
export function handleElementSelection(element, event) {
    if (!element) return;

    const currentlySelected = appState.selectedElements.has(element);

    if (event.shiftKey) {
        // Shift key toggles selection for the clicked element
        if (currentlySelected) {
            appState.selectedElements.delete(element);
            updateElementVisualSelection(element, false);
        } else {
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    } else {
        // No shift key:
        // If the clicked element is not the *only* selected element,
        // clear previous selection and select only the clicked one.
        if (! (appState.selectedElements.size === 1 && currentlySelected)) {
            clearSelection();
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
        // If it was already the only selected element, do nothing (allows drag initiation).
    }
}


// --- Selection Rectangle (Marquee Select) ---

// Need reference to the mouse move/up handlers to remove them later
let _handleCanvasMouseMoveSelect = null;
let _handleCanvasMouseUpSelect = null;

/** Handles mousedown on the canvas background to potentially start marquee select. */
export function handleCanvasMouseDown(event) {
    if (event.target === dom.svgCanvas && appState.currentTool === 'select') {
        event.preventDefault();

        if (!event.shiftKey) {
            clearSelection();
        }

        appState.isSelectingRect = true;
        appState.selectionRectStart = svgPoint(dom.svgCanvas, event.clientX, event.clientY);

        if (!appState.selectionRectStart) {
            console.error("Could not get selection rect start point.");
            appState.isSelectingRect = false;
            return;
        }

        dom.selectionRect.setAttribute('x', appState.selectionRectStart.x);
        dom.selectionRect.setAttribute('y', appState.selectionRectStart.y);
        dom.selectionRect.setAttribute('width', '0');
        dom.selectionRect.setAttribute('height', '0');
        dom.selectionRect.setAttribute('visibility', 'visible');

        // Define handlers locally to keep reference
        _handleCanvasMouseMoveSelect = (moveEvent) => handleCanvasMouseMove(moveEvent);
        _handleCanvasMouseUpSelect = (upEvent) => handleCanvasMouseUp(upEvent);

        document.addEventListener('mousemove', _handleCanvasMouseMoveSelect, false);
        document.addEventListener('mouseup', _handleCanvasMouseUpSelect, false);
    }
}

/** Handles mousemove while drawing the selection rectangle. */
function handleCanvasMouseMove(event) {
    if (!appState.isSelectingRect || !appState.selectionRectStart) return;
    event.preventDefault();

    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;

    const x = Math.min(appState.selectionRectStart.x, currentPoint.x);
    const y = Math.min(appState.selectionRectStart.y, currentPoint.y);
    const width = Math.abs(appState.selectionRectStart.x - currentPoint.x);
    const height = Math.abs(appState.selectionRectStart.y - currentPoint.y);

    dom.selectionRect.setAttribute('x', String(x));
    dom.selectionRect.setAttribute('y', String(y));
    dom.selectionRect.setAttribute('width', String(width));
    dom.selectionRect.setAttribute('height', String(height));
}

/** Handles mouseup after drawing the selection rectangle. */
function handleCanvasMouseUp(event) {
    if (!appState.isSelectingRect) return;

    appState.isSelectingRect = false;
    dom.selectionRect.setAttribute('visibility', 'hidden');

    // Clean up listeners using the stored references
    document.removeEventListener('mousemove', _handleCanvasMouseMoveSelect, false);
    document.removeEventListener('mouseup', _handleCanvasMouseUpSelect, false);
    _handleCanvasMouseMoveSelect = null; // Clear references
    _handleCanvasMouseUpSelect = null;

    const startPt = appState.selectionRectStart;
    const endPt = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    appState.selectionRectStart = null;

    if (!startPt || !endPt) {
        console.error("Missing points for selection calculation.");
        return;
    }

    const selectionX = Math.min(startPt.x, endPt.x);
    const selectionY = Math.min(startPt.y, endPt.y);
    const selectionWidth = Math.abs(startPt.x - endPt.x);
    const selectionHeight = Math.abs(startPt.y - endPt.y);

    if (selectionWidth > SELECTION_RECT_MIN_SIZE || selectionHeight > SELECTION_RECT_MIN_SIZE) {
        const selectionRectBounds = {
            left: selectionX, top: selectionY,
            right: selectionX + selectionWidth, bottom: selectionY + selectionHeight
        };

        const isContainMode = endPt.x < startPt.x;
        const elementsToSelectNow = new Set();
        const allElements = dom.svgCanvas.querySelectorAll('.canvas-element');

        allElements.forEach(element => {
            const elementBBox = getTransformedBBox(element);
            if (!elementBBox) return;

            if (isContainMode) {
                if (elementBBox.left >= selectionRectBounds.left &&
                    elementBBox.right <= selectionRectBounds.right &&
                    elementBBox.top >= selectionRectBounds.top &&
                    elementBBox.bottom <= selectionRectBounds.bottom)
                {
                    elementsToSelectNow.add(element);
                }
            } else {
                const intersects = !(
                    elementBBox.right < selectionRectBounds.left ||
                    elementBBox.left > selectionRectBounds.right ||
                    elementBBox.bottom < selectionRectBounds.top ||
                    elementBBox.top > selectionRectBounds.bottom
                );
                if (intersects) {
                    elementsToSelectNow.add(element);
                }
            }
        });

        if (!event.shiftKey) {
            clearSelection();
            elementsToSelectNow.forEach(el => {
                appState.selectedElements.add(el);
                updateElementVisualSelection(el, true);
            });
        } else {
            elementsToSelectNow.forEach(el => {
                if (!appState.selectedElements.has(el)) {
                    appState.selectedElements.add(el);
                    updateElementVisualSelection(el, true);
                }
            });
        }
    }
}
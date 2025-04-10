// js/selection.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getTransformedBBox } from './utils.js';
import { clearCollisionHighlights } from './collisions.js';
import { SVG_NS, SELECTION_RECT_MIN_SIZE, PLACEMENT_GAP } from './config.js'; // Added PLACEMENT_GAP

/** Updates the visual selection state (outline) of a single element. */
export function updateElementVisualSelection(element, isSelected) {
    console.log(`DEBUG Select: updateElementVisualSelection for:`, element, `Selected: ${isSelected}`, `Type: ${element?.dataset?.elementType}`);
    if (!element) return;

    let existingOutline = element.querySelector('.selected-outline');

    if (isSelected) {
        element.classList.add('selected');
        if (!existingOutline) {
            const outline = document.createElementNS(SVG_NS, 'rect');
            outline.setAttribute('class', 'selected-outline');
            // Insert outline ideally before handles but after main visuals
            const moveHandle = element.querySelector('.move-handle');
            if (moveHandle) {
                element.insertBefore(outline, moveHandle);
            } else {
                element.appendChild(outline); // Append if no handle
            }
            existingOutline = outline;
        }

        // Align the outline based on element type
        const bgRect = element.querySelector('.element-bg');
        const circle = element.querySelector('circle');
        const textEl = element.querySelector('text'); // For numbers/text
        const lineEl = element.querySelector('line'); // For arrows/lines
        const pathEl = element.querySelector('path'); // For corner barriers
        const padding = PLACEMENT_GAP / 2; // Use half placement gap for padding
        const cornerRadius = '5';

        if (circle) { // Player element case
            console.log('DEBUG Select: updateElementVisualSelection - Sizing based on circle');
            const radius = parseFloat(circle.getAttribute('r') || '0');
            existingOutline.setAttribute('x', String(-radius - padding));
            existingOutline.setAttribute('y', String(-radius - padding));
            existingOutline.setAttribute('width', String((radius * 2) + (padding * 2)));
            existingOutline.setAttribute('height', String((radius * 2) + (padding * 2)));
            existingOutline.setAttribute('rx', cornerRadius);
            existingOutline.setAttribute('ry', cornerRadius);
        } else if (bgRect) { // Elements with a background rect (Activity, Library, Equipment)
            console.log('DEBUG Select: updateElementVisualSelection - Sizing based on bgRect');
            const x = parseFloat(bgRect.getAttribute('x') || '0');
            const y = parseFloat(bgRect.getAttribute('y') || '0');
            const width = parseFloat(bgRect.getAttribute('width') || '0');
            const height = parseFloat(bgRect.getAttribute('height') || '0');
            existingOutline.setAttribute('x', String(x - padding));
            existingOutline.setAttribute('y', String(y - padding));
            existingOutline.setAttribute('width', String(width + (padding * 2)));
            existingOutline.setAttribute('height', String(height + (padding * 2)));
            existingOutline.setAttribute('rx', bgRect.getAttribute('rx') || cornerRadius);
            existingOutline.setAttribute('ry', bgRect.getAttribute('ry') || cornerRadius);
        } else if (textEl || lineEl || pathEl) { // Arrows, Numbers, Text, Corners (no bgRect)
            console.log('DEBUG Select: updateElementVisualSelection - Sizing based on visual element BBox');
            // Get BBox of the primary visual element itself
            const visualElement = textEl || lineEl || pathEl || element.firstElementChild; // Fallback
            try {
                const bbox = visualElement.getBBox();
                if (bbox && bbox.width >= 0 && bbox.height >= 0) { // Allow zero width/height for lines
                    existingOutline.setAttribute('x', String(bbox.x - padding));
                    existingOutline.setAttribute('y', String(bbox.y - padding));
                    existingOutline.setAttribute('width', String(bbox.width + (padding * 2)));
                    existingOutline.setAttribute('height', String(bbox.height + (padding * 2)));
                    existingOutline.setAttribute('rx', cornerRadius);
                    existingOutline.setAttribute('ry', cornerRadius);
                } else {
                    console.warn('DEBUG Select: updateElementVisualSelection - Visual element BBox invalid, hiding outline.');
                    existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0');
                }
            } catch (e) {
                console.error("DEBUG Select: updateElementVisualSelection - Error getting visual element BBox:", element, e);
                existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0');
            }
        } else {
            console.warn('DEBUG Select: updateElementVisualSelection - Cannot determine sizing basis, hiding outline.');
            existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0'); // Hide if no basis found
        }

    } else {
        element.classList.remove('selected');
        existingOutline?.remove();
    }
}

/** Clears the current element selection and visual feedback. */
export function clearSelection() {
    // ... (implementation remains the same) ...
    appState.selectedElements.forEach(el => updateElementVisualSelection(el, false));
    appState.selectedElements.clear();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);
}

/** Handles element selection logic based on click events and Shift key. */
export function handleElementSelection(element, event) {
    // ... (implementation remains the same) ...
    console.log(`DEBUG Select: handleElementSelection called for: ${element?.dataset?.elementName || '[no name]'} (Type: ${element?.dataset?.elementType}), Shift: ${event.shiftKey}`);
    if (!element) return;

    const currentlySelected = appState.selectedElements.has(element);

    if (event.shiftKey) {
        if (currentlySelected) {
            appState.selectedElements.delete(element);
            updateElementVisualSelection(element, false);
        } else {
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    } else {
        if (! (appState.selectedElements.size === 1 && currentlySelected)) {
            clearSelection();
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    }
}


// --- Selection Rectangle (Marquee Select) ---
// ... (implementation remains the same) ...
let _handleCanvasMouseMoveSelect = null;
let _handleCanvasMouseUpSelect = null;

export function handleCanvasMouseDown(event) {
    if (event.target !== dom.svgCanvas) {
        console.log("DEBUG Select: Canvas mousedown ignored (target is not canvas bg)");
        return;
    }

    if (appState.currentTool === 'select') {
        console.log("DEBUG Select: Canvas mousedown starting marquee select");
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

        _handleCanvasMouseMoveSelect = (moveEvent) => handleCanvasMouseMove(moveEvent);
        _handleCanvasMouseUpSelect = (upEvent) => handleCanvasMouseUp(upEvent);

        document.addEventListener('mousemove', _handleCanvasMouseMoveSelect, false);
        document.addEventListener('mouseup', _handleCanvasMouseUpSelect, false);
    } else {
        console.log(`DEBUG Select: Canvas mousedown ignored (tool is not 'select': ${appState.currentTool})`);
    }
}

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

function handleCanvasMouseUp(event) {
    if (!appState.isSelectingRect) return;

    console.log("DEBUG Select: Canvas mouseup ending marquee select");
    appState.isSelectingRect = false;
    dom.selectionRect.setAttribute('visibility', 'hidden');

    document.removeEventListener('mousemove', _handleCanvasMouseMoveSelect, false);
    document.removeEventListener('mouseup', _handleCanvasMouseUpSelect, false);
    _handleCanvasMouseMoveSelect = null;
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
        console.log(`DEBUG Select: Marquee rect large enough (${selectionWidth}x${selectionHeight}). Calculating selection.`);
        const selectionRectBounds = {
            left: selectionX, top: selectionY,
            right: selectionX + selectionWidth, bottom: selectionY + selectionHeight
        };

        const elementsToSelectNow = new Set();
        const allElements = dom.svgCanvas.querySelectorAll('.canvas-element');

        allElements.forEach(element => {
            const elementBBox = getTransformedBBox(element); // Use BBox for selection test
            if (!elementBBox) return;

            const intersects = !(
                elementBBox.right < selectionRectBounds.left ||
                elementBBox.left > selectionRectBounds.right ||
                elementBBox.bottom < selectionRectBounds.top ||
                elementBBox.top > selectionRectBounds.bottom
            );
            if (intersects) {
                elementsToSelectNow.add(element);
            }
        });
        console.log(`DEBUG Select: Marquee selected ${elementsToSelectNow.size} elements.`);

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
    } else {
        console.log(`DEBUG Select: Marquee rect too small (${selectionWidth}x${selectionHeight}). Not selecting.`);
    }
}
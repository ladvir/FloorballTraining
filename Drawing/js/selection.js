// js/selection.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getTransformedBBox } from './utils.js';
import { clearCollisionHighlights } from './collisions.js';
import {SVG_NS, SELECTION_RECT_MIN_SIZE, PLACEMENT_GAP, TEXT_TOOL_ID} from './config.js';

// --- Module-scoped variables for marquee listeners ---
let _handleMarqueeMouseMove = null;
let _handleMarqueeMouseUp = null;
// ---

/** Updates the visual selection state (outline) of a single element. */
//***** js/selection.js ******
// ... (imports) ...

/** Updates the visual selection state (outline) of a single element. */
export function updateElementVisualSelection(element, isSelected) {
    if (!element) return;

    let existingOutline = element.querySelector(':scope > .selected-outline');

    // Determine if this element is currently being edited
    const isCurrentlyBeingEdited = appState.isEditingText && appState.currentEditingElement === element;

    if (isSelected && !isCurrentlyBeingEdited) { // Only show outline if selected AND NOT being edited
        element.classList.add('selected');
        if (!existingOutline) {
            const outline = document.createElementNS(SVG_NS, 'rect');
            outline.setAttribute('class', 'selected-outline');
            // Insert before the first visual child or bgRect if possible
            const bgRectForInsert = element.querySelector(':scope > .element-bg');
            const firstVisualChild = bgRectForInsert || element.querySelector('circle, rect:not(.selected-outline):not(.element-bg), path, line, polygon, text');

            if (firstVisualChild) {
                element.insertBefore(outline, firstVisualChild);
            } else if (element.firstChild) {
                element.insertBefore(outline, element.firstChild);
            } else {
                element.appendChild(outline);
            }
            existingOutline = outline;
        }

        // --- Sizing Logic (remains largely the same) ---
        const bgRect = element.querySelector(':scope > .element-bg');
        // ... (rest of your existing sizing logic for the outline) ...
        // For text elements, the .element-bg created in createTextElement will be used here.
        // If .element-bg isn't present for some reason, the BBox fallback will be used.

        // Example for bgRect sizing (ensure this aligns with your text element structure)
        if (bgRect) {
            const padding = PLACEMENT_GAP / 2;
            const cornerRadius = '5';
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
        } else {
            // Fallback to BBox of the first visual child if no .element-bg
            const visualElement = element.querySelector('circle, rect:not(.selected-outline):not(.element-bg), path, line, polygon, text') || element.firstElementChild;
            if (visualElement && visualElement.getBBox) {
                try {
                    const bbox = visualElement.getBBox();
                    const padding = PLACEMENT_GAP / 2;
                    const cornerRadius = '5';
                    if (bbox && (bbox.width >= 0 || bbox.height >= 0)) {
                        existingOutline.setAttribute('x', String(bbox.x - padding));
                        existingOutline.setAttribute('y', String(bbox.y - padding));
                        existingOutline.setAttribute('width', String(bbox.width + (padding * 2)));
                        existingOutline.setAttribute('height', String(bbox.height + (padding * 2)));
                        existingOutline.setAttribute('rx', cornerRadius);
                        existingOutline.setAttribute('ry', cornerRadius);
                    } else {
                        existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0');
                    }
                } catch (e) {
                    console.error("DEBUG Select: updateElementVisualSelection - Error getting visual element BBox:", element, e);
                    existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0');
                }
            } else {
                existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0');
            }
        }
        existingOutline.setAttribute('visibility', 'visible');

    } else { // Deselecting OR if it's currently being edited
        element.classList.remove('selected'); // Still remove 'selected' class if deselected
        if (existingOutline) {
            existingOutline.remove();
        }
    }
}

/** Clears the current element selection and visual feedback. */
export function clearSelection() {
    const elementsToDeselect = Array.from(appState.selectedElements);
    appState.selectedElements.clear(); // Clear the set first

    elementsToDeselect.forEach(el => {
        // updateElementVisualSelection will now correctly remove the outline
        // because appState.isEditingText would be false, and el is no longer in selectedElements
        updateElementVisualSelection(el, false);
    });

    // If text tool is not active, ensure text properties toolbar is hidden
    if (appState.activeDrawingTool !== TEXT_TOOL_ID && dom.textPropertiesToolbar) {
        dom.textPropertiesToolbar.style.display = 'none';
    }
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);
}

/** Handles element selection logic based on click events and Ctrl key. */
export function handleElementSelection(element, event) {
    // console.log(`DEBUG Select: handleElementSelection called for: ${element?.id || element?.dataset?.elementType}, Ctrl: ${event.ctrlKey || event.metaKey}`);
    if (!element) return;
    const currentlySelected = appState.selectedElements.has(element);
    const isMultiSelect = event.ctrlKey || event.metaKey;

    if (isMultiSelect) {
        if (currentlySelected) {
            appState.selectedElements.delete(element);
            updateElementVisualSelection(element, false);
        } else {
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    } else {
        if (! (appState.selectedElements.size === 1 && currentlySelected)) {
            const previouslySelected = Array.from(appState.selectedElements);
            appState.selectedElements.clear();
            previouslySelected.forEach(el => {
                if (el !== element) {
                    updateElementVisualSelection(el, false);
                }
            });
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    }
    // updateSelectionListUI(); // REMOVED CALL
}


// --- Selection Rectangle (Marquee Select) ---

/** Initiates marquee selection on background mousedown */
export function handleMarqueeMouseDown(event) {
    // console.log("DEBUG Select: Marquee MouseDown");
    event.preventDefault();

    appState.justFinishedMarquee = false; // Reset flag
    appState.isSelectingRect = true;
    appState.selectionRectStart = svgPoint(dom.svgCanvas, event.clientX, event.clientY);

    if (!appState.selectionRectStart || !dom.selectionRect) {
        console.error("Could not get marquee start point or selection rect element.");
        appState.isSelectingRect = false;
        return;
    }

    dom.selectionRect.setAttribute('x', appState.selectionRectStart.x);
    dom.selectionRect.setAttribute('y', appState.selectionRectStart.y);
    dom.selectionRect.setAttribute('width', '0');
    dom.selectionRect.setAttribute('height', '0');
    dom.selectionRect.setAttribute('visibility', 'visible');

    _handleMarqueeMouseMove = (moveEvent) => handleMarqueeMouseMove(moveEvent);
    _handleMarqueeMouseUp = (upEvent) => handleMarqueeMouseUp(upEvent);

    document.addEventListener('mousemove', _handleMarqueeMouseMove, false);
    document.addEventListener('mouseup', _handleMarqueeMouseUp, false);
}

/** Updates the visual marquee rectangle during drag */
function handleMarqueeMouseMove(event) {
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

/** Finalizes marquee selection on mouseup, ADDING to the current selection */
function handleMarqueeMouseUp(event) {
    if (!appState.isSelectingRect) return;
    // console.log("DEBUG Select: Marquee MouseUp - ADDING Logic");

    appState.isSelectingRect = false;
    if (dom.selectionRect) { dom.selectionRect.setAttribute('visibility', 'hidden'); }
    if (_handleMarqueeMouseMove) document.removeEventListener('mousemove', _handleMarqueeMouseMove, false);
    if (_handleMarqueeMouseUp) document.removeEventListener('mouseup', _handleMarqueeMouseUp, false);
    _handleMarqueeMouseMove = null;
    _handleMarqueeMouseUp = null;

    const startPt = appState.selectionRectStart;
    const endPt = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    appState.selectionRectStart = null;

    if (!startPt || !endPt) { return; }

    const selectionX = Math.min(startPt.x, endPt.x);
    const selectionY = Math.min(startPt.y, endPt.y);
    const selectionWidth = Math.abs(startPt.x - endPt.x);
    const selectionHeight = Math.abs(startPt.y - endPt.y);

    if (selectionWidth > SELECTION_RECT_MIN_SIZE || selectionHeight > SELECTION_RECT_MIN_SIZE) {
        const selectionRectBounds = {
            left: selectionX, top: selectionY,
            right: selectionX + selectionWidth, bottom: selectionY + selectionHeight
        };
        const isCrossingSelection = (endPt.x < startPt.x);
        const allElements = dom.contentLayer.querySelectorAll('.canvas-element');
        let selectionChanged = false; // Flag if *any* item was newly selected

        allElements.forEach(element => {
            const elementBBox = getTransformedBBox(element);
            if (!elementBBox) return;

            let shouldSelect = false;
            if (isCrossingSelection) { // Right-to-Left: Intersecting
                shouldSelect = !(
                    elementBBox.right < selectionRectBounds.left ||
                    elementBBox.left > selectionRectBounds.right ||
                    elementBBox.bottom < selectionRectBounds.top ||
                    elementBBox.top > selectionRectBounds.bottom
                );
            } else { // Left-to-Right: Contained
                shouldSelect = (
                    elementBBox.left >= selectionRectBounds.left &&
                    elementBBox.right <= selectionRectBounds.right &&
                    elementBBox.top >= selectionRectBounds.top &&
                    elementBBox.bottom <= selectionRectBounds.bottom
                );
            }

            if (shouldSelect) {
                // ADD to selection if not already present
                if (!appState.selectedElements.has(element)) {
                    appState.selectedElements.add(element);
                    updateElementVisualSelection(element, true);
                    selectionChanged = true;
                }
            }
        });

        // No need to update visuals for previously selected items, as we only add

        // Update UI list only if the selection actually changed
        // if (selectionChanged) { // REMOVED - no list update function
        //     // updateSelectionListUI();
        // }

        // Set the flag to prevent immediate background click clear
        appState.justFinishedMarquee = true;
        setTimeout(() => { appState.justFinishedMarquee = false; }, 0);

    } else {
        // Small drag = click, clear selection (standard behavior)
        // Don't set the flag, allow background click clear if needed
        if (appState.selectedElements.size > 0) {
            clearSelection();
        }
    }
}

/** Cleans up marquee selection state and listeners (e.g., on Escape) */
export function cancelMarqueeSelection() {
    if (!appState.isSelectingRect) return;
    // console.log("Cancelling marquee selection");
    appState.isSelectingRect = false;
    if (dom.selectionRect) {
        dom.selectionRect.setAttribute('visibility', 'hidden');
    }
    if (_handleMarqueeMouseMove) document.removeEventListener('mousemove', _handleMarqueeMouseMove, false);
    if (_handleMarqueeMouseUp) document.removeEventListener('mouseup', _handleMarqueeMouseUp, false);
    _handleMarqueeMouseMove = null;
    _handleMarqueeMouseUp = null;
    appState.selectionRectStart = null;
    appState.justFinishedMarquee = false; // Reset flag on cancel too
}
// --- End Marquee Selection ---
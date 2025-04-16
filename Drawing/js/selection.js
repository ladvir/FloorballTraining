// js/selection.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getTransformedBBox } from './utils.js';
import { clearCollisionHighlights } from './collisions.js';
import { SVG_NS, SELECTION_RECT_MIN_SIZE, PLACEMENT_GAP } from './config.js';

// --- Module-scoped variables for marquee listeners ---
let _handleMarqueeMouseMove = null;
let _handleMarqueeMouseUp = null;
// ---

/** Updates the visual selection state (outline) of a single element. */
export function updateElementVisualSelection(element, isSelected) {
    // ... (rest of function is unchanged) ...
    if (!element) return;

    let existingOutline = element.querySelector(':scope > .selected-outline'); // Use :scope for direct children

    if (isSelected) {
        element.classList.add('selected');
        if (!existingOutline) {
            const outline = document.createElementNS(SVG_NS, 'rect');
            outline.setAttribute('class', 'selected-outline');
            element.insertBefore(outline, element.firstChild);
            existingOutline = outline;
        }

        // --- Sizing Logic ---
        const bgRect = element.querySelector(':scope > .element-bg');
        const circle = element.querySelector(':scope > circle');
        const textEl = element.querySelector(':scope > text');
        const lineEl = element.querySelector(':scope > line');
        const pathEl = element.querySelector(':scope > path');
        const padding = PLACEMENT_GAP / 2;
        const cornerRadius = '5';
        let useBBoxFallback = false;

        if (circle && element.classList.contains('player-element')) {
            const radius = parseFloat(circle.getAttribute('r') || '0');
            existingOutline.setAttribute('x', String(-radius - padding));
            existingOutline.setAttribute('y', String(-radius - padding));
            existingOutline.setAttribute('width', String((radius * 2) + (padding * 2)));
            existingOutline.setAttribute('height', String((radius * 2) + (padding * 2)));
            existingOutline.setAttribute('rx', cornerRadius);
            existingOutline.setAttribute('ry', cornerRadius);
        } else if (bgRect) {
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
            useBBoxFallback = true;
        }

        if (useBBoxFallback) {
            const visualElement = lineEl || pathEl || textEl || element.firstElementChild;
            if (visualElement && visualElement.getBBox) {
                try {
                    const bbox = visualElement.getBBox();
                    if (bbox && (bbox.width >= 0 || bbox.height >= 0)) { // Allow zero width/height
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
                console.warn('DEBUG Select: updateElementVisualSelection - Cannot find visual element for BBox, hiding outline.');
                existingOutline.setAttribute('width', '0'); existingOutline.setAttribute('height', '0');
            }
        }
        existingOutline.setAttribute('visibility', 'visible');

    } else { // Deselecting
        element.classList.remove('selected');
        existingOutline?.remove();
    }
}

/** Updates the selection list UI */
function updateSelectionListUI() {
    // ... (rest of function is unchanged) ...
    if (!dom.selectionList) return;

    dom.selectionList.innerHTML = ''; // Clear previous list

    if (appState.selectedElements.size === 0) {
        const li = document.createElement('li');
        li.className = 'no-selection';
        li.textContent = 'None';
        dom.selectionList.appendChild(li);
    } else {
        appState.selectedElements.forEach(el => {
            const li = document.createElement('li');
            const title = el.dataset.elementTitle;
            const name = el.dataset.elementName;
            const type = el.dataset.elementType;
            const number = el.dataset.numberValue;
            let text = title || name || type || 'Unknown Element';
            if (type === 'number' && number) {
                text = `Number (${number})`;
            } else if (type === 'text') {
                const textContent = el.querySelector('text')?.textContent.substring(0, 20) + (el.querySelector('text')?.textContent.length > 20 ? '...' : '');
                text = `Text (${textContent || 'empty'})`;
            } else if (type === 'player') {
                text = `Player (${el.dataset.playerType || 'Generic'})`;
            } else if (type === 'equipment') {
                text = `Equipment (${el.dataset.equipmentType || 'Generic'})`;
            } else if (type === 'movement' || type === 'passShot') {
                text = `Line (${el.dataset.arrowType || type})`;
            }
            li.textContent = text;
            dom.selectionList.appendChild(li);
        });
    }
}


/** Clears the current element selection and visual feedback. */
export function clearSelection() {
    // console.log("DEBUG Select: Clearing selection");
    const elementsToDeselect = Array.from(appState.selectedElements);
    appState.selectedElements.clear();
    elementsToDeselect.forEach(el => updateElementVisualSelection(el, false));
    updateSelectionListUI(); // Update the list UI
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);
}

/** Handles element selection logic based on click events and Ctrl key. */
export function handleElementSelection(element, event) {
    // ... (rest of function is unchanged) ...
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
    updateSelectionListUI();
}


// --- Selection Rectangle (Marquee Select) ---

/** Initiates marquee selection on background mousedown */
export function handleMarqueeMouseDown(event) {
    // console.log("DEBUG Select: Marquee MouseDown");
    event.preventDefault();

    // Reset the flag before starting a new marquee
    appState.justFinishedMarquee = false;

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
    // ... (function remains unchanged) ...
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

/** Finalizes marquee selection on mouseup, REPLACING the current selection */
function handleMarqueeMouseUp(event) {
    if (!appState.isSelectingRect) return;
    // console.log("DEBUG Select: Marquee MouseUp - REPLACE LOGIC");

    // ---> Start Cleanup First <---
    appState.isSelectingRect = false;
    if (dom.selectionRect) { dom.selectionRect.setAttribute('visibility', 'hidden'); }
    if (_handleMarqueeMouseMove) document.removeEventListener('mousemove', _handleMarqueeMouseMove, false);
    if (_handleMarqueeMouseUp) document.removeEventListener('mouseup', _handleMarqueeMouseUp, false);
    _handleMarqueeMouseMove = null;
    _handleMarqueeMouseUp = null;
    // ---> End Cleanup <---

    const startPt = appState.selectionRectStart;
    const endPt = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    appState.selectionRectStart = null; // Clear state

    if (!startPt || !endPt) { return; }

    const selectionX = Math.min(startPt.x, endPt.x);
    const selectionY = Math.min(startPt.y, endPt.y);
    const selectionWidth = Math.abs(startPt.x - endPt.x);
    const selectionHeight = Math.abs(startPt.y - endPt.y);

    if (selectionWidth > SELECTION_RECT_MIN_SIZE || selectionHeight > SELECTION_RECT_MIN_SIZE) {
        const selectionRectBounds = { /* ... bounds calc ... */
            left: selectionX, top: selectionY,
            right: selectionX + selectionWidth, bottom: selectionY + selectionHeight
        };
        const isCrossingSelection = (endPt.x < startPt.x);
        const newlySelectedElements = new Set();
        const allElements = dom.contentLayer.querySelectorAll('.canvas-element');

        allElements.forEach(element => {
            const elementBBox = getTransformedBBox(element);
            if (!elementBBox) return;
            let shouldSelect = false;
            if (isCrossingSelection) { /* Intersect check */
                shouldSelect = !(
                    elementBBox.right < selectionRectBounds.left ||
                    elementBBox.left > selectionRectBounds.right ||
                    elementBBox.bottom < selectionRectBounds.top ||
                    elementBBox.top > selectionRectBounds.bottom
                );
            } else { /* Contain check */
                shouldSelect = (
                    elementBBox.left >= selectionRectBounds.left &&
                    elementBBox.right <= selectionRectBounds.right &&
                    elementBBox.top >= selectionRectBounds.top &&
                    elementBBox.bottom <= selectionRectBounds.bottom
                );
            }
            if (shouldSelect) { newlySelectedElements.add(element); }
        });

        // --- Replace Selection Logic ---
        const previouslySelected = new Set(appState.selectedElements);
        // Deselect old ones not in the new set
        previouslySelected.forEach(el => { if (!newlySelectedElements.has(el)) { updateElementVisualSelection(el, false); } });
        // Select new ones not in the old set (and ensure currently selected remain visually selected)
        newlySelectedElements.forEach(el => { if (!previouslySelected.has(el)) { updateElementVisualSelection(el, true); } else { updateElementVisualSelection(el, true);} });
        appState.selectedElements = newlySelectedElements; // Update state
        // --- End Replace Logic ---

        updateSelectionListUI(); // Update UI

        // *** Set the flag to prevent background click clear ***
        appState.justFinishedMarquee = true;
        // Reset the flag shortly after, allowing subsequent background clicks
        setTimeout(() => { appState.justFinishedMarquee = false; }, 0); // Use timeout 0 for minimum delay

        // No stopPropagation here - let click proceed but be ignored by app.js handler

    } else {
        // Small drag = click, clear selection
        clearSelection();
        // Don't set the flag, let background click clear logic run if needed
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
    // Reset flag on cancel too
    appState.justFinishedMarquee = false;
}
// --- End Marquee Selection ---
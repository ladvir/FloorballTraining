// js/selection.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getTransformedBBox } from './utils.js';
import { clearCollisionHighlights } from './collisions.js';
import { SVG_NS, SELECTION_RECT_MIN_SIZE, PLACEMENT_GAP } from './config.js';

/** Updates the visual selection state (outline) of a single element. */
export function updateElementVisualSelection(element, isSelected) {
    // console.log(`DEBUG Select: updateElementVisualSelection for:`, element?.id || element?.dataset?.elementType, `Selected: ${isSelected}`);
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
            // Try to get a meaningful name
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
    // console.log(`DEBUG Select: handleElementSelection called for: ${element?.id || element?.dataset?.elementType}, Ctrl: ${event.ctrlKey || event.metaKey}`);
    if (!element) return;
    const currentlySelected = appState.selectedElements.has(element);
    const isMultiSelect = event.ctrlKey || event.metaKey; // Check for Ctrl (Win/Linux) or Meta (Mac)

    if (isMultiSelect) {
        // Multi-select mode: Toggle the clicked element
        if (currentlySelected) {
            appState.selectedElements.delete(element);
            updateElementVisualSelection(element, false);
        } else {
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    } else {
        // Single-select mode: Select only the clicked element
        // 1. Check if it's already the only selected element (to allow drag)
        if (appState.selectedElements.size === 1 && currentlySelected) {
            // Do nothing, allows drag initiation on already selected single item
            // console.log("DEBUG Select: Single item already selected, allowing drag.");
        } else {
            // 2. Clear previous selections visually and from state
            const previouslySelected = Array.from(appState.selectedElements);
            appState.selectedElements.clear(); // Clear the state set
            previouslySelected.forEach(el => {
                if (el !== element) { // Don't visually deselect the one we are about to select
                    updateElementVisualSelection(el, false);
                }
            });

            // 3. Add the clicked element to the state and select it visually
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true);
        }
    }
    updateSelectionListUI(); // Update the list UI after any change
    // console.log("DEBUG Select: Selection count:", appState.selectedElements.size);
}


// --- Selection Rectangle (Marquee Select) --- REMOVED ---
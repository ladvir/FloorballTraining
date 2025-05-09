//***** js/interactions.js ******




//***** js/interactions.js ******

// js/interactions.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getOrAddTransform, getTransformedBBox } from './utils.js';
// Import handleElementSelection, clearSelection, AND updateElementVisualSelection
import { handleElementSelection, clearSelection, updateElementVisualSelection } from './selection.js'; // <-- CORRECTED IMPORT
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights, getElementDimensions } from './collisions.js'; // Import getElementDimensions
import { ROTATION_STEP, TITLE_PADDING, SVG_NS } from './config.js';
import { saveStateForUndo } from './history.js';
import {
    createPlayerElement, createBallElement, createGateElement,
    createConeElement, createLineElement, createCornerElement, createManyBallsElement,
    createNumberElement // Import number element creation
} from './elements.js'; // Import element creation functions
import { updateNumberToolDisplay, updateNumberCursor } from './tools.js'; // Import display and cursor update


// --- Element Click Handler --- (Keep unchanged)
export function handleElementClick(event) {
    const element = event.currentTarget;
    if (!element || appState.isDraggingElement || appState.isEditingText || appState.isDraggingTitle || appState.isPlacementDragging) { return; }
    if (appState.currentTool === 'select') {
        const isTitleClick = event.target.closest('.draggable-title');
        if (!isTitleClick) {
            handleElementSelection(element, event);
            // If a single text element is selected, update text property controls
            if (appState.selectedElements.size === 1) {
                const selectedEl = appState.selectedElements.values().next().value;
                if (selectedEl.dataset.elementType === 'text') {
                    updateTextPropertyControls(selectedEl); // <-- ADDED
                    if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'flex'; // <-- ADDED
                } else {
                    // If not a text element, ensure text properties toolbar is hidden or reset
                    if (appState.activeDrawingTool !== TEXT_TOOL_ID) { // Check if text tool itself is not active
                        if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'none'; // <-- ADDED
                    }
                }
            } else {
                // If multiple elements or no elements selected, and text tool not active
                if (appState.activeDrawingTool !== TEXT_TOOL_ID) {
                    if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'none'; // <-- ADDED
                }
            }
        }
        event.stopPropagation();
    }
}

// --- Element Rotation Handler --- (Keep unchanged)
export function rotateElement(element, onSuccessCallback) {
    const elementType = element.dataset.elementType;
    
    const allowRotation = !['player', 'number', /*'text',*/ 'shape', 'line', 'movement', 'passShot'].includes(elementType) || elementType === 'text';
    if (!allowRotation) { console.log(`Rotation not allowed for element type: ${elementType}`); return; }
    const rect = element.querySelector(".element-bg");
    let width = 0, height = 0, relX = 0, relY = 0;
    if (rect) { width = parseFloat(rect.getAttribute("width") || "0"); height = parseFloat(rect.getAttribute("height") || "0"); relX = parseFloat(rect.getAttribute("x") || "0"); relY = parseFloat(rect.getAttribute("y") || "0");
    } else { try { const visual = element.querySelector('line') || element.querySelector('path') || element.querySelector('circle') || element.querySelector('polygon') || element.querySelector('text') || element.firstElementChild; if (visual) { const bbox = visual.getBBox(); width = bbox.width; height = bbox.height; relX = bbox.x; relY = bbox.y; } else { const groupBBox = element.getBBox(); width = groupBBox.width; height = groupBBox.height; relX = groupBBox.x; relY = groupBBox.y; } } catch(e) { console.warn("Could not get BBox for rotation center estimation.", e); return; } }
    if (width <= 0 || height <= 0) { console.warn("Cannot rotate element with zero width or height."); return; }
    const centerX = relX + width / 2; const centerY = relY + height / 2;
    const transformList = element.transform.baseVal; const currentRotation = parseFloat(element.dataset.rotation || "0");
    const newRotation = (currentRotation + ROTATION_STEP) % 360;
    const parentRotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, centerX, centerY);
    parentRotateTransform.setRotate(newRotation, centerX, centerY); const rotatedBBox = getTransformedBBox(element);
    const collides = rotatedBBox && getCollidingElementsByBBox(rotatedBBox, element).length > 0;
    if (collides) { console.log("Rotation resulted in collision. Reverting."); parentRotateTransform.setRotate(currentRotation, centerX, centerY); const colliders = getCollidingElementsByBBox(rotatedBBox, element); colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); }); setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);
    } else { element.dataset.rotation = String(newRotation); const titleText = element.querySelector('.draggable-title'); if (titleText) { const titleX = parseFloat(titleText.getAttribute('x') || '0'); const titleY = parseFloat(titleText.getAttribute('y') || '0'); const titleTransformList = titleText.transform.baseVal; const titleRotateCenterX = centerX - titleX; const titleRotateCenterY = centerY - titleY; const titleRotateTransform = getOrAddTransform(titleTransformList, SVGTransform.SVG_TRANSFORM_ROTATE, titleRotateCenterX, titleRotateCenterY); titleRotateTransform.setRotate(-newRotation, titleRotateCenterX, titleRotateCenterY); } if (onSuccessCallback) { onSuccessCallback(); } }
}


// --- Element Drag Handlers --- (Keep unchanged)
export function handleElementMouseDown(event) {
    const element = event.currentTarget;
    if (!element || appState.isDrawingArrow || appState.isEditingText || appState.isDrawingFreehand || appState.isDraggingTitle || appState.isPlacementDragging) return;
    if (event.target.closest('.draggable-title')) { return; }
    if (appState.currentTool === 'select') {
        const wasSelected = appState.selectedElements.has(element);
        const isNowSingleSelected = appState.selectedElements.size === 1 && appState.selectedElements.has(element);
        const isMultiSelectAndWasSelected = (event.ctrlKey || event.metaKey) && wasSelected;
        if (isNowSingleSelected && !isMultiSelectAndWasSelected) {
            if (!wasSelected && appState.selectedElements.size > 1) { }
            else if (wasSelected || (!wasSelected && appState.selectedElements.size <= 1) ) {
                event.preventDefault(); event.stopPropagation();
                const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!startPoint) return;
                appState.isDraggingElement = true; element.classList.add('dragging'); clearCollisionHighlights(appState.currentlyHighlightedCollisions);
                const transformList = element.transform.baseVal; const initialTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                appState.elementStartPos = { x: initialTranslate.matrix.e, y: initialTranslate.matrix.f }; appState.dragOffsetX = startPoint.x - appState.elementStartPos.x; appState.dragOffsetY = startPoint.y - appState.elementStartPos.y;
                document.addEventListener('mousemove', handleElementDragMove, false); document.addEventListener('mouseup', handleElementDragEnd, false); document.addEventListener('mouseleave', handleElementDragEnd, false);
            }
        }
    }
}
function handleElementDragMove(event) {
    if (!appState.isDraggingElement || appState.selectedElements.size !== 1) return; const element = appState.selectedElements.values().next().value; if (!element) { handleElementDragEnd(event); return; }
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!currentPoint) return;
    const newTranslateX = currentPoint.x - appState.dragOffsetX; const newTranslateY = currentPoint.y - appState.dragOffsetY;
    const transformList = element.transform.baseVal; const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
    translateTransform.setTranslate(newTranslateX, newTranslateY); const elementType = element.dataset.elementType; const skipCollisionCheck = ['number', 'text', 'movement', 'passShot'].includes(elementType);
    if (!skipCollisionCheck) { const currentBBox = getTransformedBBox(element); if (!currentBBox) return; const newlyCollidingElements = getCollidingElementsByBBox(currentBBox, element); const newlyCollidingSet = new Set(newlyCollidingElements); const previouslyCollidingSet = appState.currentlyHighlightedCollisions; previouslyCollidingSet.forEach(collidedEl => { if (!newlyCollidingSet.has(collidedEl)) { collidedEl.classList.remove('collision-indicator'); previouslyCollidingSet.delete(collidedEl); } }); newlyCollidingSet.forEach(collidedEl => { if (!previouslyCollidingSet.has(collidedEl)) { ensureCollisionIndicatorRect(collidedEl); collidedEl.classList.add('collision-indicator'); previouslyCollidingSet.add(collidedEl); } });
    } else { clearCollisionHighlights(appState.currentlyHighlightedCollisions); }
}
export function handleElementDragEnd(event) {
    const wasDragging = appState.isDraggingElement;
    document.removeEventListener('mousemove', handleElementDragMove, false); document.removeEventListener('mouseup', handleElementDragEnd, false); document.removeEventListener('mouseleave', handleElementDragEnd, false);
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    if (wasDragging) {
        appState.isDraggingElement = false;
        if (appState.selectedElements.size === 1) {
            const elementProcessed = appState.selectedElements.values().next().value;
            if (elementProcessed) {
                elementProcessed.classList.remove('dragging'); const elementType = elementProcessed.dataset.elementType;
                const skipCollisionCheck = ['number', 'text', 'movement', 'passShot'].includes(elementType); let reverted = false;
                if (!skipCollisionCheck) {
                    const finalBBox = getTransformedBBox(elementProcessed); const collidesOnDrop = finalBBox && getCollidingElementsByBBox(finalBBox, elementProcessed).length > 0;
                    if (collidesOnDrop) { console.log("Move ended in collision. Reverting position."); const colliders = getCollidingElementsByBBox(finalBBox, elementProcessed); colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); }); setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500); const transformList = elementProcessed.transform.baseVal; const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE); translateTransform.setTranslate(appState.elementStartPos.x, appState.elementStartPos.y); reverted = true; }
                }
                if (!reverted) { const transformList = elementProcessed.transform.baseVal; const finalTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE); const dx = finalTranslate.matrix.e - appState.elementStartPos.x; const dy = finalTranslate.matrix.f - appState.elementStartPos.y; if (dx * dx + dy * dy > 1) { saveStateForUndo(); } }
            }
        }
        appState.elementStartPos = { x: 0, y: 0 }; appState.dragOffsetX = 0; appState.dragOffsetY = 0;
    }
}

// --- Title Drag Handlers --- (Keep unchanged)
export function handleTitleMouseDown(event) {
    if (appState.currentTool !== 'select' || appState.isDraggingElement || appState.isDraggingTitle || appState.isPlacementDragging) { return; }
    const titleElement = event.currentTarget; const parentElement = titleElement.closest('.canvas-element'); if (!parentElement || !titleElement) return;
    event.preventDefault(); event.stopPropagation(); appState.isDraggingTitle = true; appState.draggedTitleElement = titleElement; appState.draggedTitleParentElement = parentElement;
    titleElement.style.cursor = 'grabbing'; document.body.style.cursor = 'grabbing'; const startMousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!startMousePoint) { appState.isDraggingTitle = false; return; }
    appState.titleDragStartPoint = startMousePoint; const currentTitleX = parseFloat(titleElement.getAttribute('x') || '0'); const currentTitleY = parseFloat(titleElement.getAttribute('y') || '0');
    appState.titleDragStartOffset = { x: currentTitleX - startMousePoint.x, y: currentTitleY - startMousePoint.y };
    document.addEventListener('mousemove', handleTitleDragMove, false); document.addEventListener('mouseup', handleTitleDragEnd, false); document.addEventListener('mouseleave', handleTitleDragEnd, false);
}
function handleTitleDragMove(event) {
    if (!appState.isDraggingTitle || !appState.draggedTitleElement || !appState.draggedTitleParentElement) return; event.preventDefault();
    const currentMousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!currentMousePoint) return;
    let newTitleX = currentMousePoint.x + appState.titleDragStartOffset.x; let newTitleY = currentMousePoint.y + appState.titleDragStartOffset.y;
    const bgRect = appState.draggedTitleParentElement.querySelector('.element-bg'); const titleBBox = appState.draggedTitleElement.getBBox ? appState.draggedTitleElement.getBBox() : { width: 30, height: 12 };
    if (bgRect) { const bgX = parseFloat(bgRect.getAttribute('x') || '0'); const bgY = parseFloat(bgRect.getAttribute('y') || '0'); const bgWidth = parseFloat(bgRect.getAttribute('width') || '100'); const bgHeight = parseFloat(bgRect.getAttribute('height') || '50'); const minX = bgX + TITLE_PADDING; const minY = bgY + TITLE_PADDING; const maxX = bgX + bgWidth - titleBBox.width - TITLE_PADDING; const maxY = bgY + bgHeight - titleBBox.height - TITLE_PADDING; newTitleX = Math.max(minX, Math.min(newTitleX, maxX)); newTitleY = Math.max(minY, Math.min(newTitleY, maxY)); }
    appState.draggedTitleElement.setAttribute('x', String(newTitleX)); appState.draggedTitleElement.setAttribute('y', String(newTitleY));
}
function handleTitleDragEnd(event) {
    if (!appState.isDraggingTitle) return;
    document.removeEventListener('mousemove', handleTitleDragMove, false); document.removeEventListener('mouseup', handleTitleDragEnd, false); document.removeEventListener('mouseleave', handleTitleDragEnd, false);
    if (appState.draggedTitleElement) { appState.draggedTitleElement.style.cursor = 'grab'; } document.body.style.cursor = '';
    if (appState.draggedTitleElement && appState.draggedTitleParentElement) { const finalX = parseFloat(appState.draggedTitleElement.getAttribute('x') || '0'); const finalY = parseFloat(appState.draggedTitleElement.getAttribute('y') || '0'); appState.draggedTitleParentElement.dataset.titleOffsetX = String(finalX); appState.draggedTitleParentElement.dataset.titleOffsetY = String(finalY); saveStateForUndo(); }
    appState.isDraggingTitle = false; appState.draggedTitleElement = null; appState.draggedTitleParentElement = null; appState.titleDragStartOffset = { x: 0, y: 0 }; appState.titleDragStartPoint = { x: 0, y: 0 };
}


// --- Placement Drag Handlers (MODIFIED for Numbers) ---

/** Initiates the placement drag for click-to-place elements. */
export function startPlacementDrag(event, toolConfig, startPoint) {
    if (appState.isPlacementDragging) return; // Already placing

    clearSelection(); // Clear existing selection

    let newElement = null;

    if (toolConfig.category === 'text') {
        console.warn("startPlacementDrag called for text tool - should use showTextInput instead.");
        return; // Don't create element via placement drag
    }
    
    // Create the element based on the tool config
    if (toolConfig.category === 'number') {
        // Get the next number from state
        const numberToPlace = appState.nextNumberToPlace;
        if (typeof numberToPlace !== 'number' || numberToPlace < 1) {
            console.error("Invalid nextNumberToPlace in state:", numberToPlace);
            // Reset sequence if invalid?
            appState.nextNumberToPlace = 1;
            updateNumberToolDisplay(); // Update UI
            return; // Don't proceed with placement
        }
        const numberStr = String(numberToPlace);
        // Use the generic tool config but override text/label
        const tempConfig = {...toolConfig, text: numberStr, label: numberStr};
        newElement = createNumberElement(tempConfig, startPoint.x, startPoint.y);

    } else if (toolConfig.category === 'player') {
        // Create player element at the start point
        newElement = createPlayerElement(toolConfig, startPoint.x, startPoint.y);
    } else if (toolConfig.category === 'equipment') {
        // Create equipment element at the start point
        switch (toolConfig.toolId) {
            case 'ball': newElement = createBallElement(toolConfig, startPoint.x, startPoint.y); break;
            case 'many-balls': newElement = createManyBallsElement(toolConfig, startPoint.x, startPoint.y); break;
            case 'gate': newElement = createGateElement(toolConfig, startPoint.x, startPoint.y); break;
            case 'cone': newElement = createConeElement(toolConfig, startPoint.x, startPoint.y); break;
            case 'barrier-line': newElement = createLineElement(toolConfig, startPoint.x, startPoint.y); break;
            case 'barrier-corner': newElement = createCornerElement(toolConfig, startPoint.x, startPoint.y); break;
        }
    }
    // Shapes and Lines are handled by drag drawing (mousedown/mousemove/mouseup sequence)
    // Text is handled by the text input box

    if (!newElement) {
        console.error("Failed to create element for placement drag.");
        return;
    }

    dom.contentLayer.appendChild(newElement); // Add the element to the DOM immediately
    appState.placementDraggedElement = newElement;
    appState.isPlacementDragging = true;
    appState.placementDragStartPoint = startPoint; // Mouse position at start

    const elementDims = getElementDimensions(newElement);
    appState.placementElementOffset = {
        x: -elementDims.x,
        y: -elementDims.y
    };

    // Check initial collision and highlight
    const initialBBox = getTransformedBBox(newElement);
    if (initialBBox) {
        const colliders = getCollidingElementsByBBox(initialBBox, newElement);
        colliders.forEach(el => {
            ensureCollisionIndicatorRect(el);
            el.classList.add('collision-indicator');
            appState.currentlyHighlightedCollisions.add(el);
        });
    }
}

/** Handles mousemove during placement drag. */
export function handlePlacementDragMove(event) {
    if (!appState.isPlacementDragging || !appState.placementDraggedElement) return;
    event.preventDefault();

    const currentMousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentMousePoint) return;

    const element = appState.placementDraggedElement;
    const transformList = element.transform.baseVal;
    const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);

    const newTranslateX = currentMousePoint.x + appState.placementElementOffset.x;
    const newTranslateY = currentMousePoint.y + appState.placementElementOffset.y;

    translateTransform.setTranslate(newTranslateX, newTranslateY);

    // Check for collisions and update highlights
    const currentBBox = getTransformedBBox(element);
    if (currentBBox) {
        const newlyCollidingElements = getCollidingElementsByBBox(currentBBox, element);
        const newlyCollidingSet = new Set(newlyCollidingElements);
        const previouslyCollidingSet = appState.currentlyHighlightedCollisions;

        previouslyCollidingSet.forEach(collidedEl => {
            if (!newlyCollidingSet.has(collidedEl)) {
                collidedEl.classList.remove('collision-indicator');
                previouslyCollidingSet.delete(collidedEl);
            }
        });
        newlyCollidingSet.forEach(collidedEl => {
            if (!previouslyCollidingSet.has(collidedEl)) {
                ensureCollisionIndicatorRect(collidedEl);
                collidedEl.classList.add('collision-indicator');
                previouslyCollidingSet.add(collidedEl);
            }
        });
    } else {
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }
}

/** Finalizes or cancels the placement drag on mouseup or Escape. */
export function endPlacementDrag(event, onSuccessCallback, cancelled = false) {
    if (!appState.isPlacementDragging || !appState.placementDraggedElement) return;

    const element = appState.placementDraggedElement;
    appState.isPlacementDragging = false;
    appState.placementDraggedElement = null;
    appState.placementDragStartPoint = null;
    appState.placementElementOffset = { x: 0, y: 0 };

    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    if (cancelled) {
        // Remove the element if placement was cancelled
        element.remove();
        console.log("Placement cancelled, element removed.");
        // Don't change nextNumberToPlace on cancel
        // No state save on cancel
    } else {
        // Check for collisions one last time on drop
        const finalBBox = getTransformedBBox(element);
        const collidesOnDrop = finalBBox && getCollidingElementsByBBox(finalBBox, element).length > 0;

        if (collidesOnDrop) {
            console.log("Placement ended in collision. Removing element.");
            // Highlight colliders briefly
            const colliders = getCollidingElementsByBBox(finalBBox, element);
            colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); });
            setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);
            // Remove the element
            element.remove();
            // Don't change nextNumberToPlace on failed placement
        } else {
            // Placement successful
            console.log("Placement successful.");
            // Select the newly placed element
            clearSelection();
            appState.selectedElements.add(element);
            updateElementVisualSelection(element, true); // Use imported function

            // Increment number ONLY on successful placement of a number element
            if (element.dataset.elementType === 'number') {
                // Increment only if it's a valid number
                if (typeof appState.nextNumberToPlace === 'number' && appState.nextNumberToPlace > 0) {
                    appState.nextNumberToPlace++;
                    console.log("Next number will be:", appState.nextNumberToPlace);
                    updateNumberToolDisplay(); // Update the description span
                    updateNumberCursor();      // Update the cursor preview
                } else {
                    console.warn("Cannot increment nextNumberToPlace, it's invalid:", appState.nextNumberToPlace);
                    // Reset sequence maybe?
                    appState.nextNumberToPlace = 1;
                    updateNumberToolDisplay();
                    updateNumberCursor();
                }
            }

            // Save state
            if (onSuccessCallback) {
                onSuccessCallback();
            }
        }
    }
}


// --- Attach Listeners --- (Keep unchanged)
export function makeElementInteractive(element) {
    if (!element) return;
    element.removeEventListener("mousedown", handleElementMouseDown);
    element.removeEventListener("click", handleElementClick);
    element.addEventListener("mousedown", handleElementMouseDown);
    element.addEventListener("click", handleElementClick);
    const titleElement = element.querySelector('.element-label.draggable-title');
    if (titleElement) {
        titleElement.removeEventListener("mousedown", handleTitleMouseDown);
        titleElement.addEventListener("mousedown", handleTitleMouseDown);
    }
}
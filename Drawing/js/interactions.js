// js/interactions.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getOrAddTransform, getTransformedBBox } from './utils.js';
import { handleElementSelection } from './selection.js';
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
import { ROTATION_STEP } from './config.js';


// --- Click Handler ---

/** Handles click events on canvas elements (now only for selection tool). */
export function handleElementClick(event) {
    const element = event.currentTarget;
    if (!element || appState.isDraggingElement || appState.isSelectingRect || appState.isDrawingArrow || appState.isEditingText || appState.isDrawingFreehand) return;

    // The delete/rotate logic is now handled directly in app.js's canvas click listener
    // to simplify state saving. This handler might not be strictly needed anymore
    // unless specific click behavior (not drag/delete/rotate) is added later.
    // For now, let it propagate to the main canvas click handler in app.js.

    // event.stopPropagation(); // Keep propagation for now
}

// Moved rotateElement logic to app.js initially, but better to keep it here and pass callback
/** Rotates an element and calls a callback on success. */
export function rotateElement(element, onSuccessCallback) {
    const elementType = element.dataset.elementType;
    const allowRotation = elementType !== 'player' && elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot';
    if (!allowRotation) { console.log(`Rotation not allowed for element type: ${elementType}`); return; }

    // Base rotation center on BBox center if bgRect isn't available
    const rect = element.querySelector(".element-bg");
    let width = 0, height = 0, relX = 0, relY = 0;

    if (rect) {
        width = parseFloat(rect.getAttribute("width") || "0");
        height = parseFloat(rect.getAttribute("height") || "0");
        relX = parseFloat(rect.getAttribute("x") || "0");
        relY = parseFloat(rect.getAttribute("y") || "0");
    } else {
        // Estimate from visual BBox if no bgRect (less reliable for complex shapes)
        try {
            // Prioritize specific visual elements if possible
            const visual = element.querySelector('line') || element.querySelector('path') || element.querySelector('circle') || element.querySelector('polygon') || element.querySelector('text') || element.firstElementChild;
            if (visual) {
                const bbox = visual.getBBox();
                width = bbox.width;
                height = bbox.height;
                relX = bbox.x;
                relY = bbox.y;
            } else {
                // Fallback: getBBox of the group itself
                const groupBBox = element.getBBox();
                width = groupBBox.width;
                height = groupBBox.height;
                relX = groupBBox.x;
                relY = groupBBox.y;
            }
        } catch(e) { console.warn("Could not get BBox for rotation center estimation.", e); return; }
    }

    if (width <= 0 || height <= 0) {
        console.warn("Cannot rotate element with zero width or height.");
        return;
    }

    const centerX = relX + width / 2;
    const centerY = relY + height / 2;

    const transformList = element.transform.baseVal;
    const currentRotation = parseFloat(element.dataset.rotation || "0");
    const newRotation = (currentRotation + ROTATION_STEP) % 360;
    const rotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, centerX, centerY);

    rotateTransform.setRotate(newRotation, centerX, centerY);

    const rotatedBBox = getTransformedBBox(element);
    const collides = rotatedBBox && getCollidingElementsByBBox(rotatedBBox, element).length > 0;

    if (collides) {
        console.log("Rotation resulted in collision. Reverting.");
        const colliders = getCollidingElementsByBBox(rotatedBBox, element);
        colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); });
        setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);
        rotateTransform.setRotate(currentRotation, centerX, centerY); // Revert transform
        element.dataset.rotation = String(currentRotation); // Keep old data attribute
    } else {
        element.dataset.rotation = String(newRotation); // Update data attribute
        if (onSuccessCallback) {
            onSuccessCallback(); // Call the history save function
        }
    }
}


// --- Drag Handlers ---

/** Handles mousedown events on canvas elements. */
function handleElementMouseDown(event) {
    const element = event.currentTarget;
    // console.log('DEBUG Select: Mousedown on element:', element, 'Target:', event.target, 'Type:', element.dataset.elementType);
    if (!element || appState.isDrawingArrow || appState.isEditingText || appState.isDrawingFreehand) return;

    const elementType = element.dataset.elementType;
    // Check if click is directly on the element group or its primary visual content
    // Exclude clicks specifically on handles if they existed (they don't now)
    const isBodyClick = event.target.closest('.canvas-element') === element && !event.target.closest('foreignObject'); // Simplified: click anywhere on the element group

    // Prevent interactions based on current tool - handled in app.js canvas click now
    // if ((appState.currentTool === 'delete' && isBodyClick) ||
    //     (appState.currentTool === 'rotate' && isBodyClick) ||
    //     appState.currentTool === 'draw' || appState.currentTool === 'text')
    // {
    //     console.log(`DEBUG Select: Mousedown ignored due to current tool: ${appState.currentTool}`);
    //     // Let rotate/delete clicks propagate to the canvas listener in app.js
    //     // if (appState.currentTool !== 'draw' && appState.currentTool !== 'text') event.stopPropagation();
    //     return;
    // }

    // Select Tool Drag Logic
    if (appState.currentTool === 'select') {
        let initiateDrag = false;
        const wasSelectedBeforeClick = appState.selectedElements.has(element);
        const numSelectedBeforeClick = appState.selectedElements.size;

        if (isBodyClick) {
            // console.log('DEBUG Select: Calling handleElementSelection for:', element);
            handleElementSelection(element, event); // Updates selection internally
        } else {
            // console.log('DEBUG Select: Mousedown ignored (not direct element click)');
            return; // Don't initiate drag if click wasn't directly on the element
        }

        const isNowSingleSelected = appState.selectedElements.size === 1 && appState.selectedElements.has(element);

        // Initiate drag if the element is the only one selected AFTER the click/selection update
        if (isBodyClick && isNowSingleSelected) {
            initiateDrag = true;
            // console.log('DEBUG Select: Initiating drag via body click (single selected)');
        }

        // Initiate Drag
        if (initiateDrag) {
            // Double check selection state just before starting drag listeners
            if (appState.selectedElements.size !== 1 || !appState.selectedElements.has(element)) {
                console.error("Drag init aborted: Inconsistent selection state.");
                return;
            }
            event.preventDefault(); event.stopPropagation();
            const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
            if (!startPoint) return;
            appState.isDraggingElement = true; element.classList.add('dragging'); clearCollisionHighlights(appState.currentlyHighlightedCollisions);
            const transformList = element.transform.baseVal; const initialTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
            appState.elementStartPos = { x: initialTranslate.matrix.e, y: initialTranslate.matrix.f }; appState.dragOffsetX = startPoint.x - appState.elementStartPos.x; appState.dragOffsetY = startPoint.y - appState.elementStartPos.y;
            document.addEventListener('mousemove', handleElementDragMove, false); document.addEventListener('mouseup', handleElementDragEnd, false); document.addEventListener('mouseleave', handleElementDragEnd, false); // Use mouseleave too
        } else {
            // console.log('DEBUG Select: Drag not initiated.');
        }
    }
}


/** Handles mousemove during element drag. */
function handleElementDragMove(event) {
    if (!appState.isDraggingElement || appState.selectedElements.size !== 1) return;
    const element = appState.selectedElements.values().next().value;
    if (!element) { handleElementDragEnd(event); return; } // Safety check
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return; // Ignore if cursor is off SVG
    const newTranslateX = currentPoint.x - appState.dragOffsetX; const newTranslateY = currentPoint.y - appState.dragOffsetY;
    const transformList = element.transform.baseVal; const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
    translateTransform.setTranslate(newTranslateX, newTranslateY);
    const elementType = element.dataset.elementType; const skipCollisionCheck = ['number', 'text', 'movement', 'passShot'].includes(elementType);
    if (!skipCollisionCheck) {
        const currentBBox = getTransformedBBox(element); if (!currentBBox) return;
        const newlyCollidingElements = getCollidingElementsByBBox(currentBBox, element); const newlyCollidingSet = new Set(newlyCollidingElements); const previouslyCollidingSet = appState.currentlyHighlightedCollisions;
        previouslyCollidingSet.forEach(collidedEl => { if (!newlyCollidingSet.has(collidedEl)) { collidedEl.classList.remove('collision-indicator'); previouslyCollidingSet.delete(collidedEl); } });
        newlyCollidingSet.forEach(collidedEl => { if (!previouslyCollidingSet.has(collidedEl)) { ensureCollisionIndicatorRect(collidedEl); collidedEl.classList.add('collision-indicator'); previouslyCollidingSet.add(collidedEl); } });
    } else { clearCollisionHighlights(appState.currentlyHighlightedCollisions); }
}


/** Handles mouseup/mouseleave after element drag. */
export function handleElementDragEnd(event) { // Export needed by app.js for state saving ref
    const wasDragging = appState.isDraggingElement;
    // Remove listeners immediately
    document.removeEventListener('mousemove', handleElementDragMove, false);
    document.removeEventListener('mouseup', handleElementDragEnd, false);
    document.removeEventListener('mouseleave', handleElementDragEnd, false); // Remove mouseleave too

    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    if (wasDragging) {
        appState.isDraggingElement = false; // Set state first
        const elementProcessed = appState.selectedElements.values().next().value; // Get the element that was dragged

        if (elementProcessed) {
            elementProcessed.classList.remove('dragging');
            const elementType = elementProcessed.dataset.elementType;
            const skipCollisionCheck = ['number', 'text', 'movement', 'passShot'].includes(elementType);
            let reverted = false;

            if (!skipCollisionCheck) {
                const finalBBox = getTransformedBBox(elementProcessed);
                const collidesOnDrop = finalBBox && getCollidingElementsByBBox(finalBBox, elementProcessed).length > 0;

                if (collidesOnDrop) {
                    console.log("Move ended in collision. Reverting position.");
                    const colliders = getCollidingElementsByBBox(finalBBox, elementProcessed);
                    colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); });
                    setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);

                    const transformList = elementProcessed.transform.baseVal;
                    const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                    translateTransform.setTranslate(appState.elementStartPos.x, appState.elementStartPos.y);
                    reverted = true;
                }
            }

            // Only save state if the position actually changed and wasn't reverted
            if (!reverted) {
                // Check if position actually changed significantly
                const transformList = elementProcessed.transform.baseVal;
                const finalTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                const dx = finalTranslate.matrix.e - appState.elementStartPos.x;
                const dy = finalTranslate.matrix.f - appState.elementStartPos.y;
                if (dx * dx + dy * dy > 1) { // Only save if moved more than a pixel
                    appState.saveStateAfterDrag = true; // Flag to save state in app.js
                }
            }
        }
        // Reset drag state variables
        appState.elementStartPos = { x: 0, y: 0 };
        appState.dragOffsetX = 0;
        appState.dragOffsetY = 0;

        // Check the flag and save state if needed (using imported function)
        if (appState.saveStateAfterDrag) {
            appState.saveStateAfterDrag = false; // Reset flag
            import('./history.js').then(historyModule => {
                historyModule.saveStateForUndo();
            }).catch(err => console.error("Failed to load history module for saving state:", err));
        }
    }
}


// --- Attach Listeners ---
/** Adds mouse event listeners to a canvas element. */
export function makeElementInteractive(element) {
    if (!element) return;
    // Remove potentially duplicated listeners before adding
    element.removeEventListener("mousedown", handleElementMouseDown);
    element.removeEventListener("click", handleElementClick); // Keep click for potential future use

    element.addEventListener("mousedown", handleElementMouseDown);
    element.addEventListener("click", handleElementClick);
}
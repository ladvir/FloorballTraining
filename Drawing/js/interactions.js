// js/interactions.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getOrAddTransform, getTransformedBBox } from './utils.js';
import { handleElementSelection } from './selection.js'; // Use exported function
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
// import { setActiveTool } from './tools.js'; // Don't call setActiveTool directly on element interaction
import { ROTATION_STEP } from './config.js';


// --- Click Handler ---

/** Handles click events on canvas elements (for select, delete, rotate). */
function handleElementClick(event) {
    const element = event.currentTarget;
    if (!element || appState.isDraggingElement || appState.isSelectingRect) return;

    const targetClasses = event.target.classList;
    const isHandleClick = targetClasses.contains('move-handle');

    if (!isHandleClick) { // Only act on body clicks
        if (appState.currentTool === 'delete') {
            if (appState.selectedElements.has(element)) {
                appState.selectedElements.delete(element);
            }
            element.remove();
        } else if (appState.currentTool === 'rotate') {
            rotateElement(element);
        }
        // Selection itself is primarily handled on mousedown for drag initiation
    }
    event.stopPropagation();
}

function rotateElement(element) {
    const isPlayer = element.classList.contains('player-element');
    if (isPlayer) {
        console.log("Players cannot be rotated.");
        return;
    }

    const rect = element.querySelector(".element-bg");
    if (!rect) return;
    const width = parseFloat(rect.getAttribute("width") || "0");
    const height = parseFloat(rect.getAttribute("height") || "0");
    if (width <= 0 || height <= 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const transformList = element.transform.baseVal;
    const currentRotation = parseFloat(element.dataset.rotation || "0");
    const newRotation = (currentRotation + ROTATION_STEP) % 360;
    const rotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, centerX, centerY);

    rotateTransform.setRotate(newRotation, centerX, centerY); // Try rotation

    // Check collision
    const rotatedBBox = getTransformedBBox(element);
    const collides = rotatedBBox && getCollidingElementsByBBox(rotatedBBox, element).length > 0;

    if (collides) {
        console.log("Rotation resulted in BBox collision. Reverting.");
        rotateTransform.setRotate(currentRotation, centerX, centerY); // Revert visually
        element.dataset.rotation = String(currentRotation); // Keep old data
    } else {
        element.dataset.rotation = String(newRotation); // Update data if valid
    }
}


// --- Drag Handlers ---

/**
 * Handles mousedown events on canvas elements.
 * Manages selection updates and initiates drag for singly selected elements.
 */
function handleElementMouseDown(event) {
    const element = event.currentTarget;
    if (!element) return;

    const targetClasses = event.target.classList;
    const isPlayer = element.classList.contains('player-element');
    const isMoveHandle = !isPlayer && targetClasses.contains('move-handle');
    const isBodyClick = !isMoveHandle;

    // Prevent interactions based on current tool
    if ((appState.currentTool === 'delete' && isBodyClick) ||
        (appState.currentTool === 'rotate' && isBodyClick) ||
        appState.currentTool === 'draw')
    {
        if (appState.currentTool !== 'draw') event.stopPropagation(); // Allow delete/rotate click event
        return;
    }

    // Select Tool Drag Logic
    if (appState.currentTool === 'select') {
        let initiateDrag = false;
        const wasSelectedBeforeClick = appState.selectedElements.has(element);
        const numSelectedBeforeClick = appState.selectedElements.size;

        // 1. Update selection state
        if (isBodyClick || isMoveHandle) {
            handleElementSelection(element, event); // Updates selection internally
        } else {
            return; // Ignore clicks on other parts for now
        }

        // 2. Determine if drag should be initiated
        const isNowSingleSelected = appState.selectedElements.size === 1 && appState.selectedElements.has(element);
        const wasAlreadySingleSelected = wasSelectedBeforeClick && numSelectedBeforeClick === 1;

        if (isMoveHandle) {
            if (isNowSingleSelected) initiateDrag = true;
            else console.warn("Move handle clicked, but element is not singly selected.");
        } else if (isBodyClick) {
            if (!event.shiftKey && isNowSingleSelected && wasAlreadySingleSelected) {
                initiateDrag = true;
            }
        }

        // 3. Initiate Drag
        if (initiateDrag) {
            // Ensure state consistency
            if (appState.selectedElements.size !== 1 || !appState.selectedElements.has(element)) {
                console.error("Drag init aborted: Inconsistent selection state.");
                return;
            }

            event.preventDefault();
            event.stopPropagation(); // Prevent canvas mousedown handler (marquee select)

            const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
            if (!startPoint) return;

            appState.isDraggingElement = true;
            element.classList.add('dragging');
            clearCollisionHighlights(appState.currentlyHighlightedCollisions);

            const transformList = element.transform.baseVal;
            const initialTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
            appState.elementStartPos = { x: initialTranslate.matrix.e, y: initialTranslate.matrix.f };
            appState.dragOffsetX = startPoint.x - appState.elementStartPos.x;
            appState.dragOffsetY = startPoint.y - appState.elementStartPos.y;

            document.addEventListener('mousemove', handleElementDragMove, false);
            document.addEventListener('mouseup', handleElementDragEnd, false);
            document.addEventListener('mouseleave', handleElementDragEnd, false);
        }
    }
}


/** Handles mousemove during element drag. */
function handleElementDragMove(event) {
    if (!appState.isDraggingElement || appState.selectedElements.size !== 1) return;

    const element = appState.selectedElements.values().next().value;
    if (!element) {
        handleElementDragEnd(event); // Abort if element somehow missing
        return;
    }

    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;

    const newTranslateX = currentPoint.x - appState.dragOffsetX;
    const newTranslateY = currentPoint.y - appState.dragOffsetY;

    const transformList = element.transform.baseVal;
    const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
    translateTransform.setTranslate(newTranslateX, newTranslateY);

    // Collision Highlighting During Drag
    const currentBBox = getTransformedBBox(element);
    if (!currentBBox) return;

    const newlyCollidingElements = getCollidingElementsByBBox(currentBBox, element);
    const newlyCollidingSet = new Set(newlyCollidingElements);
    const previouslyCollidingSet = appState.currentlyHighlightedCollisions;

    // Update highlights
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
}


/** Handles mouseup/mouseleave after element drag. */
function handleElementDragEnd(event) {
    const wasDragging = appState.isDraggingElement;

    document.removeEventListener('mousemove', handleElementDragMove, false);
    document.removeEventListener('mouseup', handleElementDragEnd, false);
    document.removeEventListener('mouseleave', handleElementDragEnd, false);

    clearCollisionHighlights(appState.currentlyHighlightedCollisions); // Clear highlights always

    if (wasDragging) {
        appState.isDraggingElement = false;
        const elementProcessed = appState.selectedElements.values().next().value;

        if (elementProcessed) {
            elementProcessed.classList.remove('dragging');
            const finalBBox = getTransformedBBox(elementProcessed);
            const collidesOnDrop = finalBBox && getCollidingElementsByBBox(finalBBox, elementProcessed).length > 0;

            if (collidesOnDrop) {
                console.log("Move ended in BBox collision. Reverting position.");
                const transformList = elementProcessed.transform.baseVal;
                const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                translateTransform.setTranslate(appState.elementStartPos.x, appState.elementStartPos.y);
            }
        }
        appState.elementStartPos = { x: 0, y: 0 };
        appState.dragOffsetX = 0;
        appState.dragOffsetY = 0;
    }
}


// --- Attach Listeners ---
/** Adds mouse event listeners to a canvas element. Exported for use in elements.js */
export function makeElementInteractive(element) {
    if (!element) return;
    element.removeEventListener("mousedown", handleElementMouseDown);
    element.removeEventListener("click", handleElementClick);
    element.addEventListener("mousedown", handleElementMouseDown);
    element.addEventListener("click", handleElementClick);
}
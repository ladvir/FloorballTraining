// js/interactions.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getOrAddTransform, getTransformedBBox } from './utils.js';
import { handleElementSelection } from './selection.js';
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
import { ROTATION_STEP } from './config.js';


// --- Click Handler ---

/** Handles click events on canvas elements (for select, delete, rotate). */
function handleElementClick(event) {
    const element = event.currentTarget;
    if (!element || appState.isDraggingElement || appState.isSelectingRect || appState.isDrawingArrow || appState.isEditingText) return; // Prevent clicks during other actions

    const targetClasses = event.target.classList;
    const isHandleClick = targetClasses.contains('move-handle');
    const elementType = element.dataset.elementType;

    if (!isHandleClick) { // Only act on body clicks
        if (appState.currentTool === 'delete') {
            if (appState.selectedElements.has(element)) {
                appState.selectedElements.delete(element);
            }
            element.remove();
        } else if (appState.currentTool === 'rotate') {
            // Prevent rotating disallowed types
            if (elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot') {
                rotateElement(element);
            } else {
                console.log(`Rotation not allowed for element type: ${elementType}`);
            }
        }
    }
    event.stopPropagation();
}

function rotateElement(element) {
    const elementType = element.dataset.elementType;
    // Double check rotation allowance
    if (elementType === 'player' || elementType === 'number' || elementType === 'text' || elementType === 'movement' || elementType === 'passShot') {
        console.log(`Rotation not allowed for element type: ${elementType}`);
        return;
    }

    const rect = element.querySelector(".element-bg"); // Rotation based on bgRect if present
    if (!rect) {
        console.warn("Cannot rotate element without .element-bg for reference.");
        return; // Cannot easily determine center without bgRect
    }
    const width = parseFloat(rect.getAttribute("width") || "0");
    const height = parseFloat(rect.getAttribute("height") || "0");
    if (width <= 0 || height <= 0) return;

    // Rotation origin relative to the group's coordinate system (usually top-left of bgRect is 0,0)
    const bgRectX = parseFloat(rect.getAttribute('x') || '0');
    const bgRectY = parseFloat(rect.getAttribute('y') || '0');
    const centerX = bgRectX + width / 2;
    const centerY = bgRectY + height / 2;

    const transformList = element.transform.baseVal;
    const currentRotation = parseFloat(element.dataset.rotation || "0");
    const newRotation = (currentRotation + ROTATION_STEP) % 360;
    const rotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, centerX, centerY);

    rotateTransform.setRotate(newRotation, centerX, centerY);

    // --- Check collision ---
    const rotatedBBox = getTransformedBBox(element);
    const collides = rotatedBBox && getCollidingElementsByBBox(rotatedBBox, element).length > 0;

    if (collides) {
        console.log("Rotation resulted in collision. Reverting.");
        const colliders = getCollidingElementsByBBox(rotatedBBox, element);
        colliders.forEach(el => {
            ensureCollisionIndicatorRect(el);
            el.classList.add('collision-indicator');
        });
        setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);

        rotateTransform.setRotate(currentRotation, centerX, centerY);
        element.dataset.rotation = String(currentRotation);
    } else {
        element.dataset.rotation = String(newRotation);
    }
}


// --- Drag Handlers ---

/** Handles mousedown events on canvas elements. */
function handleElementMouseDown(event) {
    const element = event.currentTarget;
    console.log('DEBUG Select: Mousedown on element:', element, 'Target:', event.target, 'Type:', element.dataset.elementType);
    if (!element || appState.isDrawingArrow || appState.isEditingText) return; // Prevent during arrow/text input

    const targetClasses = event.target.classList;
    const elementType = element.dataset.elementType;
    const isPlayer = elementType === 'player';
    const allowMoveHandle = elementType !== 'player' && elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot';
    const isMoveHandle = allowMoveHandle && targetClasses.contains('move-handle');
    // Check if click is on the main visual part or background (excluding handles)
    const isBodyClick = !isMoveHandle && event.target.closest('.canvas-element') === element && !event.target.classList.contains('move-handle') && !event.target.closest('foreignObject');


    // Prevent interactions based on current tool
    if ((appState.currentTool === 'delete' && isBodyClick) ||
        (appState.currentTool === 'rotate' && isBodyClick) ||
        appState.currentTool === 'draw' || appState.currentTool === 'text') // Also block during text tool mode
    {
        console.log(`DEBUG Select: Mousedown ignored due to current tool: ${appState.currentTool}`);
        if (appState.currentTool !== 'draw' && appState.currentTool !== 'text') event.stopPropagation();
        return;
    }

    // Select Tool Drag Logic
    if (appState.currentTool === 'select') {
        let initiateDrag = false;
        const wasSelectedBeforeClick = appState.selectedElements.has(element);
        const numSelectedBeforeClick = appState.selectedElements.size;

        if (isBodyClick || isMoveHandle) {
            console.log('DEBUG Select: Calling handleElementSelection for:', element);
            handleElementSelection(element, event);
        } else {
            console.log('DEBUG Select: Mousedown ignored (not body/handle)');
            return;
        }

        const isNowSingleSelected = appState.selectedElements.size === 1 && appState.selectedElements.has(element);

        if (isMoveHandle) { // Drag only possible via move handle for types that have it
            if (isNowSingleSelected) {
                initiateDrag = true;
                console.log('DEBUG Select: Initiating drag via move handle');
            } else {
                console.warn("Move handle clicked, but element is not singly selected.");
            }
        } else if (isBodyClick) {
            // Allow body drag ONLY for types WITHOUT move handles (player, number, text, arrow)
            if (!allowMoveHandle && isNowSingleSelected) {
                initiateDrag = true;
                console.log('DEBUG Select: Initiating drag via body click (no move handle type)');
            } else if (allowMoveHandle) {
                console.log('DEBUG Select: Body click on element with move handle - select only, no drag start.');
            }
        }

        // 3. Initiate Drag
        if (initiateDrag) {
            if (appState.selectedElements.size !== 1 || !appState.selectedElements.has(element)) {
                console.error("Drag init aborted: Inconsistent selection state.");
                return;
            }
            event.preventDefault();
            event.stopPropagation();

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
        } else {
            console.log('DEBUG Select: Drag not initiated.');
        }
    }
}


/** Handles mousemove during element drag. */
function handleElementDragMove(event) {
    // ... (implementation remains the same) ...
    if (!appState.isDraggingElement || appState.selectedElements.size !== 1) return;

    const element = appState.selectedElements.values().next().value;
    if (!element) {
        handleElementDragEnd(event);
        return;
    }

    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;

    const newTranslateX = currentPoint.x - appState.dragOffsetX;
    const newTranslateY = currentPoint.y - appState.dragOffsetY;

    const transformList = element.transform.baseVal;
    const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
    translateTransform.setTranslate(newTranslateX, newTranslateY);

    // Collision Highlighting During Drag (Skip for non-colliding types)
    const elementType = element.dataset.elementType;
    const skipCollisionCheck = ['number', 'text', 'movement', 'passShot'].includes(elementType);

    if (!skipCollisionCheck) {
        const currentBBox = getTransformedBBox(element);
        if (!currentBBox) return;

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
        // Ensure highlights are cleared if dragging a non-colliding element
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }
}


/** Handles mouseup/mouseleave after element drag. */
function handleElementDragEnd(event) {
    const wasDragging = appState.isDraggingElement;

    document.removeEventListener('mousemove', handleElementDragMove, false);
    document.removeEventListener('mouseup', handleElementDragEnd, false);
    document.removeEventListener('mouseleave', handleElementDragEnd, false);

    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    if (wasDragging) {
        appState.isDraggingElement = false;
        const elementProcessed = appState.selectedElements.values().next().value;

        if (elementProcessed) {
            elementProcessed.classList.remove('dragging');
            const elementType = elementProcessed.dataset.elementType;
            const skipCollisionCheck = ['number', 'text', 'movement', 'passShot'].includes(elementType);

            if (!skipCollisionCheck) {
                const finalBBox = getTransformedBBox(elementProcessed);
                const collidesOnDrop = finalBBox && getCollidingElementsByBBox(finalBBox, elementProcessed).length > 0;

                if (collidesOnDrop) {
                    console.log("Move ended in collision. Reverting position.");
                    const colliders = getCollidingElementsByBBox(finalBBox, elementProcessed);
                    colliders.forEach(el => {
                        ensureCollisionIndicatorRect(el);
                        el.classList.add('collision-indicator');
                    });
                    setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);

                    const transformList = elementProcessed.transform.baseVal;
                    const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                    translateTransform.setTranslate(appState.elementStartPos.x, appState.elementStartPos.y);
                }
            } // End collision check block
        }
        appState.elementStartPos = { x: 0, y: 0 };
        appState.dragOffsetX = 0;
        appState.dragOffsetY = 0;
    }
}


// --- Attach Listeners ---
/** Adds mouse event listeners to a canvas element. */
export function makeElementInteractive(element) {
    if (!element) return;
    element.removeEventListener("mousedown", handleElementMouseDown);
    element.removeEventListener("click", handleElementClick);
    element.addEventListener("mousedown", handleElementMouseDown);
    element.addEventListener("click", handleElementClick);
}
// js/interactions.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getOrAddTransform, getTransformedBBox } from './utils.js';
import { handleElementSelection } from './selection.js';
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
import { ROTATION_STEP, TITLE_PADDING, SVG_NS } from './config.js'; // Added TITLE_PADDING, SVG_NS
// Import history save function for title drag end
import { saveStateForUndo } from './history.js';


// --- Element Click Handler (Selection Only) ---
export function handleElementClick(event) {
    const element = event.currentTarget;
    if (!element || appState.isDraggingElement || appState.isSelectingRect || appState.isDrawingArrow || appState.isEditingText || appState.isDrawingFreehand || appState.isDraggingTitle) return;

    if (appState.currentTool === 'select') {
        const isTitleClick = event.target.closest('.draggable-title');
        if (!isTitleClick) {
            handleElementSelection(element, event);
        }
    }
}

// --- Element Rotation Handler ---
/** Rotates an element and its title (applying inverse rotation) and calls a callback on success. */
export function rotateElement(element, onSuccessCallback) {
    const elementType = element.dataset.elementType;
    const allowRotation = elementType !== 'player' && elementType !== 'number' && elementType !== 'text' && elementType !== 'movement' && elementType !== 'passShot';
    if (!allowRotation) { console.log(`Rotation not allowed for element type: ${elementType}`); return; }

    const rect = element.querySelector(".element-bg");
    let width = 0, height = 0, relX = 0, relY = 0;

    if (rect) {
        width = parseFloat(rect.getAttribute("width") || "0");
        height = parseFloat(rect.getAttribute("height") || "0");
        relX = parseFloat(rect.getAttribute("x") || "0");
        relY = parseFloat(rect.getAttribute("y") || "0");
    } else {
        try {
            const visual = element.querySelector('line') || element.querySelector('path') || element.querySelector('circle') || element.querySelector('polygon') || element.querySelector('text') || element.firstElementChild;
            if (visual) {
                const bbox = visual.getBBox();
                width = bbox.width; height = bbox.height; relX = bbox.x; relY = bbox.y;
            } else {
                const groupBBox = element.getBBox();
                width = groupBBox.width; height = groupBBox.height; relX = groupBBox.x; relY = groupBBox.y;
            }
        } catch(e) { console.warn("Could not get BBox for rotation center estimation.", e); return; }
    }

    if (width <= 0 || height <= 0) { console.warn("Cannot rotate element with zero width or height."); return; }

    const centerX = relX + width / 2;
    const centerY = relY + height / 2;

    const transformList = element.transform.baseVal;
    const currentRotation = parseFloat(element.dataset.rotation || "0");
    const newRotation = (currentRotation + ROTATION_STEP) % 360;
    const parentRotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, centerX, centerY);

    // --- Simulate Rotation and Check Collision ---
    parentRotateTransform.setRotate(newRotation, centerX, centerY); // Temporarily apply new rotation
    const rotatedBBox = getTransformedBBox(element);
    const collides = rotatedBBox && getCollidingElementsByBBox(rotatedBBox, element).length > 0;

    // --- Apply or Revert Rotation ---
    if (collides) {
        console.log("Rotation resulted in collision. Reverting.");
        parentRotateTransform.setRotate(currentRotation, centerX, centerY); // Revert parent rotation
        const colliders = getCollidingElementsByBBox(rotatedBBox, element);
        colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); });
        setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);
        // No need to update title rotation if parent didn't rotate
    } else {
        // Rotation successful, keep parent rotation and update data attribute
        element.dataset.rotation = String(newRotation);

        // --- Update Title's Inverse Rotation ---
        const titleText = element.querySelector('.draggable-title');
        if (titleText) {
            const titleX = parseFloat(titleText.getAttribute('x') || '0');
            const titleY = parseFloat(titleText.getAttribute('y') || '0');
            const titleTransformList = titleText.transform.baseVal;
            // Rotation center relative to title's origin (x, y)
            const titleRotateCenterX = centerX - titleX;
            const titleRotateCenterY = centerY - titleY;
            const titleRotateTransform = getOrAddTransform(titleTransformList, SVGTransform.SVG_TRANSFORM_ROTATE, titleRotateCenterX, titleRotateCenterY);
            titleRotateTransform.setRotate(-newRotation, titleRotateCenterX, titleRotateCenterY); // Apply *new* inverse rotation
        }

        // Call success callback (for history save)
        if (onSuccessCallback) { onSuccessCallback(); }
    }
}


// --- Element Drag Handlers (Unchanged) ---
/** Handles mousedown events on canvas elements for dragging the whole element. */
function handleElementMouseDown(event) {
    const element = event.currentTarget;
    if (!element || appState.isDrawingArrow || appState.isEditingText || appState.isDrawingFreehand || appState.isDraggingTitle) return;

    // Ignore if clicking on the draggable title text
    if (event.target.closest('.draggable-title')) {
        return;
    }

    // Only allow dragging with the select tool
    if (appState.currentTool === 'select') {
        let initiateDrag = false;
        handleElementSelection(element, event); // Update selection first

        const isNowSingleSelected = appState.selectedElements.size === 1 && appState.selectedElements.has(element);

        if (isNowSingleSelected) {
            initiateDrag = true;
        }

        if (initiateDrag) {
            event.preventDefault(); event.stopPropagation();
            const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
            if (!startPoint) return;
            appState.isDraggingElement = true; element.classList.add('dragging'); clearCollisionHighlights(appState.currentlyHighlightedCollisions);
            const transformList = element.transform.baseVal; const initialTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
            appState.elementStartPos = { x: initialTranslate.matrix.e, y: initialTranslate.matrix.f }; appState.dragOffsetX = startPoint.x - appState.elementStartPos.x; appState.dragOffsetY = startPoint.y - appState.elementStartPos.y;
            document.addEventListener('mousemove', handleElementDragMove, false); document.addEventListener('mouseup', handleElementDragEnd, false); document.addEventListener('mouseleave', handleElementDragEnd, false);
        }
    }
}
/** Handles mousemove during element drag. */
function handleElementDragMove(event) {
    if (!appState.isDraggingElement || appState.selectedElements.size !== 1) return;
    const element = appState.selectedElements.values().next().value;
    if (!element) { handleElementDragEnd(event); return; }
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;
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
export function handleElementDragEnd(event) {
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
            let reverted = false;

            if (!skipCollisionCheck) {
                const finalBBox = getTransformedBBox(elementProcessed);
                const collidesOnDrop = finalBBox && getCollidingElementsByBBox(finalBBox, elementProcessed).length > 0;
                if (collidesOnDrop) {
                    console.log("Move ended in collision. Reverting position.");
                    const colliders = getCollidingElementsByBBox(finalBBox, elementProcessed);
                    colliders.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); }); setTimeout(() => colliders.forEach(el => el.classList.remove('collision-indicator')), 1500);
                    const transformList = elementProcessed.transform.baseVal; const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                    translateTransform.setTranslate(appState.elementStartPos.x, appState.elementStartPos.y);
                    reverted = true;
                }
            }

            if (!reverted) {
                const transformList = elementProcessed.transform.baseVal;
                const finalTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                const dx = finalTranslate.matrix.e - appState.elementStartPos.x;
                const dy = finalTranslate.matrix.f - appState.elementStartPos.y;
                if (dx * dx + dy * dy > 1) {
                    saveStateForUndo(); // Save state after successful drag
                }
            }
        }
        appState.elementStartPos = { x: 0, y: 0 };
        appState.dragOffsetX = 0;
        appState.dragOffsetY = 0;
    }
}

// --- Title Drag Handlers (Unchanged) ---
/** Handles mousedown on a draggable title text element. */
function handleTitleMouseDown(event) {
    if (appState.currentTool !== 'select' || appState.isDraggingElement || appState.isDraggingTitle) {
        return;
    }
    const titleElement = event.currentTarget;
    const parentElement = titleElement.closest('.canvas-element');
    if (!parentElement || !titleElement) return;
    event.preventDefault();
    event.stopPropagation();
    appState.isDraggingTitle = true;
    appState.draggedTitleElement = titleElement;
    appState.draggedTitleParentElement = parentElement;
    titleElement.style.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';
    const startMousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!startMousePoint) { appState.isDraggingTitle = false; return; }
    appState.titleDragStartPoint = startMousePoint;
    const currentTitleX = parseFloat(titleElement.getAttribute('x') || '0');
    const currentTitleY = parseFloat(titleElement.getAttribute('y') || '0');
    appState.titleDragStartOffset = {
        x: currentTitleX - startMousePoint.x,
        y: currentTitleY - startMousePoint.y
    };
    document.addEventListener('mousemove', handleTitleDragMove, false);
    document.addEventListener('mouseup', handleTitleDragEnd, false);
    document.addEventListener('mouseleave', handleTitleDragEnd, false);
}
/** Handles mousemove during title drag. */
function handleTitleDragMove(event) {
    if (!appState.isDraggingTitle || !appState.draggedTitleElement || !appState.draggedTitleParentElement) return;
    event.preventDefault();
    const currentMousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentMousePoint) return;
    let newTitleX = currentMousePoint.x + appState.titleDragStartOffset.x;
    let newTitleY = currentMousePoint.y + appState.titleDragStartOffset.y;
    const bgRect = appState.draggedTitleParentElement.querySelector('.element-bg');
    const titleBBox = appState.draggedTitleElement.getBBox ? appState.draggedTitleElement.getBBox() : { width: 30, height: 12 };
    if (bgRect) {
        const bgX = parseFloat(bgRect.getAttribute('x') || '0');
        const bgY = parseFloat(bgRect.getAttribute('y') || '0');
        const bgWidth = parseFloat(bgRect.getAttribute('width') || '100');
        const bgHeight = parseFloat(bgRect.getAttribute('height') || '50');
        const minX = bgX + TITLE_PADDING;
        const minY = bgY + TITLE_PADDING;
        const maxX = bgX + bgWidth - titleBBox.width - TITLE_PADDING;
        const maxY = bgY + bgHeight - titleBBox.height - TITLE_PADDING;
        newTitleX = Math.max(minX, Math.min(newTitleX, maxX));
        newTitleY = Math.max(minY, Math.min(newTitleY, maxY));
    }
    appState.draggedTitleElement.setAttribute('x', String(newTitleX));
    appState.draggedTitleElement.setAttribute('y', String(newTitleY));
}
/** Handles mouseup/mouseleave after title drag. */
function handleTitleDragEnd(event) {
    if (!appState.isDraggingTitle) return;
    document.removeEventListener('mousemove', handleTitleDragMove, false);
    document.removeEventListener('mouseup', handleTitleDragEnd, false);
    document.removeEventListener('mouseleave', handleTitleDragEnd, false);
    if (appState.draggedTitleElement) {
        appState.draggedTitleElement.style.cursor = 'grab';
    }
    document.body.style.cursor = '';
    if (appState.draggedTitleElement && appState.draggedTitleParentElement) {
        const finalX = parseFloat(appState.draggedTitleElement.getAttribute('x') || '0');
        const finalY = parseFloat(appState.draggedTitleElement.getAttribute('y') || '0');
        // Save the final X and Y attributes directly as the offset data
        appState.draggedTitleParentElement.dataset.titleOffsetX = String(finalX);
        appState.draggedTitleParentElement.dataset.titleOffsetY = String(finalY);
        saveStateForUndo(); // Save state after title move
    }
    appState.isDraggingTitle = false;
    appState.draggedTitleElement = null;
    appState.draggedTitleParentElement = null;
    appState.titleDragStartOffset = { x: 0, y: 0 };
    appState.titleDragStartPoint = { x: 0, y: 0 };
}


// --- Attach Listeners ---
/** Adds mouse event listeners to a canvas element and its title. */
export function makeElementInteractive(element) {
    if (!element) return;

    // Listeners for the main element group (drag, select click)
    element.removeEventListener("mousedown", handleElementMouseDown);
    element.removeEventListener("click", handleElementClick);
    element.addEventListener("mousedown", handleElementMouseDown);
    element.addEventListener("click", handleElementClick); // For selection

    // Listener specifically for the title text
    const titleElement = element.querySelector('.element-label.draggable-title');
    if (titleElement) {
        titleElement.removeEventListener("mousedown", handleTitleMouseDown); // Remove previous if any
        titleElement.addEventListener("mousedown", handleTitleMouseDown);
    }
}
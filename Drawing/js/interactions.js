// js/interactions.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { svgPoint, getOrAddTransform, getTransformedBBox } from './utils.js';
import { handleElementSelection } from './selection.js'; // Keep this import
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
import { ROTATION_STEP, TITLE_PADDING, SVG_NS } from './config.js';
import { saveStateForUndo } from './history.js';


// --- Element Click Handler ---
/** Handles click events on canvas elements (mainly for selection tool). */
export function handleElementClick(event) {
    const element = event.currentTarget;
    // Ignore clicks if dragging something else or editing text
    if (!element || appState.isDraggingElement || appState.isEditingText || appState.isDraggingTitle) {
        // console.log("DEBUG INTERACTIONS: handleElementClick ignored (dragging/editing)");
        return;
    }

    // Handle selection logic ONLY if the select tool is active
    if (appState.currentTool === 'select') {
        // console.log("DEBUG INTERACTIONS: handleElementClick processing for select tool");
        const isTitleClick = event.target.closest('.draggable-title');

        // If the click is not on the title, handle element selection state
        if (!isTitleClick) {
            handleElementSelection(element, event); // Update selection state & visuals
        }
        // If it *was* a title click, we still want to stop propagation below
        // to prevent the background clear, but we don't modify the selection state here.

        // *** CRITICAL: Stop the event HERE to prevent it bubbling to the canvas ***
        // This prevents the background click handler in app.js from clearing the selection
        // right after we potentially added to it with Ctrl+Click.
        event.stopPropagation();
        // console.log("DEBUG INTERACTIONS: handleElementClick stopped propagation");

    }
    // If the tool is delete or rotate, we *let the event propagate* up to the
    // app.js canvas click listener where those actions are handled.
    // console.log("DEBUG INTERACTIONS: handleElementClick propagating for tool:", appState.currentTool);
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
    } else {
        element.dataset.rotation = String(newRotation);
        const titleText = element.querySelector('.draggable-title');
        if (titleText) {
            const titleX = parseFloat(titleText.getAttribute('x') || '0');
            const titleY = parseFloat(titleText.getAttribute('y') || '0');
            const titleTransformList = titleText.transform.baseVal;
            const titleRotateCenterX = centerX - titleX;
            const titleRotateCenterY = centerY - titleY;
            const titleRotateTransform = getOrAddTransform(titleTransformList, SVGTransform.SVG_TRANSFORM_ROTATE, titleRotateCenterX, titleRotateCenterY);
            titleRotateTransform.setRotate(-newRotation, titleRotateCenterX, titleRotateCenterY);
        }
        if (onSuccessCallback) { onSuccessCallback(); }
    }
}


// --- Element Drag Handlers ---
/** Handles mousedown events on canvas elements for dragging the whole element. */
function handleElementMouseDown(event) {
    const element = event.currentTarget;
    if (!element || appState.isDrawingArrow || appState.isEditingText || appState.isDrawingFreehand || appState.isDraggingTitle) return;

    if (event.target.closest('.draggable-title')) {
        return; // Let title handler take over
    }

    if (appState.currentTool === 'select') {
        const wasSelected = appState.selectedElements.has(element);

        // Call selection logic *before* checking if drag should start
        // This ensures the state is up-to-date for the drag check.
        // handleElementSelection(element, event); // This is handled by the click listener now

        const isNowSingleSelected = appState.selectedElements.size === 1 && appState.selectedElements.has(element);
        const isMultiSelectAndWasSelected = (event.ctrlKey || event.metaKey) && wasSelected;

        // Initiate drag ONLY if:
        // 1. It's now the *only* selected item (after a potential click selection)
        // OR 2. We are holding Ctrl/Meta and clicked on an *already* selected item (part of multi-drag prep, though multi-drag isn't fully implemented yet)
        // For now, let's restrict drag to single items for simplicity:
        if (isNowSingleSelected && !isMultiSelectAndWasSelected) { // Check if it's the single item *after* the potential selection change from click
            // Need to re-evaluate single selection *after* the click logic runs.
            // The mousedown initiates drag *before* the click fully resolves selection sometimes.
            // Let's defer drag initiation slightly or check selection state *after* click logic runs.
            // For now, check the state *before* the click logic might change it.
            if (!wasSelected && appState.selectedElements.size > 1) {
                // If it wasn't selected and there were others, a normal click will clear others.
                // We *don't* want to initiate drag in this case yet.
            } else if (wasSelected || (!wasSelected && appState.selectedElements.size <= 1) ) {
                // Initiate drag if it was already selected (single or multi),
                // OR if it wasn't selected but nothing else was selected either (it will become the single selection)
                event.preventDefault(); // Prevent text selection, etc.
                event.stopPropagation(); // Prevent other mousedown listeners

                const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
                if (!startPoint) return;
                appState.isDraggingElement = true; element.classList.add('dragging'); clearCollisionHighlights(appState.currentlyHighlightedCollisions);
                const transformList = element.transform.baseVal; const initialTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                appState.elementStartPos = { x: initialTranslate.matrix.e, y: initialTranslate.matrix.f }; appState.dragOffsetX = startPoint.x - appState.elementStartPos.x; appState.dragOffsetY = startPoint.y - appState.elementStartPos.y;
                document.addEventListener('mousemove', handleElementDragMove, false); document.addEventListener('mouseup', handleElementDragEnd, false); document.addEventListener('mouseleave', handleElementDragEnd, false);
            }
        }
    }
}
/** Handles mousemove during element drag. */
function handleElementDragMove(event) {
    if (!appState.isDraggingElement || appState.selectedElements.size !== 1) return; // Only move single elements for now
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
        // Only handle single element drag end for now
        if (appState.selectedElements.size === 1) {
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
        }
        appState.elementStartPos = { x: 0, y: 0 };
        appState.dragOffsetX = 0;
        appState.dragOffsetY = 0;
    }
}

// --- Title Drag Handlers ---
/** Handles mousedown on a draggable title text element. */
function handleTitleMouseDown(event) {
    if (appState.currentTool !== 'select' || appState.isDraggingElement || appState.isDraggingTitle) {
        return;
    }
    const titleElement = event.currentTarget;
    const parentElement = titleElement.closest('.canvas-element');
    if (!parentElement || !titleElement) return;
    event.preventDefault();
    event.stopPropagation(); // Prevent element drag/selection
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

    // Listeners for the main element group (drag start, selection via click)
    element.removeEventListener("mousedown", handleElementMouseDown);
    element.removeEventListener("click", handleElementClick); // This handles the SELECTION logic
    element.addEventListener("mousedown", handleElementMouseDown); // This PREPARES for drag
    element.addEventListener("click", handleElementClick); // This CONFIRMS selection

    // Listener specifically for the title text (drag start)
    const titleElement = element.querySelector('.element-label.draggable-title');
    if (titleElement) {
        titleElement.removeEventListener("mousedown", handleTitleMouseDown); // Remove previous if any
        titleElement.addEventListener("mousedown", handleTitleMouseDown);
        // We don't need a separate click listener for the title if selection is handled by the parent group's click
    }
}
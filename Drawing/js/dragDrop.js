// js/dragDrop.js
import { appState } from './state.js';
import { dom } from './dom.js';
import {getTransformedBBox, svgPoint} from './utils.js';
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
import { createCanvasElement } from './elements.js';
import {clearSelection, updateElementVisualSelection} from './selection.js';
import { setActiveTool } from './tools.js';
import { PLACEMENT_GAP } from './config.js';
// Import history save function
import { saveStateForUndo } from './history.js';


// --- Ghost Preview ---

/** Creates and styles the ghost preview element following the mouse or touch. */
export function createGhostPreview(event) {
    if (!appState.currentDraggingItemInfo || !dom.ghostPreview) return;
    const info = appState.currentDraggingItemInfo;

    dom.ghostPreview.style.width = `${info.width}px`;
    dom.ghostPreview.style.height = `${info.height}px`;
    dom.ghostPreview.innerHTML = ''; // Clear previous

    const label = document.createElement('div');
    label.className = 'element-label';
    label.textContent = info.name || "Item";
    dom.ghostPreview.appendChild(label);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'inner-content-wrapper';
    if (info.svgContent) {
        try {
            contentWrapper.innerHTML = info.svgContent;
            const innerSvg = contentWrapper.querySelector('svg');
            if (innerSvg) {
                innerSvg.setAttribute('width', '100%');
                innerSvg.setAttribute('height', '100%');
                innerSvg.style.display = 'block';
                innerSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                if (!innerSvg.hasAttribute('viewBox') && info.width > 0 && info.height > 0) {
                    innerSvg.setAttribute('viewBox', `0 0 ${info.width} ${info.height}`);
                }
            }
        } catch(e) {
            console.error("Error setting ghost preview SVG:", e);
            contentWrapper.textContent = "[Preview Error]";
        }
    }
    dom.ghostPreview.appendChild(contentWrapper);

    // Handle both mouse and touch events
    try {
        if (event.dataTransfer) {
            event.dataTransfer.setDragImage(new Image(), 0, 0);
        }
    } catch(e) { console.warn("Could not hide default drag image:", e); }

    dom.ghostPreview.style.display = 'block';
    moveGhostPreview(event);
}

/** Updates the position of the ghost preview element. */
export function moveGhostPreview(event) {
    if (!dom.ghostPreview || dom.ghostPreview.style.display === 'none' || !appState.currentDraggingItemInfo) return;
    
    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // Center ghost under cursor/touch
    const x = clientX - (appState.currentDraggingItemInfo.width / 2);
    const y = clientY - (appState.currentDraggingItemInfo.height / 2);
    dom.ghostPreview.style.left = `${x}px`;
    dom.ghostPreview.style.top = `${y}px`;
}

/** Hides and clears the ghost preview element. */
export function destroyGhostPreview() {
    if (dom.ghostPreview) {
        dom.ghostPreview.style.display = 'none';
        dom.ghostPreview.innerHTML = '';
    }
    appState.currentDraggingItemInfo = null; // Clear dragging state
}


// --- Canvas Drag/Drop Event Handlers ---

/** Handles dragover/touchmove on the canvas: prevents default, moves ghost, highlights collisions. */
export function handleCanvasDragOver(event) {
    event.preventDefault();
    
    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
    }

    if (appState.currentDraggingItemInfo) {
        moveGhostPreview(event);
        const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY);
        if (!currentPoint) return;

        // Check collision only for non-colliding types from config
        const dragType = appState.currentDraggingItemInfo.type; // Assuming type is set (activity/library)
        const nonCollidingTypes = ['number', 'text', 'movement', 'passShot']; // Copied from app.js - consider centralizing
        // For activity/library drops, we *do* want collision checks
        const skipCollisionCheck = false; // nonCollidingTypes.includes(dragType);

        if (!skipCollisionCheck) {
            const { width: proposedWidth, height: proposedHeight } = appState.currentDraggingItemInfo;
            const halfWidth = proposedWidth / 2;
            const halfHeight = proposedHeight / 2;
            const proposedBox = {
                left: currentPoint.x - halfWidth, top: currentPoint.y - halfHeight,
                right: currentPoint.x + halfWidth, bottom: currentPoint.y + halfHeight
            };

            // Highlight collisions
            const newlyCollidingElements = getCollidingElementsByBBox(proposedBox);
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
    } else {
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }
}

/** Handles dragleave on the canvas: clears collision highlights if leaving canvas area. */
export function handleCanvasDragLeave(event) {
    // Check if the mouse is truly leaving the canvas area, not just moving over a child element
    if (!event.relatedTarget || !dom.svgCanvas.contains(event.relatedTarget)) {
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
        // Ghost is destroyed by global 'dragend' listener
    }
}

/** Handles drop event on the canvas: creates the element if placement is valid.
 *  Accepts an optional callback to execute after successful placement. */
export function handleCanvasDrop(event, onDropSuccessCallback) { // Added callback parameter
    event.preventDefault();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    const source = event.dataTransfer.getData("application/source");
    if (source !== "activity" && source !== "library") {
        console.log("Drop ignored, unknown source:", source);
        destroyGhostPreview();
        return;
    }

    const dragInfo = appState.currentDraggingItemInfo;
    destroyGhostPreview(); // Destroy ghost after getting info

    if (!dragInfo) { console.error("Drop occurred but dragInfo is missing."); return; }
    const initialDropPt = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!initialDropPt) { console.error("Could not determine drop coordinates."); return; }

    // Prepare element config
    const elementConfig = {
        type: dragInfo.type, name: dragInfo.name,
        svgContent: dragInfo.svgContent,
        width: dragInfo.width, height: dragInfo.height,
        id: dragInfo.type === 'activity' ? event.dataTransfer.getData("text/plain") : undefined
    };

    // Find placement position
    const finalPlacementCenter = findValidPlacementPosition(
        initialDropPt,
        elementConfig.width,
        elementConfig.height
    );

    if (finalPlacementCenter) {
        clearSelection();
        const newElement = createCanvasElement(elementConfig, finalPlacementCenter.x, finalPlacementCenter.y);
        // The element is added to the DOM inside createCanvasElement
        dom.contentLayer.appendChild(newElement); // Ensure it's added
        appState.selectedElements.add(newElement); // Select new element
        updateElementVisualSelection(newElement, true);
        setActiveTool('select'); // Switch to select tool

        // Call the success callback (for saving state)
        if (onDropSuccessCallback) {
            onDropSuccessCallback();
        }

    } else {
        console.log("Could not find valid placement spot. Element not created.");
        // Highlight colliding elements briefly
        const halfWidth = elementConfig.width / 2;
        const halfHeight = elementConfig.height / 2;
        const proposedBox = {
            left: initialDropPt.x - halfWidth, top: initialDropPt.y - halfHeight,
            right: initialDropPt.x + halfWidth, bottom: initialDropPt.y + halfHeight
        };
        const collidingElements = getCollidingElementsByBBox(proposedBox);
        collidingElements.forEach(el => {
            ensureCollisionIndicatorRect(el);
            el.classList.add('collision-indicator');
        });
        setTimeout(() => collidingElements.forEach(el => el.classList.remove('collision-indicator')), 1500);
        // alert("Cannot place element here due to collisions."); // Alert might be annoying
    }
}


// --- Placement Logic ---

/**
 * Attempts to find a non-colliding position for a new element.
 * Returns {x, y} center point if found, otherwise null.
 */
function findValidPlacementPosition(initialCenterPt, elementWidth, elementHeight) {
    const halfWidth = elementWidth / 2;
    const halfHeight = elementHeight / 2;

    const tryPlacingAtCenter = (centerX, centerY) => {
        const proposedBox = {
            left: centerX - halfWidth, top: centerY - halfHeight,
            right: centerX + halfWidth, bottom: centerY + halfHeight
        };
        return getCollidingElementsByBBox(proposedBox).length === 0;
    };

    // 1. Try initial spot
    if (tryPlacingAtCenter(initialCenterPt.x, initialCenterPt.y)) return initialCenterPt;

    // 2. Find bounds of colliders at initial spot
    const initialProposedBox = {
        left: initialCenterPt.x - halfWidth, top: initialCenterPt.y - halfHeight,
        right: initialCenterPt.x + halfWidth, bottom: initialCenterPt.y + halfHeight
    };
    const initialColliders = getCollidingElementsByBBox(initialProposedBox);
    if (initialColliders.length === 0) return initialCenterPt; // Should not happen if step 1 failed

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    initialColliders.forEach(el => {
        const bbox = getTransformedBBox(el); // Assuming getTransformedBBox is in scope/imported
        if (bbox) {
            minX = Math.min(minX, bbox.left); minY = Math.min(minY, bbox.top);
            maxX = Math.max(maxX, bbox.right); maxY = Math.max(maxY, bbox.bottom);
        }
    });
    if (!isFinite(minX)) return null; // Bail if collider BBoxes failed

    const combinedCollidingBox = { left: minX, top: minY, right: maxX, bottom: maxY };

    // 3. Check adjacent spots (spiral outwards slightly more robustly)
    const step = PLACEMENT_GAP + Math.max(elementWidth, elementHeight) / 2; // Step based on size + gap
    const maxAttempts = 8; // Limit search radius
    for (let i = 1; i <= maxAttempts; i++) {
        const currentStep = i * step;
        const positionsToCheck = [
            // Right, Left, Bottom, Top
            { x: combinedCollidingBox.right + PLACEMENT_GAP + halfWidth, y: initialCenterPt.y },
            { x: combinedCollidingBox.left - PLACEMENT_GAP - halfWidth, y: initialCenterPt.y },
            { x: initialCenterPt.x, y: combinedCollidingBox.bottom + PLACEMENT_GAP + halfHeight },
            { x: initialCenterPt.x, y: combinedCollidingBox.top - PLACEMENT_GAP - halfHeight },
            // Diagonals
            { x: combinedCollidingBox.right + PLACEMENT_GAP + halfWidth, y: combinedCollidingBox.top - PLACEMENT_GAP - halfHeight },
            { x: combinedCollidingBox.right + PLACEMENT_GAP + halfWidth, y: combinedCollidingBox.bottom + PLACEMENT_GAP + halfHeight },
            { x: combinedCollidingBox.left - PLACEMENT_GAP - halfWidth, y: combinedCollidingBox.top - PLACEMENT_GAP - halfHeight },
            { x: combinedCollidingBox.left - PLACEMENT_GAP - halfWidth, y: combinedCollidingBox.bottom + PLACEMENT_GAP + halfHeight },
        ];
        // Simple adjacent check first
        if (i === 1) {
            for (const pos of positionsToCheck.slice(0, 4)) { // Check cardinal directions first
                if (tryPlacingAtCenter(pos.x, pos.y)) return pos;
            }
        }
        // Then check diagonals
        for (const pos of positionsToCheck.slice(4)) {
            if (tryPlacingAtCenter(pos.x, pos.y)) return pos;
        }

        // Expand the check area (less precise but covers more ground if needed)
        // This part might need refinement if simple adjacent checks aren't enough
        // const angleStep = Math.PI / 4; // Check 8 directions
        // for (let j = 0; j < 8; j++) {
        //     const angle = j * angleStep;
        //     const checkX = initialCenterPt.x + Math.cos(angle) * currentStep;
        //     const checkY = initialCenterPt.y + Math.sin(angle) * currentStep;
        //     if (tryPlacingAtCenter(checkX, checkY)) return { x: checkX, y: checkY };
        // }

    }


    // 4. Fail if no spot found
    return null;
}

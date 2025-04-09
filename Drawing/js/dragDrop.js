// js/dragDrop.js
import { appState } from './state.js';
import { dom } from './dom.js';
import {getTransformedBBox, svgPoint} from './utils.js';
import { getCollidingElementsByBBox, ensureCollisionIndicatorRect, clearCollisionHighlights } from './collisions.js';
import { createCanvasElement } from './elements.js';
import {clearSelection, updateElementVisualSelection} from './selection.js';
import { setActiveTool } from './tools.js';
import { PLACEMENT_GAP } from './config.js';


// --- Ghost Preview ---

/** Creates and styles the ghost preview element following the mouse. */
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

    try { // Hide default drag image
        event.dataTransfer.setDragImage(new Image(), 0, 0);
    } catch(e) { console.warn("Could not hide default drag image:", e); }

    dom.ghostPreview.style.display = 'block';
    moveGhostPreview(event);
}

/** Updates the position of the ghost preview element. */
export function moveGhostPreview(event) {
    if (!dom.ghostPreview || dom.ghostPreview.style.display === 'none' || !appState.currentDraggingItemInfo) return;
    // Center ghost under cursor
    const x = event.pageX - (appState.currentDraggingItemInfo.width / 2);
    const y = event.pageY - (appState.currentDraggingItemInfo.height / 2);
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

/** Handles dragover on the canvas: prevents default, moves ghost, highlights collisions. */
export function handleCanvasDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    if (appState.currentDraggingItemInfo) {
        moveGhostPreview(event);
        const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
        if (!currentPoint) return;

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
}

/** Handles dragleave on the canvas: clears collision highlights if leaving canvas area. */
export function handleCanvasDragLeave(event) {
    if (!event.relatedTarget || !dom.svgCanvas.contains(event.relatedTarget)) {
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
        // Ghost is destroyed by global 'dragend' listener
    }
}

/** Handles drop event on the canvas: creates the element if placement is valid. */
export function handleCanvasDrop(event) {
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
        appState.selectedElements.add(newElement); // Select new element
        updateElementVisualSelection(newElement, true);
        setActiveTool('select'); // Switch to select tool
    } else {
        console.log("Could not find valid placement spot. Element not created.");
        alert("Cannot place element here due to collisions.");
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
    if (initialColliders.length === 0) return initialCenterPt; // Should not happen?

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

    // 3. Check adjacent spots
    const adjacentPositions = [
        { x: combinedCollidingBox.right + PLACEMENT_GAP + halfWidth, y: initialCenterPt.y },
        { x: combinedCollidingBox.left - PLACEMENT_GAP - halfWidth, y: initialCenterPt.y },
        { x: initialCenterPt.x, y: combinedCollidingBox.bottom + PLACEMENT_GAP + halfHeight },
        { x: initialCenterPt.x, y: combinedCollidingBox.top - PLACEMENT_GAP - halfHeight }
    ];
    for (const pos of adjacentPositions) {
        if (tryPlacingAtCenter(pos.x, pos.y)) return pos;
    }

    // 4. Fail if no spot found
    return null;
}
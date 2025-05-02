//***** js\app.js ******
// js/app.js - Main entry point
import {dom} from './dom.js';
import {appState} from './state.js';
import {
    DEFAULT_PLAYER_TOOL_ID, drawingToolMap, PLAYER_RADIUS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT,
    TEXT_FONT_SIZE,
    // Use unified arrow constants where appropriate
    ARROW_STROKE_WIDTH_UNIFIED, MARKER_ARROW_UNIFIED_ID,
    MARKER_DEFINITIONS, DEFAULT_SHAPE_SIZE,
    DEFAULT_SHAPE_FILL_COLOR, DEFAULT_STROKE_COLOR, ARROW_COLOR
} from './config.js';
import {setActiveTool} from './tools.js';
import {
    clearSelection,
    updateElementVisualSelection,
    handleMarqueeMouseDown,
    cancelMarqueeSelection
} from './selection.js';
import {loadActivities} from './sidebarActivities.js';
import {loadSvgLibrary, handleLibraryFileRead} from './sidebarLibrary.js';
import {handleCanvasDragOver, handleCanvasDrop, handleCanvasDragLeave, destroyGhostPreview} from './dragDrop.js';
// Removed saveDrawing and loadDrawing imports
import {exportDrawing, handleImportFileRead} from './persistence.js';
import {
    createPlayerElement, createBallElement, createGateElement,
    createConeElement, createLineElement, createCornerElement, createManyBallsElement,
    createArrowElement, createNumberElement, createTextElement, createFreehandArrowElement, pointsToPathData,
    createShapeElement, createBasicLineElement
} from './elements.js';
import {svgPoint} from './utils.js';
// Import getElementDimensions to get the correct size for collision checks
import { clearCollisionHighlights, getCollidingElementsByBBox, ensureCollisionIndicatorRect, getElementDimensions } from './collisions.js';
import {initCustomPlayerSelector, populateCustomPlayerSelector} from "./playerSelector.js";
import {initCustomEquipmentSelector, populateCustomEquipmentSelector} from "./equipmentSelector.js";
import {initCustomMovementSelector, populateCustomMovementSelector} from "./movementSelector.js";
import {initCustomPassShotSelector, populateCustomPassShotSelector} from "./passShotSelector.js";
import {initCustomNumberSelector, populateCustomNumberSelector} from "./numberSelector.js";
import {initCustomFieldSelector, populateCustomFieldSelector, setFieldBackground} from "./fieldSelector.js"; // Import setFieldBackground
import {initCustomShapeSelector, populateCustomShapeSelector} from "./shapeSelector.js";
import {saveStateForUndo, undo, redo, updateUndoRedoButtons} from './history.js';
// Ensure all placement drag handlers are imported
import {rotateElement, startPlacementDrag, handlePlacementDragMove, endPlacementDrag, handleElementMouseDown, handleTitleMouseDown} from './interactions.js'; // Added handleElementMouseDown, handleTitleMouseDown
import {initZoom, handleWheelZoom, resetZoom} from './zoom.js'; // Import resetZoom

// --- Unsaved Changes Check ---
/**
 * Checks if there are unsaved changes or if the canvas is not empty,
 * and prompts the user if necessary before proceeding with an action
 * that would discard the current drawing (New, Import).
 * @returns {boolean} True if it's safe to proceed (no unsaved changes/empty canvas or user confirmed), false otherwise.
 */
function checkUnsavedChanges() {
    // Check if the drawing is marked as modified OR if there are any elements on the canvas
    const isCanvasNotEmpty = dom.contentLayer.children.length > 0;
    if (appState.isDrawingModified || isCanvasNotEmpty) {
        // Use a slightly more general message, although "unsaved changes" is common practice
        return confirm("The current drawing is not empty. Do you want to discard it and start a new drawing?");
    }
    return true; // Canvas is empty and not modified, safe to proceed
}


// --- New Drawing Function ---
function startNewDrawing() {
    if (checkUnsavedChanges()) {
        clearSelection();
        dom.contentLayer.innerHTML = ''; // Clear all elements from the content layer
        setFieldBackground('none'); // Reset to no field background (this will also reset viewBox)
        resetZoom(); // Reset zoom and pan (this will reset to the new default viewBox)
        appState.undoStack = []; // Clear history
        appState.redoStack = [];
        updateUndoRedoButtons(); // Update button states
        appState.isDrawingModified = false; // Reset modified flag
        appState.continuousNumberingActive = false; // Reset continuous numbering
        appState.nextNumberToPlace = 0; // Reset next number
        saveStateForUndo(); // Save the new empty state
        console.log("New drawing started.");
    }
}


// --- Text Input Handling --- (Keep unchanged)
function showTextInput(x, y) {
    appState.isEditingText = true;
    const foreignObject = dom.textInputContainer;
    const textarea = dom.textInputfield;
    foreignObject.setAttribute('x', x);
    foreignObject.setAttribute('y', y - TEXT_FONT_SIZE);
    foreignObject.setAttribute('width', '150');
    foreignObject.setAttribute('height', '50');
    foreignObject.style.display = 'block';
    textarea.value = '';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.fontSize = `${TEXT_FONT_SIZE}px`;
    textarea.style.border = '1px dashed grey';
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxSizing = 'border-box';
    textarea.focus();
    textarea.onblur = finalizeTextInput;
    textarea.onkeydown = handleTextInputKeyDown;
}

function handleTextInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        finalizeTextInput();
    } else if (event.key === 'Escape') {
        cancelTextInput();
    }
}

function finalizeTextInput() {
    if (!appState.isEditingText) return;
    const textContent = dom.textInputfield.value.trim();
    const foreignObject = dom.textInputContainer;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (textContent && toolConfig) {
        const x = parseFloat(foreignObject.getAttribute('x'));
        const y = parseFloat(foreignObject.getAttribute('y')) + TEXT_FONT_SIZE;
        clearSelection();
        const newTextElement = createTextElement(toolConfig, x, y, textContent);
        dom.contentLayer.appendChild(newTextElement);
        appState.selectedElements.add(newTextElement);
        updateElementVisualSelection(newTextElement, true);
        saveStateForUndo();
    }
    cancelTextInput();
    setActiveTool('select');
}

function cancelTextInput() {
    appState.isEditingText = false;
    dom.textInputfield.onblur = null;
    dom.textInputfield.onkeydown = null;
    dom.textInputContainer.style.display = 'none';
    dom.textInputfield.value = '';
    // If cancelling text input, revert to select tool
    setActiveTool('select');
}

// --- Straight Arrow Drawing Handling ---
function startArrowDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'arrow') return;
    // event.preventDefault(); // Prevent default is now called in the initiator (handleInteractionStart)
    event.stopPropagation();
    appState.isDrawingArrow = true;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    appState.arrowStartPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (!appState.arrowStartPoint) {
        appState.isDrawingArrow = false;
        return;
    }
    const previewLine1 = dom.tempArrowPreview;
    const previewLine2 = dom.tempArrowPreview2;

    const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
    const markerId = toolConfig.markerEndId;

    previewLine1.setAttribute('x1', appState.arrowStartPoint.x);
    previewLine1.setAttribute('y1', appState.arrowStartPoint.y);
    previewLine1.setAttribute('x2', appState.arrowStartPoint.x);
    previewLine1.setAttribute('y2', appState.arrowStartPoint.y);
    previewLine1.setAttribute('stroke', appState.selectedColor);
    previewLine1.setAttribute('stroke-width', String(strokeWidth));
    previewLine1.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none');

    if (markerId && !toolConfig.isDoubleLine) {
        previewLine1.setAttribute('marker-end', `url(#${markerId})`);
    } else {
        previewLine1.removeAttribute('marker-end');
    }
    previewLine1.style.visibility = 'visible';

    if (toolConfig.isDoubleLine) {
        previewLine2.setAttribute('x1', appState.arrowStartPoint.x);
        previewLine2.setAttribute('y1', appState.arrowStartPoint.y);
        previewLine2.setAttribute('x2', appState.arrowStartPoint.x);
        previewLine2.setAttribute('y2', appState.arrowStartPoint.y);
        previewLine2.setAttribute('stroke', appState.selectedColor);
        previewLine2.setAttribute('stroke-width', String(strokeWidth));
        previewLine2.setAttribute('stroke-dasharray', 'none');
        if (markerId) {
            previewLine1.setAttribute('marker-end', `url(#${markerId})`);
            previewLine2.setAttribute('marker-end', `url(#${markerId})`);
        } else {
            previewLine2.removeAttribute('marker-end');
        }
        previewLine2.style.visibility = 'visible';
    } else {
        previewLine2.style.visibility = 'hidden';
    }
    // Move/End listeners are added in handleInteractionMove/handleInteractionEnd
}

function handleArrowDrawingMove(event) {
    if (!appState.isDrawingArrow || !appState.arrowStartPoint) return;
    // event.preventDefault(); // Called in handleInteractionMove
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (!currentPoint) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    const previewLine1 = dom.tempArrowPreview;
    const previewLine2 = dom.tempArrowPreview2;

    if (toolConfig?.isDoubleLine) {
        const startX = appState.arrowStartPoint.x;
        const startY = appState.arrowStartPoint.y;
        const endX = currentPoint.x;
        const endY = currentPoint.y;
        const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
        const angle = Math.atan2(endY - startY, endX - startX);
        const offset = strokeWidth * 1.5;
        const dx = Math.sin(angle) * offset / 2;
        const dy = -Math.cos(angle) * offset / 2;
        previewLine1.setAttribute('x1', String(startX + dx));
        previewLine1.setAttribute('y1', String(startY + dy));
        previewLine1.setAttribute('x2', String(endX + dx));
        previewLine1.setAttribute('y2', String(endY + dy));
        previewLine2.setAttribute('x1', String(startX - dx));
        previewLine2.setAttribute('y1', String(startY - dy));
        previewLine2.setAttribute('x2', String(endX - dx));
        previewLine2.setAttribute('y2', String(endY - dy));
    } else {
        previewLine1.setAttribute('x2', currentPoint.x);
        previewLine1.setAttribute('y2', currentPoint.y);
    }
}

function handleArrowDrawingEnd(event) {
    if (!appState.isDrawingArrow || !appState.arrowStartPoint) return;
    // event.preventDefault(); // Called in handleInteractionEnd
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    const endPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    const startPoint = appState.arrowStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    dom.tempArrowPreview.style.visibility = 'hidden';
    dom.tempArrowPreview2.style.visibility = 'hidden';
    appState.isDrawingArrow = false;
    appState.arrowStartPoint = null;
    // Listeners removed in handleInteractionEnd
    if (endPoint && toolConfig && toolConfig.type === 'arrow') {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 100) {
            clearSelection();
            const newArrow = createArrowElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            dom.contentLayer.appendChild(newArrow);
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
            saveStateForUndo();
            console.log("Arrow added to drawn items.");
        }
    }
}

// --- Freehand Arrow Drawing Handling ---
function startFreehandDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'freehand-arrow') return;
    // event.preventDefault(); // Called in handleInteractionStart
    event.stopPropagation();
    appState.isDrawingFreehand = true;
    appState.freehandPoints = [];
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const startPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (startPoint) {
        appState.freehandPoints.push(startPoint);
    } else {
        appState.isDrawingFreehand = false;
        return;
    }

    const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
    const markerId = toolConfig.markerEndId;

    dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints));
    dom.tempFreehandPreview.setAttribute('stroke', appState.selectedColor);
    dom.tempFreehandPreview.setAttribute('stroke-width', String(strokeWidth));
    dom.tempFreehandPreview.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none');
    if (markerId) {
        dom.tempFreehandPreview.setAttribute('marker-end', `url(#${markerId})`);
    } else {
        dom.tempFreehandPreview.removeAttribute('marker-end');
    }
    dom.tempFreehandPreview.style.visibility = 'visible';
    // Move/End listeners added in handleInteractionMove/handleInteractionEnd
}

function handleFreehandDrawingMove(event) {
    if (!appState.isDrawingFreehand) return;
    // event.preventDefault(); // Called in handleInteractionMove
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (currentPoint) {
        appState.freehandPoints.push(currentPoint);
        dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints));
    }
}

function handleFreehandDrawingEnd(event) {
    if (!appState.isDrawingFreehand) return;
    // event.preventDefault(); // Called in handleInteractionEnd
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    const points = appState.freehandPoints;
    dom.tempFreehandPreview.style.visibility = 'hidden';
    dom.tempFreehandPreview.setAttribute('d', '');
    appState.isDrawingFreehand = false;
    appState.freehandPoints = [];
    // Listeners removed in handleInteractionEnd
    if (points.length > 1 && toolConfig && toolConfig.type === 'freehand-arrow') {
        clearSelection();
        const newArrow = createFreehandArrowElement(toolConfig, points);
        if (newArrow) {
            dom.contentLayer.appendChild(newArrow);
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
            saveStateForUndo();
            console.log("Freehand arrow added to drawn items.");
        }
    }
}

// --- Basic Line Drawing Handling ---
function startLineDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'line') return;
    // event.preventDefault(); // Called in handleInteractionStart
    event.stopPropagation();
    appState.isDrawingLine = true;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    appState.lineStartPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (!appState.lineStartPoint) {
        appState.isDrawingLine = false;
        return;
    }
    const previewLine = dom.tempLinePreview;
    previewLine.setAttribute('x1', appState.lineStartPoint.x);
    previewLine.setAttribute('y1', appState.lineStartPoint.y);
    previewLine.setAttribute('x2', appState.lineStartPoint.x);
    previewLine.setAttribute('y2', appState.lineStartPoint.y);
    previewLine.setAttribute('stroke', appState.selectedColor);
    previewLine.setAttribute('stroke-width', String(toolConfig.strokeWidth || 2));
    previewLine.removeAttribute('stroke-dasharray');
    previewLine.style.visibility = 'visible';
    // Move/End listeners added in handleInteractionMove/handleInteractionEnd
}

function handleLineDrawingMove(event) {
    if (!appState.isDrawingLine || !appState.lineStartPoint) return;
    // event.preventDefault(); // Called in handleInteractionMove
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (!currentPoint) return;
    dom.tempLinePreview.setAttribute('x2', currentPoint.x);
    dom.tempLinePreview.setAttribute('y2', currentPoint.y);
}

function handleLineDrawingEnd(event) {
    if (!appState.isDrawingLine || !appState.lineStartPoint) return;
    // event.preventDefault(); // Called in handleInteractionEnd

    // Capture the current end point
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    const endPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    const startPoint = appState.lineStartPoint;

    // Reset the temporary state
    dom.tempLinePreview.style.visibility = 'hidden';
    appState.isDrawingLine = false;
    appState.lineStartPoint = null;

    // Listeners removed in handleInteractionEnd

    // Ensure the end point is valid and create the line
    if (endPoint && startPoint) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq > 25) {
            clearSelection();
            const newLine = createBasicLineElement(
                drawingToolMap.get(appState.activeDrawingTool),
                startPoint.x,
                startPoint.y,
                endPoint.x,
                endPoint.y
            );
            dom.contentLayer.appendChild(newLine);
            appState.selectedElements.add(newLine);
            updateElementVisualSelection(newLine, true);
            saveStateForUndo();
        }
    }
}

// --- Shape Drawing Handling ---
function startShapeDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'shape') return;
    // event.preventDefault(); // Called in handleInteractionStart
    event.stopPropagation();
    appState.isDrawingShape = true;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    appState.shapeStartPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (!appState.shapeStartPoint) {
        appState.isDrawingShape = false;
        return;
    }
    let previewElement;
    if (toolConfig.shapeType === 'circle') {
        previewElement = dom.tempCirclePreview;
        previewElement.setAttribute('cx', appState.shapeStartPoint.x);
        previewElement.setAttribute('cy', appState.shapeStartPoint.y);
        previewElement.setAttribute('r', '0');
    } else if (toolConfig.shapeType === 'triangle') {
        previewElement = dom.tempTrianglePreview;
        const startPtStr = `${appState.shapeStartPoint.x},${appState.shapeStartPoint.y}`;
        previewElement.setAttribute('points', `${startPtStr} ${startPtStr} ${startPtStr}`);
    } else {
        previewElement = dom.tempRectPreview;
        previewElement.setAttribute('x', appState.shapeStartPoint.x);
        previewElement.setAttribute('y', appState.shapeStartPoint.y);
        previewElement.setAttribute('width', '0');
        previewElement.setAttribute('height', '0');
    }
    previewElement.setAttribute('stroke', appState.selectedColor);
    previewElement.setAttribute('stroke-width', String(toolConfig.strokeWidth || DEFAULT_SHAPE_STROKE_WIDTH));
    previewElement.removeAttribute('stroke-dasharray');
    let fillOpacity = '0.5';
    if (toolConfig.isFilled) {
        if (/^#[0-9A-F]{6}$/i.test(appState.selectedColor)) {
            previewElement.style.fill = appState.selectedColor + '80'; // Add alpha for hex
        } else {
            previewElement.style.fill = appState.selectedColor; // Use as is for rgba etc.
            // For named colors or others, we might need a different approach if opacity is desired
            previewElement.style.fillOpacity = fillOpacity;
        }
    } else {
        previewElement.style.fill = 'none';
        previewElement.style.fillOpacity = '1';
    }
    previewElement.style.visibility = 'visible';
    appState.currentShapePreview = previewElement;
    // Move/End listeners added in handleInteractionMove/handleInteractionEnd
}

function calculateTrianglePoints(center, currentPoint) {
    const dx = currentPoint.x - center.x;
    const dy = currentPoint.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const R = dist;
    if (R < 2) return null; // Avoid tiny triangles
    // Calculate angle from center to current point, then adjust for upright triangle
    const angle = Math.atan2(dy, dx) - Math.PI / 2; // Point top vertex upwards initially

    const points = [];
    for (let i = 0; i < 3; i++) {
        const vertexAngle = angle + (i * 2 * Math.PI / 3);
        const vx = center.x + R * Math.cos(vertexAngle);
        const vy = center.y + R * Math.sin(vertexAngle);
        points.push(`${vx.toFixed(1)},${vy.toFixed(1)}`);
    }
    return points.join(' ');
}


function handleShapeDrawingMove(event) {
    if (!appState.isDrawingShape || !appState.shapeStartPoint || !appState.currentShapePreview) return;
    // event.preventDefault(); // Called in handleInteractionMove
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    if (!currentPoint) return;
    const startPoint = appState.shapeStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);

    if (toolConfig.shapeType === 'circle') {
        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        appState.currentShapePreview.setAttribute('r', String(Math.max(0, radius)));
    } else if (toolConfig.shapeType === 'triangle') {
        const pointsStr = calculateTrianglePoints(startPoint, currentPoint);
        if (pointsStr) { // Only update if points are valid
            appState.currentShapePreview.setAttribute('points', pointsStr);
        }
    } else { // Rectangle or Square
        let width = Math.abs(currentPoint.x - startPoint.x);
        let height = Math.abs(currentPoint.y - startPoint.y);
        let x = Math.min(startPoint.x, currentPoint.x);
        let y = Math.min(startPoint.y, currentPoint.y);

        if (toolConfig.shapeType === 'square') {
            const side = Math.max(width, height);
            width = side;
            height = side;
            // Adjust x, y based on the direction of drag to keep the start point anchored
            if (currentPoint.x < startPoint.x) x = startPoint.x - side;
            if (currentPoint.y < startPoint.y) y = startPoint.y - side;
        }

        appState.currentShapePreview.setAttribute('x', String(x));
        appState.currentShapePreview.setAttribute('y', String(y));
        appState.currentShapePreview.setAttribute('width', String(width));
        appState.currentShapePreview.setAttribute('height', String(height));
    }
}


function handleShapeDrawingEnd(event) {
    if (!appState.isDrawingShape || !appState.shapeStartPoint || !appState.currentShapePreview) return;
    // event.preventDefault(); // Called in handleInteractionEnd
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    const endPoint = svgPoint(dom.svgCanvas, clientX, clientY);
    const startPoint = appState.shapeStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    appState.currentShapePreview.style.visibility = 'hidden';
    appState.currentShapePreview.style.fillOpacity = '1'; // Reset preview opacity
    appState.isDrawingShape = false;
    appState.shapeStartPoint = null;
    appState.currentShapePreview = null;
    // Listeners removed in handleInteractionEnd

    if (endPoint && toolConfig && toolConfig.type === 'shape') {
        let finalShapeParams = {};
        let minSizeMet = false;

        if (toolConfig.shapeType === 'circle') {
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            if (radius > 2) { // Minimum radius check
                finalShapeParams = { cx: startPoint.x, cy: startPoint.y, radius: radius };
                minSizeMet = true;
            }
        } else if (toolConfig.shapeType === 'triangle') {
            // Recalculate points based on final endPoint
            const pointsStr = calculateTrianglePoints(startPoint, endPoint);
            // Check if distance is significant enough (prevents tiny triangles on click)
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (pointsStr && dist > 2) { // Check pointsStr validity and minimum size
                finalShapeParams = { points: pointsStr };
                minSizeMet = true;
            }
        } else { // Rectangle or Square
            let width = Math.abs(endPoint.x - startPoint.x);
            let height = Math.abs(endPoint.y - startPoint.y);
            let x = Math.min(startPoint.x, endPoint.x);
            let y = Math.min(startPoint.y, endPoint.y);

            if (toolConfig.shapeType === 'square') {
                const side = Math.max(width, height);
                width = side;
                height = side;
                if (endPoint.x < startPoint.x) x = startPoint.x - side;
                if (endPoint.y < startPoint.y) y = startPoint.y - side;
            }

            if (width > 3 && height > 3) { // Minimum size check
                finalShapeParams = { x: x, y: y, width: width, height: height };
                minSizeMet = true;
            }
        }

        if (minSizeMet) {
            clearSelection();
            const newShape = createShapeElement(toolConfig, finalShapeParams);
            if (newShape) {
                dom.contentLayer.appendChild(newShape);
                appState.selectedElements.add(newShape);
                updateElementVisualSelection(newShape, true);
                saveStateForUndo();
            } else {
                console.error("Failed to create shape element with params:", finalShapeParams);
            }
        }
    }
}

// --- Unified Interaction Handlers ---
function handleInteractionStart(event) {
    // Prevent default actions like scrolling or text selection during interactions
    // Only prevent default if the event originates from the canvas or a specific tool button
    if (event.target === dom.svgCanvas || event.target.closest('.tool-item, .custom-select-trigger')) {
        // Allow default for button interactions, but prevent for canvas touch draw/drag
        if(event.type === 'touchstart' && event.target === dom.svgCanvas) {
            event.preventDefault();
        }
    }


    const isTouchEvent = event.type.startsWith('touch');
    if (isTouchEvent && event.touches.length > 1) {
        // If multi-touch, cancel any ongoing single-touch drawing/dragging
        cancelOngoingInteractions();
        return; // Ignore multi-touch for drawing/dragging for now
    }

    const clientX = isTouchEvent ? event.touches[0].clientX : event.clientX;
    const clientY = isTouchEvent ? event.touches[0].clientY : event.clientY;
    const targetElement = document.elementFromPoint(clientX, clientY); // Get element under finger/mouse

    const clickedElementGroup = targetElement?.closest('.canvas-element');
    const clickedTitleText = targetElement?.closest('.draggable-title');

    // Handle interactions on existing elements (drag, select)
    if (clickedElementGroup) {
        if (appState.currentTool === 'select' || appState.currentTool === 'rotate') {
            if (clickedTitleText) {
                handleTitleMouseDown(event); // Start title drag
            } else {
                handleElementMouseDown(event); // Start element drag/selection
            }
            addInteractionListeners(); // Add move/end listeners for element interactions
            return; // Stop further processing if interacting with an element
        }
        // For other tools (like delete), the click handler will manage it, not start drag.
    }

    // Handle interactions on the background (drawing, marquee select)
    const contentLayerClicked = dom.contentLayer.contains(targetElement) && targetElement !== dom.contentLayer;
    const isBackgroundClick = (targetElement === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(targetElement) && targetElement === dom.fieldLayer) || targetElement === dom.svgCanvas.parentElement);

    if (isBackgroundClick) {
        const currentToolConfig = drawingToolMap.get(appState.activeDrawingTool);

        if (appState.currentTool === 'draw' && currentToolConfig) {
            const clickPt = svgPoint(dom.svgCanvas, clientX, clientY);
            if (!clickPt) return;

            if (currentToolConfig.type === 'arrow') {
                startArrowDrawing(event);
            } else if (currentToolConfig.type === 'freehand-arrow') {
                startFreehandDrawing(event);
            } else if (currentToolConfig.type === 'line') {
                startLineDrawing(event);
            } else if (currentToolConfig.type === 'shape') {
                startShapeDrawing(event);
            } else if (['player', 'equipment', 'number'].includes(currentToolConfig.category)) {
                startPlacementDrag(event, currentToolConfig, clickPt);
            }
            addInteractionListeners(); // Add move/end listeners for drawing/placement
        } else if (appState.currentTool === 'select') {
            handleMarqueeMouseDown(event);
            addInteractionListeners(); // Add move/end listeners for marquee select
        } else if (appState.currentTool === 'text-tool') {
            const clickPt = svgPoint(dom.svgCanvas, clientX, clientY);
            if (clickPt) showTextInput(clickPt.x, clickPt.y);
            // Text input manages its own end events, no need for global listeners here
        }
    }
}

function handleInteractionMove(event) {
    // Prevent scrolling during active interaction
    if (appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape || appState.isDraggingElement || appState.isDraggingTitle || appState.isPlacementDragging || appState.isSelectingRect) {
        if (event.type === 'touchmove') {
            event.preventDefault();
        }
    } else {
        return; // Only process if an interaction is active
    }


    // Route to specific handlers based on the current state
    if (appState.isDrawingArrow) handleArrowDrawingMove(event);
    else if (appState.isDrawingFreehand) handleFreehandDrawingMove(event);
    else if (appState.isDrawingLine) handleLineDrawingMove(event);
    else if (appState.isDrawingShape) handleShapeDrawingMove(event);
    else if (appState.isPlacementDragging) handlePlacementDragMove(event);
    // Element and title dragging are handled within interactions.js via its own listeners added on mousedown
    // Marquee selection is handled within selection.js via its own listeners added on mousedown
}

function handleInteractionEnd(event) {
    // Only prevent default if we were actually handling an interaction
    // This prevents interfering with normal clicks, etc.
    if (appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape || appState.isPlacementDragging || appState.isSelectingRect) {
        // No preventDefault needed on mouseup/touchend typically
    }

    // Route to specific handlers
    if (appState.isDrawingArrow) handleArrowDrawingEnd(event);
    else if (appState.isDrawingFreehand) handleFreehandDrawingEnd(event);
    else if (appState.isDrawingLine) handleLineDrawingEnd(event);
    else if (appState.isDrawingShape) handleShapeDrawingEnd(event);
    else if (appState.isPlacementDragging) endPlacementDrag(event, () => saveStateForUndo());
    // Element and title dragging end are handled within interactions.js
    // Marquee selection end is handled within selection.js

    removeInteractionListeners(); // Clean up global listeners
}


// Add/Remove global listeners for move/end
function addInteractionListeners() {
    document.addEventListener('mousemove', handleInteractionMove, false);
    document.addEventListener('mouseup', handleInteractionEnd, false);
    document.addEventListener('touchmove', handleInteractionMove, { passive: false }); // Need preventDefault
    document.addEventListener('touchend', handleInteractionEnd, false);
    document.addEventListener('touchcancel', handleInteractionEnd, false); // Handle cancellation
}

function removeInteractionListeners() {
    document.removeEventListener('mousemove', handleInteractionMove, false);
    document.removeEventListener('mouseup', handleInteractionEnd, false);
    document.removeEventListener('touchmove', handleInteractionMove, false);
    document.removeEventListener('touchend', handleInteractionEnd, false);
    document.removeEventListener('touchcancel', handleInteractionEnd, false);
}

// Function to cancel any drawing/dragging state if needed (e.g., multi-touch)
function cancelOngoingInteractions() {
    console.log("Cancelling ongoing interaction due to multi-touch or other interruption.");
    if (appState.isDrawingArrow) { handleArrowDrawingEnd(new Event('touchcancel')); }
    if (appState.isDrawingFreehand) { handleFreehandDrawingEnd(new Event('touchcancel')); }
    if (appState.isDrawingLine) { handleLineDrawingEnd(new Event('touchcancel')); }
    if (appState.isDrawingShape) { handleShapeDrawingEnd(new Event('touchcancel')); }
    if (appState.isPlacementDragging) { endPlacementDrag(new Event('touchcancel'), null, true); } // True to indicate cancellation
    if (appState.isSelectingRect) { cancelMarqueeSelection(); }
    // Element/Title dragging cancellation might need specific handling in interactions.js if necessary
    appState.isDraggingElement = false;
    appState.isDraggingTitle = false;
    appState.isResizingElement = false;
    removeInteractionListeners(); // Ensure listeners are removed
}


// --- Main Init Function ---
function init() {
    console.log("Initializing SVG Drawing App...");
    const defsElement = dom.svgCanvas.querySelector('defs');
    if (defsElement) {
        defsElement.innerHTML = MARKER_DEFINITIONS;
    } else {
        console.error("SVG <defs> element not found in index.html!");
    }

    loadActivities();
    loadSvgLibrary();

    initCustomFieldSelector();
    populateCustomFieldSelector();

    initZoom();

    initCustomPlayerSelector();
    initCustomEquipmentSelector();
    initCustomMovementSelector();
    initCustomPassShotSelector();
    initCustomNumberSelector();
    initCustomShapeSelector();

    dom.newButton?.addEventListener('click', startNewDrawing);
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));
    dom.undoButton?.addEventListener('click', undo);
    dom.redoButton?.addEventListener('click', redo);
    dom.exportSvgButton?.addEventListener('click', exportDrawing);
    dom.importSvgButton?.addEventListener('click', () => {
        if (checkUnsavedChanges()) {
            dom.fileInput.click();
        }
    });
    dom.fileInput?.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            handleImportFileRead(event.target.files[0], () => {
                initZoom();
                saveStateForUndo();
                appState.isDrawingModified = false;
            });
            event.target.value = ''; // Reset file input
        }
    });
    dom.textToolButton?.addEventListener('click', () => setActiveTool('text-tool'));
    dom.colorPicker?.addEventListener('input', (e) => {
        appState.selectedColor = e.target.value;
        console.log("Color changed to:", appState.selectedColor);
        // Update tool icons that depend on color (e.g., shapes/lines)
        populateCustomShapeSelector(); // Regenerate shape/line icons with new color
    });
    if (dom.colorPicker) {
        dom.colorPicker.value = appState.selectedColor;
    }

    // Zoom, Drag/Drop listeners
    dom.svgCanvas.addEventListener('wheel', handleWheelZoom, {passive: false});
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', (e) => {
        handleCanvasDrop(e, () => saveStateForUndo());
    });
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);

    // --- Replace direct mousedown/move/up with unified handlers ---
    dom.svgCanvas.addEventListener('mousedown', handleInteractionStart);
    dom.svgCanvas.addEventListener('touchstart', handleInteractionStart, { passive: false }); // passive:false needed for preventDefault

    // Move and End listeners are added dynamically by handleInteractionStart


    // Click listener remains for specific actions like delete, rotate, text input finalize (though text handled separately)
    dom.svgCanvas.addEventListener('click', (e) => {
        // If we are in the middle of a placement drag, the click confirms placement - handled by endPlacementDrag called via mouseup/touchend
        if (appState.isPlacementDragging) {
            e.stopPropagation(); // Prevent other click handlers during placement
            return;
        }

        // Ignore clicks if an interaction just finished (avoids double actions)
        if (appState.justFinishedInteraction || appState.justFinishedMarquee || appState.isDraggingElement || appState.isDraggingTitle || appState.isEditingText || appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape || appState.isSelectingRect) {
            appState.justFinishedInteraction = false;
            appState.justFinishedMarquee = false;
            return;
        }

        // Clear collision highlights unless the click was on a colliding element
        const clickedCollidingElement = e.target.closest('.canvas-element.collision-indicator');
        if (!clickedCollidingElement) {
            clearCollisionHighlights(appState.currentlyHighlightedCollisions);
        }

        const clickedElementGroup = e.target.closest('.canvas-element');
        const clickedTitleText = e.target.closest('.draggable-title');

        // Handle Delete/Rotate actions on click (if not dragging)
        if (clickedElementGroup && !clickedTitleText) {
            if (appState.currentTool === 'delete') {
                clickedElementGroup.remove();
                appState.selectedElements.delete(clickedElementGroup);
                saveStateForUndo();
                return; // Stop further processing
            } else if (appState.currentTool === 'rotate') {
                if (!['player', 'number', 'text', 'shape', 'line', 'movement', 'passShot'].includes(clickedElementGroup.dataset.elementType)) {
                    rotateElement(clickedElementGroup, () => saveStateForUndo());
                    return; // Stop further processing
                }
            }
            // Selection is handled by handleInteractionStart (mousedown/touchstart)
            return;
        }

        // Handle background clicks (clear selection, reset continuous numbering)
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer) || e.target === dom.svgCanvas.parentElement);

        if (isBackgroundClick) {
            if (appState.currentTool === 'select') {
                clearSelection();
            }
            // Reset continuous numbering if active and a non-number tool is selected
            const activeToolConfig = drawingToolMap.get(appState.activeDrawingTool);
            if (appState.continuousNumberingActive && activeToolConfig?.category !== 'number') {
                console.log("Resetting continuous number sequence due to background click while not using Number tool.");
                appState.continuousNumberingActive = false;
                appState.nextNumberToPlace = 0;
            }
            // Text tool click on background is handled by handleInteractionStart
        }
    });


    // Sidebar Add/Library listeners
    dom.addSvgBtn?.addEventListener('click', () => dom.libraryInput.click());
    dom.libraryInput?.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach(handleLibraryFileRead);
        event.target.value = ''; // Reset file input
    });
    document.addEventListener('dragend', () => { // Also consider touchend for sidebar items
        destroyGhostPreview();
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }, false);

    // Unsaved changes listener
    window.addEventListener('beforeunload', (event) => {
        const isCanvasNotEmpty = dom.contentLayer.children.length > 0;
        if (appState.isDrawingModified || isCanvasNotEmpty) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (appState.isEditingText) return; // Don't interfere with text input

        // Undo/Redo
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) { redo(); } else { undo(); }
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
        // Escape key actions
        else if (e.key === 'Escape') {
            e.preventDefault();
            if (appState.isPlacementDragging) { endPlacementDrag(e, null, true); }
            else if (appState.isDrawingArrow) { handleArrowDrawingEnd(e); } // Use handleEnd to cleanup
            else if (appState.isDrawingFreehand) { handleFreehandDrawingEnd(e); }
            else if (appState.isDrawingLine) { handleLineDrawingEnd(e); }
            else if (appState.isDrawingShape) { handleShapeDrawingEnd(e); }
            else if (appState.isSelectingRect) { cancelMarqueeSelection(); }
            else if (appState.continuousNumberingActive) {
                appState.continuousNumberingActive = false;
                appState.nextNumberToPlace = 0;
                console.log("Continuous numbering stopped by Escape.");
            }
            else if (appState.selectedElements.size > 0) { clearSelection(); }
            else { setActiveTool('select'); } // Default to select tool
        }
        // Delete/Backspace
        else if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedElements.size > 0 && document.activeElement !== dom.textInputfield) { // Ensure not deleting text in input
            e.preventDefault();
            let changed = false;
            appState.selectedElements.forEach(el => {
                el.remove();
                changed = true;
            });
            clearSelection();
            if (changed) { saveStateForUndo(); }
        }
    });

    // Populate selectors initially
    populateCustomPlayerSelector();
    populateCustomEquipmentSelector();
    populateCustomMovementSelector();
    populateCustomPassShotSelector();
    populateCustomNumberSelector();
    populateCustomShapeSelector();

    // Final setup
    setActiveTool('select');
    saveStateForUndo();
    appState.isDrawingModified = false;
    updateUndoRedoButtons();
    clearSelection();
    console.log("Initialization Complete.");
}


document.addEventListener("DOMContentLoaded", init);
//***** js/app.js ******

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
    DEFAULT_SHAPE_FILL_COLOR, DEFAULT_STROKE_COLOR
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
import {saveDrawing, loadDrawing, exportDrawing, handleImportFileRead} from './persistence.js';
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
import {initCustomFieldSelector, populateCustomFieldSelector} from "./fieldSelector.js";
import {initCustomShapeSelector, populateCustomShapeSelector} from "./shapeSelector.js";
import {saveStateForUndo, undo, redo, updateUndoRedoButtons} from './history.js';
import {rotateElement, startPlacementDrag, handlePlacementDragMove, endPlacementDrag} from './interactions.js'; // Import placement drag handlers
import {initZoom, handleWheelZoom} from './zoom.js';


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
}

// --- Straight Arrow Drawing Handling (UPDATED) ---
function startArrowDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'arrow') return;
    event.preventDefault();
    event.stopPropagation();
    appState.isDrawingArrow = true;
    appState.arrowStartPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!appState.arrowStartPoint) {
        appState.isDrawingArrow = false;
        return;
    }
    const previewLine1 = dom.tempArrowPreview;
    const previewLine2 = dom.tempArrowPreview2;

    // Use strokeWidth and markerEndId directly from toolConfig (which now uses unified values)
    const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
    const markerId = toolConfig.markerEndId; // Should be MARKER_ARROW_UNIFIED_ID

    previewLine1.setAttribute('x1', appState.arrowStartPoint.x);
    previewLine1.setAttribute('y1', appState.arrowStartPoint.y);
    previewLine1.setAttribute('x2', appState.arrowStartPoint.x);
    previewLine1.setAttribute('y2', appState.arrowStartPoint.y);
    previewLine1.setAttribute('stroke', toolConfig.stroke || ARROW_COLOR);
    previewLine1.setAttribute('stroke-width', String(strokeWidth));
    previewLine1.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none'); // Keep dasharray for runs

    if (markerId && !toolConfig.isDoubleLine) {
        previewLine1.setAttribute('marker-end', `url(#${markerId})`);
    } else {
        previewLine1.removeAttribute('marker-end');
    }
    previewLine1.style.visibility = 'visible';

    if (toolConfig.isDoubleLine) { // Shot preview
        previewLine2.setAttribute('x1', appState.arrowStartPoint.x);
        previewLine2.setAttribute('y1', appState.arrowStartPoint.y);
        previewLine2.setAttribute('x2', appState.arrowStartPoint.x);
        previewLine2.setAttribute('y2', appState.arrowStartPoint.y);
        previewLine2.setAttribute('stroke', toolConfig.stroke || ARROW_COLOR);
        previewLine2.setAttribute('stroke-width', String(strokeWidth)); // Use same width
        previewLine2.setAttribute('stroke-dasharray', 'none'); // Shots are solid
        if (markerId) {
            // Apply marker to both lines for double line preview
            previewLine1.setAttribute('marker-end', `url(#${markerId})`);
            previewLine2.setAttribute('marker-end', `url(#${markerId})`);
        } else {
            previewLine2.removeAttribute('marker-end');
        }
        previewLine2.style.visibility = 'visible';
    } else {
        previewLine2.style.visibility = 'hidden';
    }
    document.addEventListener('mousemove', handleArrowDrawingMove, false);
    document.addEventListener('mouseup', handleArrowDrawingEnd, false);
}

function handleArrowDrawingMove(event) {
    if (!appState.isDrawingArrow || !appState.arrowStartPoint) return;
    event.preventDefault();
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    const previewLine1 = dom.tempArrowPreview;
    const previewLine2 = dom.tempArrowPreview2;

    if (toolConfig?.isDoubleLine) {
        const startX = appState.arrowStartPoint.x;
        const startY = appState.arrowStartPoint.y;
        const endX = currentPoint.x;
        const endY = currentPoint.y;
        // Use unified stroke width for offset calculation
        const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
        const angle = Math.atan2(endY - startY, endX - startX);
        const offset = strokeWidth * 1.5; // Visual separation for preview
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
    event.preventDefault();
    const endPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    const startPoint = appState.arrowStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    dom.tempArrowPreview.style.visibility = 'hidden';
    dom.tempArrowPreview2.style.visibility = 'hidden';
    appState.isDrawingArrow = false;
    appState.arrowStartPoint = null;
    document.removeEventListener('mousemove', handleArrowDrawingMove, false);
    document.removeEventListener('mouseup', handleArrowDrawingEnd, false);
    if (endPoint && toolConfig && toolConfig.type === 'arrow') {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 100) { // Minimum length check
            clearSelection();
            const newArrow = createArrowElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            dom.contentLayer.appendChild(newArrow);
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
            saveStateForUndo();
        }
    }
}

// --- Freehand Arrow Drawing Handling (UPDATED) ---
function startFreehandDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'freehand-arrow') return;
    event.preventDefault();
    event.stopPropagation();
    appState.isDrawingFreehand = true;
    appState.freehandPoints = [];
    const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (startPoint) {
        appState.freehandPoints.push(startPoint);
    } else {
        appState.isDrawingFreehand = false;
        return;
    }

    // Use strokeWidth and markerEndId from toolConfig
    const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED;
    const markerId = toolConfig.markerEndId; // Should be MARKER_ARROW_UNIFIED_ID

    dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints));
    dom.tempFreehandPreview.setAttribute('stroke', toolConfig.stroke || ARROW_COLOR);
    dom.tempFreehandPreview.setAttribute('stroke-width', String(strokeWidth));
    dom.tempFreehandPreview.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none'); // Keep dasharray for runs
    if (markerId) {
        dom.tempFreehandPreview.setAttribute('marker-end', `url(#${markerId})`);
    } else {
        dom.tempFreehandPreview.removeAttribute('marker-end');
    }
    dom.tempFreehandPreview.style.visibility = 'visible';
    document.addEventListener('mousemove', handleFreehandDrawingMove, false);
    document.addEventListener('mouseup', handleFreehandDrawingEnd, false);
}

function handleFreehandDrawingMove(event) {
    if (!appState.isDrawingFreehand) return;
    event.preventDefault();
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (currentPoint) {
        appState.freehandPoints.push(currentPoint);
        dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints));
    }
}

function handleFreehandDrawingEnd(event) {
    if (!appState.isDrawingFreehand) return;
    event.preventDefault();
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    const points = appState.freehandPoints;
    dom.tempFreehandPreview.style.visibility = 'hidden';
    dom.tempFreehandPreview.setAttribute('d', '');
    appState.isDrawingFreehand = false;
    appState.freehandPoints = [];
    document.removeEventListener('mousemove', handleFreehandDrawingMove, false);
    document.removeEventListener('mouseup', handleFreehandDrawingEnd, false);
    if (points.length > 1 && toolConfig && toolConfig.type === 'freehand-arrow') {
        clearSelection();
        const newArrow = createFreehandArrowElement(toolConfig, points);
        if (newArrow) {
            dom.contentLayer.appendChild(newArrow);
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
            saveStateForUndo();
        }
    }
}

// --- Basic Line Drawing Handling --- (Keep unchanged)
function startLineDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'line') return;
    event.preventDefault();
    event.stopPropagation();
    appState.isDrawingLine = true;
    appState.lineStartPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
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
    document.addEventListener('mousemove', handleLineDrawingMove, false);
    document.addEventListener('mouseup', handleLineDrawingEnd, false);
}

function handleLineDrawingMove(event) {
    if (!appState.isDrawingLine || !appState.lineStartPoint) return;
    event.preventDefault();
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;
    dom.tempLinePreview.setAttribute('x2', currentPoint.x);
    dom.tempLinePreview.setAttribute('y2', currentPoint.y);
}

function handleLineDrawingEnd(event) {
    if (!appState.isDrawingLine || !appState.lineStartPoint) return;
    event.preventDefault();
    const endPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    const startPoint = appState.lineStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    dom.tempLinePreview.style.visibility = 'hidden';
    appState.isDrawingLine = false;
    appState.lineStartPoint = null;
    document.removeEventListener('mousemove', handleLineDrawingMove, false);
    document.removeEventListener('mouseup', handleLineDrawingEnd, false);
    if (endPoint && toolConfig && toolConfig.type === 'line') {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 25) {
            clearSelection();
            const newLine = createBasicLineElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            dom.contentLayer.appendChild(newLine);
            appState.selectedElements.add(newLine);
            updateElementVisualSelection(newLine, true);
            saveStateForUndo();
        }
    }
}

// --- Shape Drawing Handling --- (Keep unchanged)
function startShapeDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'shape') return;
    event.preventDefault();
    event.stopPropagation();
    appState.isDrawingShape = true;
    appState.shapeStartPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
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
            previewElement.style.fill = appState.selectedColor + '80';
        } else {
            previewElement.style.fill = appState.selectedColor;
            previewElement.style.fillOpacity = fillOpacity;
        }
    } else {
        previewElement.style.fill = 'none';
        previewElement.style.fillOpacity = '1';
    }
    previewElement.style.visibility = 'visible';
    appState.currentShapePreview = previewElement;
    document.addEventListener('mousemove', handleShapeDrawingMove, false);
    document.addEventListener('mouseup', handleShapeDrawingEnd, false);
}

function calculateTrianglePoints(center, currentPoint) {
    const dx = currentPoint.x - center.x;
    const dy = currentPoint.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const R = dist;
    if (R < 2) return null;
    const angle = Math.atan2(dy, dx) - Math.PI / 2;
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
    event.preventDefault();
    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
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
        if (pointsStr) {
            appState.currentShapePreview.setAttribute('points', pointsStr);
        }
    } else {
        let width = Math.abs(currentPoint.x - startPoint.x);
        let height = Math.abs(currentPoint.y - startPoint.y);
        let x = Math.min(startPoint.x, currentPoint.x);
        let y = Math.min(startPoint.y, currentPoint.y);
        if (toolConfig.shapeType === 'square') {
            const side = Math.max(width, height);
            width = side;
            height = side;
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
    event.preventDefault();
    const endPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    const startPoint = appState.shapeStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    appState.currentShapePreview.style.visibility = 'hidden';
    appState.currentShapePreview.style.fillOpacity = '1';
    appState.isDrawingShape = false;
    appState.shapeStartPoint = null;
    appState.currentShapePreview = null;
    document.removeEventListener('mousemove', handleShapeDrawingMove, false);
    document.removeEventListener('mouseup', handleShapeDrawingEnd, false);
    if (endPoint && toolConfig && toolConfig.type === 'shape') {
        let finalShapeParams = {};
        let minSizeMet = false;
        if (toolConfig.shapeType === 'circle') {
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            if (radius > 2) {
                finalShapeParams = {cx: startPoint.x, cy: startPoint.y, radius: radius};
                minSizeMet = true;
            }
        } else if (toolConfig.shapeType === 'triangle') {
            const pointsStr = calculateTrianglePoints(startPoint, endPoint);
            if (pointsStr && pointsStr.split(' ').length === 3) {
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    finalShapeParams = {points: pointsStr};
                    minSizeMet = true;
                }
            }
        } else {
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
            if (width > 3 && height > 3) {
                finalShapeParams = {x: x, y: y, width: width, height: height};
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

// --- Main Init Function --- (Keep unchanged)
function init() {
    console.log("Initializing SVG Drawing App...");
    const defsElement = dom.svgCanvas.querySelector('defs');
    if (defsElement) {
        defsElement.innerHTML = MARKER_DEFINITIONS;
    } else {
        console.error("SVG <defs> element not found in index.html!");
    }
    initZoom();
    loadActivities();
    loadSvgLibrary();
    initCustomFieldSelector();
    initCustomPlayerSelector();
    initCustomEquipmentSelector();
    initCustomMovementSelector();
    initCustomPassShotSelector();
    initCustomNumberSelector();
    initCustomShapeSelector();
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));
    dom.undoButton?.addEventListener('click', undo);
    dom.redoButton?.addEventListener('click', redo);
    dom.saveButton?.addEventListener('click', saveDrawing);
    dom.loadButton?.addEventListener('click', () => {
        loadDrawing();
        initZoom();
        saveStateForUndo();
    });
    dom.exportSvgButton?.addEventListener('click', exportDrawing);
    dom.importSvgButton?.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput?.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            handleImportFileRead(event.target.files[0], () => {
                initZoom();
                saveStateForUndo();
            });
        }
    });
    dom.textToolButton?.addEventListener('click', () => setActiveTool('text-tool'));
    dom.colorPicker?.addEventListener('input', (e) => {
        appState.selectedColor = e.target.value;
        console.log("Color changed to:", appState.selectedColor);
    });
    if (dom.colorPicker) {
        dom.colorPicker.value = appState.selectedColor;
    }
    dom.svgCanvas.addEventListener('wheel', handleWheelZoom, {passive: false});
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', (e) => {
        handleCanvasDrop(e, () => saveStateForUndo());
    });
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
    dom.svgCanvas.addEventListener('mousedown', (e) => {
        const clickedElement = e.target.closest('.canvas-element');
        if (clickedElement || appState.isDraggingTitle || appState.isDraggingElement || appState.isPlacementDragging) return; // Prevent interaction if placement dragging

        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer) || e.target === dom.svgCanvas.parentElement);

        if (isBackgroundClick) {
            const currentToolConfig = drawingToolMap.get(appState.activeDrawingTool);
            if (appState.currentTool === 'draw' && currentToolConfig) {
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);
                if (!clickPt) return;

                if (currentToolConfig.type === 'arrow') {
                    startArrowDrawing(e);
                } else if (currentToolConfig.type === 'freehand-arrow') {
                    startFreehandDrawing(e);
                } else if (currentToolConfig.type === 'line') {
                    startLineDrawing(e);
                } else if (currentToolConfig.type === 'shape') {
                    startShapeDrawing(e);
                } else if (['player', 'equipment', 'number'].includes(currentToolConfig.category)) {
                    // --- Initiate Placement Drag for Player/Equipment/Number ---
                    startPlacementDrag(e, currentToolConfig, clickPt);
                }
            } else if (appState.currentTool === 'select') {
                handleMarqueeMouseDown(e);
            }
        }
    });

    dom.svgCanvas.addEventListener('mousemove', (e) => {
        if (appState.isPlacementDragging) {
            handlePlacementDragMove(e);
        }
        // Other mousemove handlers (drawing, element drag, title drag) are attached/removed dynamically
    });

    dom.svgCanvas.addEventListener('mouseup', (e) => {
        if (appState.isPlacementDragging) {
            endPlacementDrag(e, () => saveStateForUndo()); // Pass callback to save state
        }
        // Other mouseup handlers are attached/removed dynamically
    });


    dom.svgCanvas.addEventListener('click', (e) => {
        // If we are in the middle of a placement drag, the click confirms placement
        if (appState.isPlacementDragging) {
            // The mouseup handler for placement drag will handle the finalization
            // We just need to prevent other click handlers from firing
            e.stopPropagation();
            return;
        }

        if (appState.justFinishedMarquee || appState.isDraggingElement || appState.isDraggingTitle || appState.isEditingText || appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape || appState.isSelectingRect) {
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

        if (clickedElementGroup) {
            if (appState.currentTool === 'delete') {
                clickedElementGroup.remove();
                appState.selectedElements.delete(clickedElementGroup);
                saveStateForUndo();
                return;
            } else if (appState.currentTool === 'rotate') {
                if (!clickedTitleText && !['player', 'number', 'text', 'shape', 'line', 'movement', 'passShot'].includes(clickedElementGroup.dataset.elementType)) {
                    rotateElement(clickedElementGroup, () => saveStateForUndo());
                    return;
                }
            }
            // If select tool, handleElementClick will be called by the mousedown listener
            // and it stops propagation if it handles the selection.
            return; // If clicked on an element, stop here unless delete/rotate
        }

        // If the click reaches here, it's a background click
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer) || e.target === dom.svgCanvas.parentElement);

        if (isBackgroundClick) {
            // Background click logic (already handled by mousedown for drawing/marquee)
            // The only thing left here is clearing selection if the tool is 'select'
            if (appState.currentTool === 'select') {
                clearSelection();
            }

            // Reset continuous numbering on background click if active
            if (appState.continuousNumberingActive) {
                console.log("Resetting continuous number sequence due to background click.");
                appState.continuousNumberingActive = false;
                appState.nextNumberToPlace = 0;
            }
        }
    });


    dom.addSvgBtn?.addEventListener('click', () => dom.libraryInput.click());
    dom.libraryInput?.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach(handleLibraryFileRead);
        event.target.value = '';
    });
    document.addEventListener('dragend', () => {
        destroyGhostPreview();
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }, false);
    document.addEventListener('keydown', (e) => {
        if (appState.isEditingText) return;
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        } else if (e.key === 'Escape') {
            if (appState.isPlacementDragging) {
                endPlacementDrag(e, null, true); // Cancel placement drag
                console.log("Placement drag cancelled.");
                setActiveTool('select'); // Optionally switch back to select tool
            } else if (appState.isDrawingArrow) {
                dom.tempArrowPreview.style.visibility = 'hidden';
                dom.tempArrowPreview2.style.visibility = 'hidden';
                appState.isDrawingArrow = false;
                appState.arrowStartPoint = null;
                document.removeEventListener('mousemove', handleArrowDrawingMove, false);
                document.removeEventListener('mouseup', handleArrowDrawingEnd, false);
                console.log("Arrow drawing cancelled.");
                setActiveTool('select');
            } else if (appState.isDrawingFreehand) {
                dom.tempFreehandPreview.style.visibility = 'hidden';
                dom.tempFreehandPreview.setAttribute('d', '');
                appState.isDrawingFreehand = false;
                appState.freehandPoints = [];
                document.removeEventListener('mousemove', handleFreehandDrawingMove, false);
                document.removeEventListener('mouseup', handleFreehandDrawingEnd, false);
                console.log("Freehand drawing cancelled.");
                setActiveTool('select');
            } else if (appState.isDrawingLine) {
                dom.tempLinePreview.style.visibility = 'hidden';
                appState.isDrawingLine = false;
                appState.lineStartPoint = null;
                document.removeEventListener('mousemove', handleLineDrawingMove, false);
                document.removeEventListener('mouseup', handleLineDrawingEnd, false);
                console.log("Line drawing cancelled.");
                setActiveTool('select');
            } else if (appState.isDrawingShape) {
                if (appState.currentShapePreview) appState.currentShapePreview.style.visibility = 'hidden';
                appState.isDrawingShape = false;
                appState.shapeStartPoint = null;
                appState.currentShapePreview = null;
                document.removeEventListener('mousemove', handleShapeDrawingMove, false);
                document.removeEventListener('mouseup', handleShapeDrawingEnd, false);
                console.log("Shape drawing cancelled.");
                setActiveTool('select');
            } else if (appState.continuousNumberingActive) {
                appState.continuousNumberingActive = false;
                appState.nextNumberToPlace = 0;
                console.log("Continuous numbering cancelled.");
                setActiveTool('select');
            } else if (appState.isSelectingRect) {
                cancelMarqueeSelection();
            } else if (appState.selectedElements.size > 0) {
                clearSelection();
            }
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedElements.size > 0 && !appState.isEditingText) {
            e.preventDefault();
            let changed = false;
            appState.selectedElements.forEach(el => {
                el.remove();
                changed = true;
            });
            clearSelection();
            if (changed) {
                saveStateForUndo();
            }
        }
    });
    populateCustomFieldSelector();
    populateCustomPlayerSelector();
    populateCustomEquipmentSelector();
    populateCustomMovementSelector();
    populateCustomPassShotSelector();
    populateCustomNumberSelector();
    populateCustomShapeSelector();
    setActiveTool('select');
    saveStateForUndo();
    updateUndoRedoButtons();
    clearSelection();
    console.log("Initialization Complete.");
}

document.addEventListener("DOMContentLoaded", init);
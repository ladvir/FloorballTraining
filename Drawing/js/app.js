//***** js/app.js ******
// js/app.js - Main entry point
import {dom, initDom} from './dom.js';
import {appState} from './state.js';
import {
    DEFAULT_PLAYER_TOOL_ID, drawingToolMap, PLAYER_RADIUS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT,
    TEXT_FONT_SIZE,
    ARROW_STROKE_WIDTH_UNIFIED, MARKER_ARROW_UNIFIED_ID,
    MARKER_DEFINITIONS, DEFAULT_SHAPE_SIZE,
    DEFAULT_SHAPE_FILL_COLOR, DEFAULT_STROKE_COLOR, ARROW_COLOR,
    NUMBER_TOOL_ID, SVG_NS, TEXT_TOOL_ID, DEFAULT_FONT_FAMILY, DEFAULT_FONT_STYLE, DEFAULT_FONT_WEIGHT
} from './config.js';
import {
    setActiveTool,
    updateNumberToolDisplay,
    updateNumberCursor,
    toggleNumberButtonsVisibility,
    initTextPropertyControls,
    updateTextPropertyControls
} from './tools.js';
import {
    clearSelection,
    updateElementVisualSelection,
    handleMarqueeMouseDown,
    cancelMarqueeSelection
} from './selection.js';
import {loadActivities} from './sidebarActivities.js';
import {loadSvgLibrary, handleLibraryFileRead} from './sidebarLibrary.js';
import {handleCanvasDragOver, handleCanvasDrop, handleCanvasDragLeave, destroyGhostPreview} from './dragDrop.js';
import {exportDrawing, handleImportFileRead} from './persistence.js';
import {
    createPlayerElement, createBallElement, createGateElement,
    createConeElement, createLineElement, createCornerElement, createManyBallsElement,
    createArrowElement, createNumberElement, createTextElement, createFreehandArrowElement, pointsToPathData,
    createShapeElement, createBasicLineElement
} from './elements.js';
import {svgPoint, getTransformedBBox, getOrAddTransform} from './utils.js';
import { clearCollisionHighlights, getCollidingElementsByBBox, ensureCollisionIndicatorRect, getElementDimensions } from './collisions.js';

import {initCustomTeamAPlayerSelector, populateCustomTeamAPlayerSelector} from "./teamAPlayerSelector.js";
import {initCustomTeamBPlayerSelector, populateCustomTeamBPlayerSelector} from "./teamBPlayerSelector.js";
import {initCustomOtherPlayerSelector, populateCustomOtherPlayerSelector} from "./otherPlayerSelector.js";

import {initCustomEquipmentSelector, populateCustomEquipmentSelector} from "./equipmentSelector.js";
import {initCustomMovementSelector, populateCustomMovementSelector} from "./movementSelector.js";
import {initCustomPassShotSelector, populateCustomPassShotSelector} from "./passShotSelector.js";
import {initCustomFieldSelector, populateCustomFieldSelector, setFieldBackground} from "./fieldSelector.js";
import {initCustomLineSelector, populateCustomLineSelector} from "./lineSelector.js";
import {initCustomShapeSelector, populateCustomShapeSelector} from "./shapeSelector.js";
import {saveStateForUndo, undo, redo, updateUndoRedoButtons} from './history.js';
import {rotateElement, startPlacementDrag, handlePlacementDragMove, endPlacementDrag, handleElementMouseDown, handleTitleMouseDown} from './interactions.js';
import {initZoom, handleWheelZoom, resetZoom} from './zoom.js';

let isFinalizingNewText = false;

function checkUnsavedChanges() { const isCanvasNotEmpty = dom.contentLayer.children.length > 0; if (appState.isDrawingModified || isCanvasNotEmpty) { return confirm("The current drawing is not empty. Do you want to discard it and start a new drawing?"); } return true; }

function startNewDrawing() {
    if (checkUnsavedChanges()) {
        clearSelection();
        dom.contentLayer.innerHTML = '';
        // When starting new, fit to the 'Empty' field only.
        setFieldBackground('Empty', false, 'fitFieldOnly');
        initZoom(); // Initialize zoom for the new empty field view
        appState.undoStack = [];
        appState.redoStack = [];
        updateUndoRedoButtons();
        appState.isDrawingModified = false;
        appState.nextNumberToPlace = 1;
        updateNumberToolDisplay();
        updateNumberCursor();
        saveStateForUndo();
        console.log("New drawing started.");
    }
}
function resetNumberSequence() {
    appState.nextNumberToPlace = 1;
    updateNumberToolDisplay();
    updateNumberCursor();
    const resetButton = dom.resetNumberButton;
    if (resetButton) { resetButton.classList.remove('active-tool'); resetButton.classList.add('active-tool'); setTimeout(() => { resetButton.classList.remove('active-tool'); }, 300); }
}
function manuallySetNextNumber() {
    const currentNext = appState.nextNumberToPlace;
    const newNumStr = prompt(`Set next number in sequence:`, String(currentNext));
    if (newNumStr === null) { return; }
    const parsedNum = parseInt(newNumStr, 10);
    if (!isNaN(parsedNum) && parsedNum > 0) {
        appState.nextNumberToPlace = parsedNum;
        updateNumberToolDisplay();
        updateNumberCursor();
    } else {
        alert(`Invalid number: "${newNumStr}". Please enter a positive integer.`);
    }
}
function activateNumberTool() {
    let startNum = appState.nextNumberToPlace;
    if (startNum === 1) {
        const startNumStr = prompt("Enter starting number for the sequence:", "1");
        if (startNumStr !== null) {
            const parsedNum = parseInt(startNumStr, 10);
            if (!isNaN(parsedNum) && parsedNum > 0) { startNum = parsedNum; }
            else { alert("Invalid starting number. Using 1."); startNum = 1; }
        } else { startNum = 1; }
        appState.nextNumberToPlace = startNum;
    }
    setActiveTool(NUMBER_TOOL_ID);
}

function startTextEditing(element) {
    if (!element || appState.isEditingText) return;
    const textSvgElement = element.querySelector('text');
    if (!textSvgElement) return;
    if (appState.selectedElements.has(element)) {
        updateElementVisualSelection(element, true);
    }
    appState.isEditingText = true;
    appState.currentEditingElement = element;
    const originalTextContent = (element.dataset.elementType === 'text')
        ? Array.from(textSvgElement.querySelectorAll('tspan')).map(t => t.textContent).join('\n') || textSvgElement.textContent
        : textSvgElement.textContent;
    element.dataset.originalText = originalTextContent;
    textSvgElement.style.visibility = 'hidden';
    const foreignObject = dom.textInputContainer;
    const textarea = dom.textInputField;
    if (element.dataset.elementType === 'text') {
        updateTextPropertyControls(element);
        if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'flex';
    }
    const textLocalBBox = textSvgElement.getBBox();
    const transformList = element.transform.baseVal;
    let translateX = 0;
    let translateY = 0;
    for (let i = 0; i < transformList.numberOfItems; i++) {
        const transform = transformList.getItem(i);
        if (transform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            translateX = transform.matrix.e;
            translateY = transform.matrix.f;
            break;
        }
    }
    let foX = translateX + textLocalBBox.x;
    let foY = translateY + textLocalBBox.y;
    let foWidth = Math.max(80, textLocalBBox.width);
    let foHeight = Math.max(60, textLocalBBox.height);
    foreignObject.setAttribute('x', String(foX));
    foreignObject.setAttribute('y', String(foY));
    foreignObject.setAttribute('width', String(foWidth));
    foreignObject.setAttribute('height', String(foHeight));
    foreignObject.style.display = 'block';
    textarea.value = originalTextContent;
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    const fontSize = parseFloat(element.dataset.fontSize || TEXT_FONT_SIZE);
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = element.dataset.fontFamily || DEFAULT_FONT_FAMILY;
    textarea.style.fontWeight = element.dataset.fontWeight || DEFAULT_FONT_WEIGHT;
    textarea.style.fontStyle = element.dataset.fontStyle || DEFAULT_FONT_STYLE;
    textarea.style.color = element.dataset.fill || appState.selectedColor;
    textarea.style.lineHeight = `${fontSize * 1.2}px`;
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxSizing = 'border-box';
    textarea.style.textAlign = textSvgElement.getAttribute('text-anchor') === 'middle' ? 'center' : 'left';
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 0);
    textarea.onblur = finalizeTextEdit;
    textarea.onkeydown = handleTextEditKeyDown;
    updateElementVisualSelection(element, appState.selectedElements.has(element));
}
function handleTextEditKeyDown(event) { if (event.key === 'Enter' && !event.shiftKey && appState.currentEditingElement?.dataset.elementType !== 'text') { event.preventDefault(); finalizeTextEdit(); } else if (event.key === 'Escape') { cancelTextEdit(); } }
function finalizeTextEdit() {
    if (!appState.isEditingText || !appState.currentEditingElement) return;
    const element = appState.currentEditingElement;
    const textElement = element.querySelector('text');
    const textarea = dom.textInputField;
    const newContent = textarea.value.trim();
    if (textElement) {
        if (element.dataset.elementType === 'number' && newContent === '') {
            alert("Number element cannot be empty.");
            textarea.focus();
            return;
        }
        textElement.textContent = newContent;
        if (element.dataset.elementType === 'text' && newContent.includes('\n')) {
            textElement.textContent = '';
            const lines = newContent.split('\n');
            const lineHeight = parseFloat(textarea.style.fontSize || TEXT_FONT_SIZE) * 1.2;
            lines.forEach((line, index) => {
                const tspan = document.createElementNS(SVG_NS, 'tspan');
                tspan.setAttribute('x', '0');
                tspan.setAttribute('dy', index === 0 ? '0' : `${lineHeight}`);
                tspan.textContent = line || ' ';
                textElement.appendChild(tspan);
            });
        } else {
            while (textElement.firstChild && textElement.firstChild.nodeName === 'tspan') {
                textElement.removeChild(textElement.firstChild);
            }
            textElement.textContent = newContent;
        }
        textElement.style.visibility = 'visible';
        const wasSelected = appState.selectedElements.has(element);
        appState.isEditingText = false;
        appState.currentEditingElement = null;
        element.removeAttribute('data-original-text');
        updateElementVisualSelection(element, wasSelected);
        if (appState.activeDrawingTool !== TEXT_TOOL_ID && dom.textPropertiesToolbar) {
            dom.textPropertiesToolbar.style.display = 'none';
            if (wasSelected) {
                appState.selectedElements.delete(element);
                updateElementVisualSelection(element, false);
            }
        }
        saveStateForUndo();
    }
    appState.isEditingText = false;
    appState.currentEditingElement = null;
    textarea.onblur = null;
    textarea.onkeydown = null;
    dom.textInputContainer.style.display = 'none';
    textarea.value = '';
}
function cancelTextEdit() {
    if (!appState.isEditingText || !appState.currentEditingElement) return;
    const element = appState.currentEditingElement;
    const textElement = element.querySelector('text');
    const textarea = dom.textInputField;
    if (textElement) {
        const originalText = element.dataset.originalText;
        if (originalText !== undefined) {
            textElement.textContent = originalText;
        }
        textElement.style.visibility = 'visible';
        element.removeAttribute('data-original-text');
    }
    const wasSelectedInAppState = appState.selectedElements.has(element);
    appState.isEditingText = false;
    appState.currentEditingElement = null;
    textarea.onblur = null;
    textarea.onkeydown = null;
    dom.textInputContainer.style.display = 'none';
    textarea.value = '';
    updateElementVisualSelection(element, wasSelectedInAppState);
    if (appState.activeDrawingTool !== TEXT_TOOL_ID && dom.textPropertiesToolbar) {
        dom.textPropertiesToolbar.style.display = 'none';
        if (wasSelectedInAppState) {
            appState.selectedElements.delete(element);
            updateElementVisualSelection(element, false);
        }
    }
    if (appState.activeDrawingTool !== TEXT_TOOL_ID && dom.textPropertiesToolbar) {
        dom.textPropertiesToolbar.style.display = 'none';
    }
}
function startArrowDrawing(event) { if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); if (toolConfig?.type !== 'arrow') return; event.stopPropagation(); appState.isDrawingArrow = true; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; appState.arrowStartPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (!appState.arrowStartPoint) { appState.isDrawingArrow = false; return; } const previewLine1 = dom.tempArrowPreview; const previewLine2 = dom.tempArrowPreview2; const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED; const markerId = toolConfig.markerEndId; previewLine1.setAttribute('x1', appState.arrowStartPoint.x); previewLine1.setAttribute('y1', appState.arrowStartPoint.y); previewLine1.setAttribute('x2', appState.arrowStartPoint.x); previewLine1.setAttribute('y2', appState.arrowStartPoint.y); previewLine1.setAttribute('stroke', appState.selectedColor); previewLine1.setAttribute('stroke-width', String(strokeWidth)); previewLine1.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none'); if (markerId && !toolConfig.isDoubleLine) { previewLine1.setAttribute('marker-end', `url(#${markerId})`); } else { previewLine1.removeAttribute('marker-end'); } previewLine1.style.visibility = 'visible'; if (toolConfig.isDoubleLine) { previewLine2.setAttribute('x1', appState.arrowStartPoint.x); previewLine2.setAttribute('y1', appState.arrowStartPoint.y); previewLine2.setAttribute('x2', appState.arrowStartPoint.x); previewLine2.setAttribute('y2', appState.arrowStartPoint.y); previewLine2.setAttribute('stroke', appState.selectedColor); previewLine2.setAttribute('stroke-width', String(strokeWidth)); previewLine2.setAttribute('stroke-dasharray', 'none'); if (markerId) { previewLine1.setAttribute('marker-end', `url(#${markerId})`); previewLine2.setAttribute('marker-end', `url(#${markerId})`); } else { previewLine2.removeAttribute('marker-end'); } previewLine2.style.visibility = 'visible'; } else { previewLine2.style.visibility = 'hidden'; } }
function handleArrowDrawingMove(event) { if (!appState.isDrawingArrow || !appState.arrowStartPoint) return; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (!currentPoint) return; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); const previewLine1 = dom.tempArrowPreview; const previewLine2 = dom.tempArrowPreview2; if (toolConfig?.isDoubleLine) { const startX = appState.arrowStartPoint.x; const startY = appState.arrowStartPoint.y; const endX = currentPoint.x; const endY = currentPoint.y; const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED; const angle = Math.atan2(endY - startY, endX - startX); const offset = strokeWidth * 1.5; const dx = Math.sin(angle) * offset / 2; const dy = -Math.cos(angle) * offset / 2; previewLine1.setAttribute('x1', String(startX + dx)); previewLine1.setAttribute('y1', String(startY + dy)); previewLine1.setAttribute('x2', String(endX + dx)); previewLine1.setAttribute('y2', String(endY + dy)); previewLine2.setAttribute('x1', String(startX - dx)); previewLine2.setAttribute('y1', String(startY - dy)); previewLine2.setAttribute('x2', String(endX - dx)); previewLine2.setAttribute('y2', String(endY - dy)); } else { previewLine1.setAttribute('x2', currentPoint.x); previewLine1.setAttribute('y2', currentPoint.y); } }
function handleArrowDrawingEnd(event) { if (!appState.isDrawingArrow || !appState.arrowStartPoint) return; const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX; const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY; const endPoint = svgPoint(dom.svgCanvas, clientX, clientY); const startPoint = appState.arrowStartPoint; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); dom.tempArrowPreview.style.visibility = 'hidden'; dom.tempArrowPreview2.style.visibility = 'hidden'; appState.isDrawingArrow = false; appState.arrowStartPoint = null; if (endPoint && toolConfig && toolConfig.type === 'arrow') { const dx = endPoint.x - startPoint.x; const dy = endPoint.y - startPoint.y; const lengthSq = dx * dx + dy * dy; if (lengthSq > 100) { clearSelection(); const newArrow = createArrowElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y); dom.contentLayer.appendChild(newArrow); appState.selectedElements.add(newArrow); updateElementVisualSelection(newArrow, true); saveStateForUndo(); } } }
function startFreehandDrawing(event) { if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); if (toolConfig?.type !== 'freehand-arrow') return; event.stopPropagation(); appState.isDrawingFreehand = true; appState.freehandPoints = []; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; const startPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (startPoint) { appState.freehandPoints.push(startPoint); } else { appState.isDrawingFreehand = false; return; } const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_UNIFIED; const markerId = toolConfig.markerEndId; dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints)); dom.tempFreehandPreview.setAttribute('stroke', appState.selectedColor); dom.tempFreehandPreview.setAttribute('stroke-width', String(strokeWidth)); dom.tempFreehandPreview.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none'); if (markerId) { dom.tempFreehandPreview.setAttribute('marker-end', `url(#${markerId})`); } else { dom.tempFreehandPreview.removeAttribute('marker-end'); } dom.tempFreehandPreview.style.visibility = 'visible'; }
function handleFreehandDrawingMove(event) { if (!appState.isDrawingFreehand) return; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (currentPoint) { appState.freehandPoints.push(currentPoint); dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints)); } }
function handleFreehandDrawingEnd(event) { if (!appState.isDrawingFreehand) return; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); const points = appState.freehandPoints; dom.tempFreehandPreview.style.visibility = 'hidden'; dom.tempFreehandPreview.setAttribute('d', ''); appState.isDrawingFreehand = false; appState.freehandPoints = []; if (points.length > 1 && toolConfig && toolConfig.type === 'freehand-arrow') { clearSelection(); const newArrow = createFreehandArrowElement(toolConfig, points); if (newArrow) { dom.contentLayer.appendChild(newArrow); appState.selectedElements.add(newArrow); updateElementVisualSelection(newArrow, true); saveStateForUndo(); } } }
function startLineDrawing(event) { if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); if (toolConfig?.type !== 'line') return; event.stopPropagation(); appState.isDrawingLine = true; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; appState.lineStartPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (!appState.lineStartPoint) { appState.isDrawingLine = false; return; } const previewLine = dom.tempLinePreview; previewLine.setAttribute('x1', appState.lineStartPoint.x); previewLine.setAttribute('y1', appState.lineStartPoint.y); previewLine.setAttribute('x2', appState.lineStartPoint.x); previewLine.setAttribute('y2', appState.lineStartPoint.y); previewLine.setAttribute('stroke', appState.selectedColor); previewLine.setAttribute('stroke-width', String(toolConfig.strokeWidth || 2)); previewLine.removeAttribute('stroke-dasharray'); previewLine.style.visibility = 'visible'; }
function handleLineDrawingMove(event) { if (!appState.isDrawingLine || !appState.lineStartPoint) return; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (!currentPoint) return; dom.tempLinePreview.setAttribute('x2', currentPoint.x); dom.tempLinePreview.setAttribute('y2', currentPoint.y); }
function handleLineDrawingEnd(event) { if (!appState.isDrawingLine || !appState.lineStartPoint) return; const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX; const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY; const endPoint = svgPoint(dom.svgCanvas, clientX, clientY); const startPoint = appState.lineStartPoint; dom.tempLinePreview.style.visibility = 'hidden'; appState.isDrawingLine = false; appState.lineStartPoint = null; if (endPoint && startPoint) { const dx = endPoint.x - startPoint.x; const dy = endPoint.y - startPoint.y; const lengthSq = dx * dx + dy * dy; if (lengthSq > 25) { clearSelection(); const newLine = createBasicLineElement( drawingToolMap.get(appState.activeDrawingTool), startPoint.x, startPoint.y, endPoint.x, endPoint.y ); dom.contentLayer.appendChild(newLine); appState.selectedElements.add(newLine); updateElementVisualSelection(newLine, true); saveStateForUndo(); } } }
function startShapeDrawing(event) { if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); if (toolConfig?.type !== 'shape') return; event.stopPropagation(); appState.isDrawingShape = true; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; appState.shapeStartPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (!appState.shapeStartPoint) { appState.isDrawingShape = false; return; } let previewElement; if (toolConfig.shapeType === 'circle') { previewElement = dom.tempCirclePreview; previewElement.setAttribute('cx', appState.shapeStartPoint.x); previewElement.setAttribute('cy', appState.shapeStartPoint.y); previewElement.setAttribute('r', '0'); } else if (toolConfig.shapeType === 'triangle') { previewElement = dom.tempTrianglePreview; const startPtStr = `${appState.shapeStartPoint.x},${appState.shapeStartPoint.y}`; previewElement.setAttribute('points', `${startPtStr} ${startPtStr} ${startPtStr}`); } else { previewElement = dom.tempRectPreview; previewElement.setAttribute('x', appState.shapeStartPoint.x); previewElement.setAttribute('y', appState.shapeStartPoint.y); previewElement.setAttribute('width', '0'); previewElement.setAttribute('height', '0'); } previewElement.setAttribute('stroke', appState.selectedColor); previewElement.setAttribute('stroke-width', String(toolConfig.strokeWidth || 2)); previewElement.removeAttribute('stroke-dasharray'); let fillOpacity = '0.5'; if (toolConfig.isFilled) { if (/^#[0-9A-F]{6}$/i.test(appState.selectedColor)) { previewElement.style.fill = appState.selectedColor + '80'; } else { previewElement.style.fill = appState.selectedColor; previewElement.style.fillOpacity = fillOpacity; } } else { previewElement.style.fill = 'none'; previewElement.style.fillOpacity = '1'; } previewElement.style.visibility = 'visible'; appState.currentShapePreview = previewElement; }
function calculateTrianglePoints(center, currentPoint) { const dx = currentPoint.x - center.x; const dy = currentPoint.y - center.y; const dist = Math.sqrt(dx * dx + dy * dy); const R = dist; if (R < 2) return null; const angle = Math.atan2(dy, dx) - Math.PI / 2; const points = []; for (let i = 0; i < 3; i++) { const vertexAngle = angle + (i * 2 * Math.PI / 3); const vx = center.x + R * Math.cos(vertexAngle); const vy = center.y + R * Math.sin(vertexAngle); points.push(`${vx.toFixed(1)},${vy.toFixed(1)}`); } return points.join(' '); }
function handleShapeDrawingMove(event) { if (!appState.isDrawingShape || !appState.shapeStartPoint || !appState.currentShapePreview) return; const clientX = event.touches ? event.touches[0].clientX : event.clientX; const clientY = event.touches ? event.touches[0].clientY : event.clientY; const currentPoint = svgPoint(dom.svgCanvas, clientX, clientY); if (!currentPoint) return; const startPoint = appState.shapeStartPoint; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); if (toolConfig.shapeType === 'circle') { const dx = currentPoint.x - startPoint.x; const dy = currentPoint.y - startPoint.y; const radius = Math.sqrt(dx * dx + dy * dy); appState.currentShapePreview.setAttribute('r', String(Math.max(0, radius))); } else if (toolConfig.shapeType === 'triangle') { const pointsStr = calculateTrianglePoints(startPoint, currentPoint); if (pointsStr) { appState.currentShapePreview.setAttribute('points', pointsStr); } } else { let width = Math.abs(currentPoint.x - startPoint.x); let height = Math.abs(currentPoint.y - startPoint.y); let x = Math.min(startPoint.x, currentPoint.x); let y = Math.min(startPoint.y, currentPoint.y); if (toolConfig.shapeType === 'square') { const side = Math.max(width, height); width = side; height = side; if (currentPoint.x < startPoint.x) x = startPoint.x - side; if (currentPoint.y < startPoint.y) y = startPoint.y - side; } appState.currentShapePreview.setAttribute('x', String(x)); appState.currentShapePreview.setAttribute('y', String(y)); appState.currentShapePreview.setAttribute('width', String(width)); appState.currentShapePreview.setAttribute('height', String(height)); } }
function handleShapeDrawingEnd(event) { if (!appState.isDrawingShape || !appState.shapeStartPoint || !appState.currentShapePreview) return; const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX; const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY; const endPoint = svgPoint(dom.svgCanvas, clientX, clientY); const startPoint = appState.shapeStartPoint; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); appState.currentShapePreview.style.visibility = 'hidden'; appState.currentShapePreview.style.fillOpacity = '1'; appState.isDrawingShape = false; appState.shapeStartPoint = null; appState.currentShapePreview = null; if (endPoint && toolConfig && toolConfig.type === 'shape') { let finalShapeParams = {}; let minSizeMet = false; if (toolConfig.shapeType === 'circle') { const dx = endPoint.x - startPoint.x; const dy = endPoint.y - startPoint.y; const radius = Math.sqrt(dx * dx + dy * dy); if (radius > 2) { finalShapeParams = { cx: startPoint.x, cy: startPoint.y, radius: radius }; minSizeMet = true; } } else if (toolConfig.shapeType === 'triangle') { const pointsStr = calculateTrianglePoints(startPoint, endPoint); const dx = endPoint.x - startPoint.x; const dy = endPoint.y - startPoint.y; const dist = Math.sqrt(dx*dx + dy*dy); if (pointsStr && dist > 2) { finalShapeParams = { points: pointsStr }; minSizeMet = true; } } else { let width = Math.abs(endPoint.x - startPoint.x); let height = Math.abs(endPoint.y - startPoint.y); let x = Math.min(startPoint.x, endPoint.x); let y = Math.min(startPoint.y, endPoint.y); if (toolConfig.shapeType === 'square') { const side = Math.max(width, height); width = side; height = side; if (endPoint.x < startPoint.x) x = startPoint.x - side; if (endPoint.y < startPoint.y) y = startPoint.y - side; } if (width > 3 && height > 3) { finalShapeParams = { x: x, y: y, width: width, height: height }; minSizeMet = true; } } if (minSizeMet) { clearSelection(); const newShape = createShapeElement(toolConfig, finalShapeParams); if (newShape) { dom.contentLayer.appendChild(newShape); appState.selectedElements.add(newShape); updateElementVisualSelection(newShape, true); saveStateForUndo(); } else { console.error("Failed to create shape element with params:", finalShapeParams); } } } }
function handleInteractionStart(event) {
    if (event.target === dom.svgCanvas || event.target.closest('.tool-item, .custom-select-trigger')) {
        if (event.type === 'touchstart' && event.target === dom.svgCanvas) {
            event.preventDefault();
        }
    }
    const isTouchEvent = event.type.startsWith('touch');
    if (isTouchEvent && event.touches.length > 1) {
        cancelOngoingInteractions();
        return;
    }
    const clientX = isTouchEvent ? event.touches[0].clientX : event.clientX;
    const clientY = isTouchEvent ? event.touches[0].clientY : event.clientY;
    const targetElement = document.elementFromPoint(clientX, clientY);
    const clickedElementGroup = targetElement?.closest('.canvas-element');
    const clickedTitleText = targetElement?.closest('.draggable-title');
    if (clickedElementGroup) {
        if (appState.currentTool === 'select' || appState.currentTool === 'rotate') {
            if (clickedTitleText) {
                handleTitleMouseDown(event);
            } else {
                handleElementMouseDown(event);
            }
            addInteractionListeners();
            return;
        }
    }
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
            addInteractionListeners();
        } else if (appState.currentTool === 'select') {
            handleMarqueeMouseDown(event);
            addInteractionListeners();
        } else if (appState.currentTool === 'text' && appState.activeDrawingTool === TEXT_TOOL_ID) {
            const clickPt = svgPoint(dom.svgCanvas, clientX, clientY); if (clickPt) showTextInput(clickPt.x, clickPt.y);
        }
    }
}
function handleInteractionMove(event) { if (appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape || appState.isDraggingElement || appState.isDraggingTitle || appState.isPlacementDragging || appState.isSelectingRect) { if (event.type === 'touchmove') { event.preventDefault(); } } else { return; } if (appState.isDrawingArrow) handleArrowDrawingMove(event); else if (appState.isDrawingFreehand) handleFreehandDrawingMove(event); else if (appState.isDrawingLine) handleLineDrawingMove(event); else if (appState.isDrawingShape) handleShapeDrawingMove(event); else if (appState.isPlacementDragging) handlePlacementDragMove(event); }
function handleInteractionEnd(event) { if (appState.isDrawingArrow) handleArrowDrawingEnd(event); else if (appState.isDrawingFreehand) handleFreehandDrawingEnd(event); else if (appState.isDrawingLine) handleLineDrawingEnd(event); else if (appState.isDrawingShape) handleShapeDrawingEnd(event); else if (appState.isPlacementDragging) endPlacementDrag(event, () => saveStateForUndo()); removeInteractionListeners(); }
function addInteractionListeners() { document.addEventListener('mousemove', handleInteractionMove, false); document.addEventListener('mouseup', handleInteractionEnd, false); document.addEventListener('touchmove', handleInteractionMove, { passive: false }); document.addEventListener('touchend', handleInteractionEnd, false); document.addEventListener('touchcancel', handleInteractionEnd, false); }
function removeInteractionListeners() { document.removeEventListener('mousemove', handleInteractionMove, false); document.removeEventListener('mouseup', handleInteractionEnd, false); document.removeEventListener('touchmove', handleInteractionMove, false); document.removeEventListener('touchend', handleInteractionEnd, false); document.removeEventListener('touchcancel', handleInteractionEnd, false); }
function cancelOngoingInteractions() { if (appState.isDrawingArrow) { handleArrowDrawingEnd(new Event('touchcancel')); } if (appState.isDrawingFreehand) { handleFreehandDrawingEnd(new Event('touchcancel')); } if (appState.isDrawingLine) { handleLineDrawingEnd(new Event('touchcancel')); } if (appState.isDrawingShape) { handleShapeDrawingEnd(new Event('touchcancel')); } if (appState.isPlacementDragging) { endPlacementDrag(new Event('touchcancel'), null, true); } if (appState.isSelectingRect) { cancelMarqueeSelection(); } appState.isDraggingElement = false; appState.isDraggingTitle = false; appState.isResizingElement = false; removeInteractionListeners(); }

function init() {
    initDom();
    const defsElement = dom.svgCanvas.querySelector('defs'); if (defsElement) { defsElement.innerHTML = MARKER_DEFINITIONS; }
    loadActivities(); loadSvgLibrary();
    initCustomFieldSelector(); populateCustomFieldSelector();
    // initZoom() is called by populateCustomFieldSelector after initial field is set.

    initCustomTeamAPlayerSelector(); populateCustomTeamAPlayerSelector();
    initCustomTeamBPlayerSelector(); populateCustomTeamBPlayerSelector();
    initCustomOtherPlayerSelector(); populateCustomOtherPlayerSelector();    initCustomEquipmentSelector(); populateCustomEquipmentSelector();
    initCustomMovementSelector(); populateCustomMovementSelector();
    initCustomPassShotSelector(); populateCustomPassShotSelector();
    initCustomLineSelector(); populateCustomLineSelector();
    initCustomShapeSelector(); populateCustomShapeSelector();
    initTextPropertyControls();

    dom.newButton?.addEventListener('click', startNewDrawing);
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));
    dom.undoButton?.addEventListener('click', undo);
    dom.redoButton?.addEventListener('click', redo);
    dom.resetNumberButton?.addEventListener('click', resetNumberSequence);
    dom.exportSvgButton?.addEventListener('click', exportDrawing);
    dom.importSvgButton?.addEventListener('click', () => {
        if (checkUnsavedChanges()) {
            dom.fileInput.click();
        }
    });
    dom.fileInput?.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            handleImportFileRead(event.target.files[0], () => {
                // setFieldBackground should be called within handleImportFileRead with appropriate mode
                // initZoom will also be called within handleImportFileRead or its callback chain
                saveStateForUndo();
                appState.isDrawingModified = false;
            });
            event.target.value = '';
        }
    });
    dom.numberToolButton?.addEventListener('click', activateNumberTool);
    dom.textToolButton?.addEventListener('click', () => setActiveTool(TEXT_TOOL_ID));
    dom.fontFamilySelect?.addEventListener('change', handleFontFamilyChange);
    dom.fontSizeInput?.addEventListener('input', handleFontSizeChange);
    dom.fontBoldButton?.addEventListener('click', handleFontBoldToggle);
    dom.fontItalicButton?.addEventListener('click', handleFontItalicToggle);
    dom.colorPicker?.addEventListener('input', handleColorChange);
    dom.numberDescription?.addEventListener('click', () => {
        if (appState.activeDrawingTool === NUMBER_TOOL_ID) {
            manuallySetNextNumber();
        }
    });
    //dom.svgCanvas.addEventListener('wheel', handleWheelZoom, {passive: false});
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', (e) => { handleCanvasDrop(e, () => saveStateForUndo()); });
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
    dom.svgCanvas.addEventListener('mousedown', handleInteractionStart);
    dom.svgCanvas.addEventListener('touchstart', handleInteractionStart, { passive: false });
    dom.svgCanvas.addEventListener('dblclick', (e) => {
        if (appState.isDraggingElement || appState.isDraggingTitle || appState.isEditingText || appState.isPlacementDragging || appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape) { return; }
        const clickedElementGroup = e.target.closest('.canvas-element');
        if (clickedElementGroup) {
            const elementType = clickedElementGroup.dataset.elementType;
            if (elementType === 'number' || elementType === 'text') {
                e.preventDefault(); e.stopPropagation();
                clearSelection();
                appState.selectedElements.add(clickedElementGroup);
                updateElementVisualSelection(clickedElementGroup, true);
                startTextEditing(clickedElementGroup);
            }
        }
    });
    dom.svgCanvas.addEventListener('click', (e) => {
        if (appState.isPlacementDragging) { e.stopPropagation(); return; }
        if (appState.justFinishedInteraction || appState.justFinishedMarquee || appState.isDraggingElement || appState.isDraggingTitle || appState.isEditingText || appState.isDrawingArrow || appState.isDrawingFreehand || appState.isDrawingLine || appState.isDrawingShape || appState.isSelectingRect) { appState.justFinishedInteraction = false; appState.justFinishedMarquee = false; return; }
        const clickedCollidingElement = e.target.closest('.canvas-element.collision-indicator'); if (!clickedCollidingElement) { clearCollisionHighlights(appState.currentlyHighlightedCollisions); }
        const clickedElementGroup = e.target.closest('.canvas-element'); const clickedTitleText = e.target.closest('.draggable-title');
        if (clickedElementGroup && !clickedTitleText) {
            if (appState.currentTool === 'delete') {
                clickedElementGroup.remove(); appState.selectedElements.delete(clickedElementGroup); saveStateForUndo(); return;
            } else if (appState.currentTool === 'rotate') {
                if (!['player', 'number', 'shape', 'line', 'movement', 'passShot'].includes(clickedElementGroup.dataset.elementType) || clickedElementGroup.dataset.elementType === 'text') {
                    rotateElement(clickedElementGroup, () => saveStateForUndo()); return;
                }
            }
            return;
        }
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer; const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer) || e.target === dom.svgCanvas.parentElement);
        if (isBackgroundClick) {
            if (appState.currentTool === 'select') {
                clearSelection();
                if (appState.activeDrawingTool !== TEXT_TOOL_ID && dom.textPropertiesToolbar) {
                    dom.textPropertiesToolbar.style.display = 'none';
                }
            }
        }
    });
    dom.addSvgBtn?.addEventListener('click', () => dom.libraryInput.click());
    dom.libraryInput?.addEventListener('change', (event) => { Array.from(event.target.files).forEach(handleLibraryFileRead); event.target.value = ''; });
    document.addEventListener('dragend', () => { destroyGhostPreview(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); }, false);
    window.addEventListener('beforeunload', (event) => { const isCanvasNotEmpty = dom.contentLayer.children.length > 0; if (appState.isDrawingModified || isCanvasNotEmpty) { event.preventDefault(); event.returnValue = ''; } });
    document.addEventListener('keydown', (e) => {
        if (appState.isEditingText) {
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) { redo(); } else { undo(); } }
        else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 'Escape') { e.preventDefault(); if (appState.isPlacementDragging) { endPlacementDrag(e, null, true); } else if (appState.isDrawingArrow) { handleArrowDrawingEnd(e); } else if (appState.isDrawingFreehand) { handleFreehandDrawingEnd(e); } else if (appState.isDrawingLine) { handleLineDrawingEnd(e); } else if (appState.isDrawingShape) { handleShapeDrawingEnd(e); } else if (appState.isSelectingRect) { cancelMarqueeSelection(); } else if (appState.selectedElements.size > 0) { clearSelection(); } else { setActiveTool('select'); } }
        else if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedElements.size > 0 && !appState.isEditingText) {
            e.preventDefault(); let changed = false; appState.selectedElements.forEach(el => { el.remove(); changed = true; }); clearSelection(); if (changed) { saveStateForUndo(); }
        }
    });

    setActiveTool('select');
    toggleNumberButtonsVisibility(false);
    saveStateForUndo(); appState.isDrawingModified = false; updateUndoRedoButtons(); clearSelection();
    updateNumberToolDisplay();
    console.log("Initialization Complete.");
}
document.addEventListener("DOMContentLoaded", init);

function handleFontFamilyChange(event) {
    appState.currentFontFamily = event.target.value;
    applyStyleToSelectedTextElements();
}
function handleFontSizeChange(event) {
    const newSize = parseInt(event.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
        appState.currentFontSize = newSize;
        applyStyleToSelectedTextElements();
    }
}
function handleFontBoldToggle(event) {
    appState.currentFontWeight = appState.currentFontWeight === 'bold' ? 'normal' : 'bold';
    event.target.classList.toggle('active', appState.currentFontWeight === 'bold');
    applyStyleToSelectedTextElements();
}
function handleFontItalicToggle(event) {
    appState.currentFontStyle = appState.currentFontStyle === 'italic' ? 'normal' : 'italic';
    event.target.classList.toggle('active', appState.currentFontStyle === 'italic');
    applyStyleToSelectedTextElements();
}
function handleColorChange(event) {
    appState.selectedColor = event.target.value;
    populateCustomShapeSelector();
    populateCustomLineSelector(); // Update line selector icons
    applyStyleToSelectedTextElements();
}
function showTextInput(x, y) {
    if (appState.isEditingText) return;
    appState.isEditingText = true;
    appState.currentEditingElement = null;
    isFinalizingNewText = false;
    const foreignObject = dom.textInputContainer;
    const textarea = dom.textInputField;
    if (!foreignObject || !textarea) {
        appState.isEditingText = false;
        return;
    }
    const yOffset = appState.currentFontSize * 0.8;
    foreignObject.setAttribute('x', String(x));
    foreignObject.setAttribute('y', String(y - yOffset));
    foreignObject.setAttribute('width', '150');
    foreignObject.setAttribute('height', String(appState.currentFontSize * 1.5 + 10));
    foreignObject.style.display = 'block';
    textarea.value = '';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.fontSize = `${appState.currentFontSize}px`;
    textarea.style.fontFamily = appState.currentFontFamily;
    textarea.style.fontWeight = appState.currentFontWeight;
    textarea.style.fontStyle = appState.currentFontStyle;
    textarea.style.color = appState.selectedColor;
    textarea.style.lineHeight = '1.2';
    textarea.style.border = '1px dashed grey';
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxSizing = 'border-box';
    textarea.style.textAlign = 'left';
    textarea.style.paddingTop = '0';
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 0);
    textarea.onblur = () => {
        setTimeout(() => {
            if (appState.isEditingText && !appState.currentEditingElement && !isFinalizingNewText) {
                finalizeTextInput();
            }
        }, 100);
    };
    textarea.onkeydown = handleTextInputKeyDown_NewText;
}
function handleTextInputKeyDown_NewText(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        finalizeTextInput();
    } else if (event.key === 'Escape') {
        cancelTextInput();
    }
}
function finalizeTextInput() {
    if (!appState.isEditingText || appState.currentEditingElement || isFinalizingNewText) return;
    isFinalizingNewText = true;
    const textContent = dom.textInputField.value;
    const foreignObject = dom.textInputContainer;
    if (textContent.trim() && appState.activeDrawingTool === TEXT_TOOL_ID) {
        const x = parseFloat(foreignObject.getAttribute('x'));
        const y = parseFloat(foreignObject.getAttribute('y')) + (appState.currentFontSize * 0.8);
        clearSelection();
        const styleProps = {
            fontSize: appState.currentFontSize,
            fontFamily: appState.currentFontFamily,
            fontWeight: appState.currentFontWeight,
            fontStyle: appState.currentFontStyle,
            fill: appState.selectedColor
        };
        const newTextElement = createTextElement(drawingToolMap.get(TEXT_TOOL_ID), x, y, textContent, styleProps);
        dom.contentLayer.appendChild(newTextElement);
        appState.selectedElements.add(newTextElement);
        updateElementVisualSelection(newTextElement, true);
        saveStateForUndo();
    }
    cancelTextInput();
}
function cancelTextInput() {
    appState.isEditingText = false;
    isFinalizingNewText = false;
    if (dom.textInputContainer) {
        dom.textInputContainer.style.display = 'none';
    }
    if (dom.textInputField) {
        dom.textInputField.value = '';
        dom.textInputField.onblur = null;
        dom.textInputField.onkeydown = null;
    }
}
function applyStyleToSelectedTextElements() {
    let changed = false;
    appState.selectedElements.forEach(element => {
        if (element.dataset.elementType === 'text') {
            const textElement = element.querySelector('text');
            if (textElement) {
                textElement.setAttribute('font-family', appState.currentFontFamily);
                textElement.setAttribute('font-size', String(appState.currentFontSize));
                textElement.setAttribute('font-weight', appState.currentFontWeight);
                textElement.setAttribute('font-style', appState.currentFontStyle);
                textElement.setAttribute('fill', appState.selectedColor);
                element.dataset.fontFamily = appState.currentFontFamily;
                element.dataset.fontSize = String(appState.currentFontSize);
                element.dataset.fontWeight = appState.currentFontWeight;
                element.dataset.fontStyle = appState.currentFontStyle;
                element.dataset.fill = appState.selectedColor;
                const textBBox = textElement.getBBox();
                const bgRect = element.querySelector('.element-bg');
                if (bgRect) {
                    bgRect.setAttribute('x', String(textBBox.x));
                    bgRect.setAttribute('y', String(textBBox.y));
                    bgRect.setAttribute('width', String(Math.max(MIN_ELEMENT_WIDTH, textBBox.width)));
                    bgRect.setAttribute('height', String(Math.max(MIN_ELEMENT_HEIGHT, textBBox.height)));
                }
                changed = true;
            }
        }
    });
    if (changed) {
        saveStateForUndo();
    }
}
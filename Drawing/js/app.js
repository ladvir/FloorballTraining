// js/app.js - Main entry point
import { dom } from './dom.js';
import { appState } from './state.js';
import {
    DEFAULT_PLAYER_TOOL_ID, drawingToolMap, PLAYER_RADIUS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT,
    NUMBER_FONT_SIZE, TEXT_FONT_SIZE, ARROW_STROKE_WIDTH_SHOT, // Import shot stroke width
    MARKER_DEFINITIONS
} from './config.js';
import { setActiveTool } from './tools.js';
import { clearSelection, handleCanvasMouseDown, updateElementVisualSelection } from './selection.js';
import { loadActivities } from './sidebarActivities.js';
import { loadSvgLibrary, handleLibraryFileRead } from './sidebarLibrary.js';
import { handleCanvasDragOver, handleCanvasDrop, handleCanvasDragLeave, destroyGhostPreview } from './dragDrop.js';
import { saveDrawing, loadDrawing, exportDrawing, handleImportFileRead } from './persistence.js';
import {
    createPlayerElement, createCanvasElement, createBallElement, createGateElement,
    createConeElement, createLineElement, createCornerElement, createManyBallsElement,
    createArrowElement, createNumberElement, createTextElement, createFreehandArrowElement, pointsToPathData
} from './elements.js';
import { svgPoint } from './utils.js';
import { clearCollisionHighlights, getCollidingElementsByBBox, ensureCollisionIndicatorRect } from './collisions.js';
import { initCustomPlayerSelector, populateCustomPlayerSelector } from "./playerSelector.js";
import { initCustomEquipmentSelector, populateCustomEquipmentSelector } from "./equipmentSelector.js";
import { initCustomMovementSelector, populateCustomMovementSelector } from "./movementSelector.js";
import { initCustomPassShotSelector, populateCustomPassShotSelector } from "./passShotSelector.js";
import { initCustomNumberSelector, populateCustomNumberSelector } from "./numberSelector.js";
import { initCustomFieldSelector, populateCustomFieldSelector } from "./fieldSelector.js";

// --- State Extensions ---
appState.isDrawingArrow = false;
appState.arrowStartPoint = null;
appState.isEditingText = false;
appState.currentTextElement = null;
appState.nextNumberToPlace = 0;
appState.continuousNumberingActive = false;
appState.isDrawingFreehand = false;
appState.freehandPoints = [];


// --- Text Input Handling ---
function showTextInput(x, y) { appState.isEditingText = true; const foreignObject = dom.textInputContainer; const textarea = dom.textInputField; foreignObject.setAttribute('x', x); foreignObject.setAttribute('y', y - TEXT_FONT_SIZE); foreignObject.setAttribute('width', '150'); foreignObject.setAttribute('height', '50'); foreignObject.style.display = 'block'; textarea.value = ''; textarea.style.width = '100%'; textarea.style.height = '100%'; textarea.style.fontSize = `${TEXT_FONT_SIZE}px`; textarea.style.border = '1px dashed grey'; textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; textarea.style.resize = 'none'; textarea.style.outline = 'none'; textarea.style.boxSizing = 'border-box'; textarea.focus(); textarea.onblur = finalizeTextInput; textarea.onkeydown = handleTextInputKeyDown; }
function handleTextInputKeyDown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); finalizeTextInput(); } else if (event.key === 'Escape') { cancelTextInput(); } }
function finalizeTextInput() { if (!appState.isEditingText) return; const textContent = dom.textInputField.value.trim(); const foreignObject = dom.textInputContainer; const toolConfig = drawingToolMap.get(appState.activeDrawingTool); if (textContent && toolConfig) { const x = parseFloat(foreignObject.getAttribute('x')); const y = parseFloat(foreignObject.getAttribute('y')) + TEXT_FONT_SIZE; clearSelection(); const newTextElement = createTextElement(toolConfig, x, y, textContent); dom.contentLayer.appendChild(newTextElement); appState.selectedElements.add(newTextElement); updateElementVisualSelection(newTextElement, true); } cancelTextInput(); setActiveTool('select'); }
function cancelTextInput() { appState.isEditingText = false; dom.textInputField.onblur = null; dom.textInputField.onkeydown = null; dom.textInputContainer.style.display = 'none'; dom.textInputField.value = ''; }

// --- Straight Arrow Drawing Handling ---
function startArrowDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'arrow') return;
    event.preventDefault();
    event.stopPropagation();
    appState.isDrawingArrow = true;
    appState.arrowStartPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!appState.arrowStartPoint) { appState.isDrawingArrow = false; return; }

    // Setup preview line(s) style
    const previewLine1 = dom.tempArrowPreview;
    const previewLine2 = dom.tempArrowPreview2; // Get second preview line

    previewLine1.setAttribute('x1', appState.arrowStartPoint.x);
    previewLine1.setAttribute('y1', appState.arrowStartPoint.y);
    previewLine1.setAttribute('x2', appState.arrowStartPoint.x);
    previewLine1.setAttribute('y2', appState.arrowStartPoint.y);
    previewLine1.setAttribute('stroke', toolConfig.stroke || 'grey');
    previewLine1.setAttribute('stroke-width', String(toolConfig.strokeWidth || 2));
    previewLine1.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none'); // Use actual dasharray
    // Only add marker to the first preview line (or center if double)
    if (toolConfig.markerEndId && !toolConfig.isDoubleLine) {
        previewLine1.setAttribute('marker-end', `url(#${toolConfig.markerEndId})`);
    } else {
        previewLine1.removeAttribute('marker-end');
    }
    previewLine1.style.visibility = 'visible';

    // Handle second preview line for shots
    if (toolConfig.isDoubleLine) {
        previewLine2.setAttribute('x1', appState.arrowStartPoint.x);
        previewLine2.setAttribute('y1', appState.arrowStartPoint.y);
        previewLine2.setAttribute('x2', appState.arrowStartPoint.x);
        previewLine2.setAttribute('y2', appState.arrowStartPoint.y);
        previewLine2.setAttribute('stroke', toolConfig.stroke || 'grey');
        previewLine2.setAttribute('stroke-width', String(toolConfig.strokeWidth || 2));
        previewLine2.setAttribute('stroke-dasharray', 'none'); // Double lines usually solid
        // Add marker to second line as well for preview centering effect? Or handle differently?
        // Let's try adding marker to both preview lines for shots for now
        if (toolConfig.markerEndId) {
            previewLine1.setAttribute('marker-end', `url(#${toolConfig.markerEndId})`); // Add to first
            previewLine2.setAttribute('marker-end', `url(#${toolConfig.markerEndId})`); // Add to second
        } else {
            previewLine2.removeAttribute('marker-end');
        }
        previewLine2.style.visibility = 'visible';
    } else {
        previewLine2.style.visibility = 'hidden'; // Hide if not a shot
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

    // If double line (shot), calculate offset for preview lines
    if (toolConfig?.isDoubleLine) {
        const startX = appState.arrowStartPoint.x;
        const startY = appState.arrowStartPoint.y;
        const endX = currentPoint.x;
        const endY = currentPoint.y;
        const strokeWidth = toolConfig.strokeWidth || ARROW_STROKE_WIDTH_SHOT;
        const angle = Math.atan2(endY - startY, endX - startX);
        const offset = strokeWidth * 1.5; // Same offset as final element
        const dx = Math.sin(angle) * offset / 2;
        const dy = -Math.cos(angle) * offset / 2;

        // Update both preview lines with offset
        previewLine1.setAttribute('x1', String(startX + dx));
        previewLine1.setAttribute('y1', String(startY + dy));
        previewLine1.setAttribute('x2', String(endX + dx));
        previewLine1.setAttribute('y2', String(endY + dy));

        previewLine2.setAttribute('x1', String(startX - dx));
        previewLine2.setAttribute('y1', String(startY - dy));
        previewLine2.setAttribute('x2', String(endX - dx));
        previewLine2.setAttribute('y2', String(endY - dy));
    } else {
        // Update single preview line endpoint
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

    // Hide previews
    dom.tempArrowPreview.style.visibility = 'hidden';
    dom.tempArrowPreview2.style.visibility = 'hidden'; // Hide second line too

    // Clean up state and listeners
    appState.isDrawingArrow = false;
    appState.arrowStartPoint = null;
    document.removeEventListener('mousemove', handleArrowDrawingMove, false);
    document.removeEventListener('mouseup', handleArrowDrawingEnd, false);

    if (endPoint && toolConfig && toolConfig.type === 'arrow') {
        const dx = endPoint.x - startPoint.x; const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 100) { // Min length check
            clearSelection();
            const newArrow = createArrowElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            dom.contentLayer.appendChild(newArrow);
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
        }
    }
}


// --- Freehand Arrow Drawing Handling ---
function startFreehandDrawing(event) {
    if (appState.currentTool !== 'draw' || !appState.activeDrawingTool) return;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
    if (toolConfig?.type !== 'freehand-arrow') return;
    event.preventDefault(); event.stopPropagation();
    appState.isDrawingFreehand = true; appState.freehandPoints = [];
    const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (startPoint) { appState.freehandPoints.push(startPoint); }
    else { appState.isDrawingFreehand = false; return; }
    // Setup preview path style
    dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints));
    dom.tempFreehandPreview.setAttribute('stroke', toolConfig.stroke || 'grey');
    dom.tempFreehandPreview.setAttribute('stroke-width', String(toolConfig.strokeWidth || 2));
    // **** USE TOOL'S DASH STYLE FOR PREVIEW ****
    dom.tempFreehandPreview.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || 'none');
    // **** ------------------------------- ****
    if (toolConfig.markerEndId) { dom.tempFreehandPreview.setAttribute('marker-end', `url(#${toolConfig.markerEndId})`); }
    else { dom.tempFreehandPreview.removeAttribute('marker-end'); }
    dom.tempFreehandPreview.style.visibility = 'visible';
    document.addEventListener('mousemove', handleFreehandDrawingMove, false);
    document.addEventListener('mouseup', handleFreehandDrawingEnd, false);
}
function handleFreehandDrawingMove(event) { if (!appState.isDrawingFreehand) return; event.preventDefault(); const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (currentPoint) { appState.freehandPoints.push(currentPoint); dom.tempFreehandPreview.setAttribute('d', pointsToPathData(appState.freehandPoints)); } }
function handleFreehandDrawingEnd(event) { if (!appState.isDrawingFreehand) return; event.preventDefault(); const toolConfig = drawingToolMap.get(appState.activeDrawingTool); const points = appState.freehandPoints; dom.tempFreehandPreview.style.visibility = 'hidden'; dom.tempFreehandPreview.setAttribute('d', ''); appState.isDrawingFreehand = false; appState.freehandPoints = []; document.removeEventListener('mousemove', handleFreehandDrawingMove, false); document.removeEventListener('mouseup', handleFreehandDrawingEnd, false); if (points.length > 1 && toolConfig && toolConfig.type === 'freehand-arrow') { clearSelection(); const newArrow = createFreehandArrowElement(toolConfig, points); if (newArrow) { dom.contentLayer.appendChild(newArrow); appState.selectedElements.add(newArrow); updateElementVisualSelection(newArrow, true); } } }


// --- Main Init Function ---
function init() {
    console.log("Initializing SVG Drawing App...");
    const defsElement = dom.svgCanvas.querySelector('defs');
    if (defsElement) { defsElement.innerHTML = MARKER_DEFINITIONS; }
    else { console.error("SVG <defs> element not found in index.html!"); }
    loadActivities(); loadSvgLibrary(); initCustomFieldSelector(); initCustomPlayerSelector(); initCustomEquipmentSelector(); initCustomMovementSelector(); initCustomPassShotSelector(); initCustomNumberSelector();
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));
    dom.textToolButton?.addEventListener('click', () => setActiveTool('text-tool'));
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', handleCanvasDrop);
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
    dom.svgCanvas.addEventListener('mousedown', (e) => {
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer));
        if (isBackgroundClick) {
            const currentToolConfig = drawingToolMap.get(appState.activeDrawingTool);
            if (appState.currentTool === 'draw' && currentToolConfig) {
                if (currentToolConfig.type === 'arrow') { startArrowDrawing(e); }
                else if (currentToolConfig.type === 'freehand-arrow') { startFreehandDrawing(e); }
            } else if (appState.currentTool === 'select') { handleCanvasMouseDown(e); }
        }
    });
    dom.svgCanvas.addEventListener('click', (e) => {
        document.querySelectorAll('.canvas-element.collision-indicator').forEach(el => { if (!appState.currentlyHighlightedCollisions.has(el)) { el.classList.remove('collision-indicator'); } });
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer));
        if (!appState.isEditingText && isBackgroundClick) {
            const toolConfig = drawingToolMap.get(appState.activeDrawingTool);
            if (appState.currentTool === 'text') {
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY); if (clickPt) showTextInput(clickPt.x, clickPt.y);
            } else if (appState.currentTool === 'draw' && toolConfig && toolConfig.type !== 'arrow' && toolConfig.type !== 'freehand-arrow') {
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);
                if (clickPt) {
                    const noCollisionTypes = ['number', 'text', 'movement', 'passShot']; const skipCollisionCheck = noCollisionTypes.includes(toolConfig.category); let placeElement = true;
                    if (!skipCollisionCheck) {
                        let proposedWidth = MIN_ELEMENT_WIDTH, proposedHeight = MIN_ELEMENT_HEIGHT; let offsetX = -proposedWidth / 2, offsetY = -proposedHeight / 2;
                        if (toolConfig.category === 'player') { proposedWidth = (toolConfig.radius || PLAYER_RADIUS) * 2; proposedHeight = proposedWidth; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; }
                        else if (toolConfig.category === 'equipment') { switch (toolConfig.toolId) { case 'ball': proposedWidth = (toolConfig.radius || BALL_RADIUS) * 2; proposedHeight = proposedWidth; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break; case 'many-balls': proposedWidth = (toolConfig.radius || BALL_RADIUS) * 8; proposedHeight = proposedWidth; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break; case 'gate': proposedWidth = toolConfig.width || GATE_WIDTH; proposedHeight = toolConfig.height || GATE_HEIGHT; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break; case 'cone': proposedWidth = (toolConfig.radius || CONE_RADIUS) * 2; proposedHeight = toolConfig.height || CONE_HEIGHT; offsetX = -proposedWidth / 2; offsetY = -proposedHeight; break; case 'barrier-line': proposedWidth = toolConfig.length || 100; proposedHeight = toolConfig.strokeWidth || BARRIER_STROKE_WIDTH; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break; case 'barrier-corner': proposedWidth = toolConfig.radius || BARRIER_CORNER_RADIUS; proposedHeight = proposedWidth; offsetX = 0; offsetY = 0; break; } }
                        const proposedBox = { left: clickPt.x + offsetX, top: clickPt.y + offsetY, right: clickPt.x + offsetX + proposedWidth, bottom: clickPt.y + offsetY + proposedHeight }; const collidingElements = getCollidingElementsByBBox(proposedBox);
                        if (collidingElements.length > 0) { placeElement = false; console.warn("Cannot place element: Collision detected."); collidingElements.forEach(el => { ensureCollisionIndicatorRect(el); el.classList.add('collision-indicator'); }); setTimeout(() => collidingElements.forEach(el => el.classList.remove('collision-indicator')), 1500); }
                    }
                    if (placeElement) {
                        clearSelection(); let newElement = null; let numberToPlace = toolConfig.text;
                        if (toolConfig.category === 'number') {
                            if (!appState.continuousNumberingActive) { try { const selectedNum = parseInt(toolConfig.text); if (!isNaN(selectedNum)) { appState.nextNumberToPlace = selectedNum; appState.continuousNumberingActive = true; console.log("Started continuous number sequence at:", appState.nextNumberToPlace); } else { appState.continuousNumberingActive = false;} } catch { appState.continuousNumberingActive = false; } }
                            if (appState.continuousNumberingActive) { numberToPlace = String(appState.nextNumberToPlace); const tempConfig = { ...toolConfig, text: numberToPlace, label: numberToPlace }; newElement = createNumberElement(tempConfig, clickPt.x, clickPt.y); appState.nextNumberToPlace++; console.log("Placed continuous number:", numberToPlace, "Next will be:", appState.nextNumberToPlace); }
                            else { newElement = createNumberElement(toolConfig, clickPt.x, clickPt.y); }
                        } else {
                            if (appState.continuousNumberingActive) { console.log("Resetting continuous number sequence due to non-number tool placement."); appState.continuousNumberingActive = false; appState.nextNumberToPlace = 0; }
                            switch (toolConfig.category) {
                                case 'player': newElement = createPlayerElement(toolConfig, clickPt.x, clickPt.y); break;
                                case 'equipment': switch (toolConfig.toolId) { case 'ball': newElement = createBallElement(toolConfig, clickPt.x, clickPt.y); break; case 'many-balls': newElement = createManyBallsElement(toolConfig, clickPt.x, clickPt.y); break; case 'gate': newElement = createGateElement(toolConfig, clickPt.x, clickPt.y); break; case 'cone': newElement = createConeElement(toolConfig, clickPt.x, clickPt.y); break; case 'barrier-line': newElement = createLineElement(toolConfig, clickPt.x, clickPt.y); break; case 'barrier-corner': newElement = createCornerElement(toolConfig, clickPt.x, clickPt.y); break; } break;
                            }
                        }
                        if (newElement) { dom.contentLayer.appendChild(newElement); appState.selectedElements.add(newElement); updateElementVisualSelection(newElement, true); }
                    }
                }
            } else if (!appState.isDrawingArrow && !appState.isDrawingFreehand && !appState.isSelectingRect) {
                if (appState.continuousNumberingActive) { console.log("Resetting continuous number sequence due to background click."); appState.continuousNumberingActive = false; appState.nextNumberToPlace = 0; }
                clearSelection(); if (appState.currentTool !== 'select') { setActiveTool('select'); }
            }
        }
    });
    dom.addSvgBtn?.addEventListener('click', () => dom.libraryInput.click());
    dom.libraryInput?.addEventListener('change', (event) => { Array.from(event.target.files).forEach(handleLibraryFileRead); event.target.value = ''; });
    dom.importSvgButton?.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput?.addEventListener('change', (event) => { if (event.target.files.length > 0) { handleImportFileRead(event.target.files[0]); } });
    dom.saveButton?.addEventListener('click', saveDrawing); dom.loadButton?.addEventListener('click', loadDrawing); dom.exportSvgButton?.addEventListener('click', exportDrawing);
    document.addEventListener('dragend', () => { destroyGhostPreview(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); }, false);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (appState.isDrawingArrow) { dom.tempArrowPreview.style.visibility = 'hidden'; dom.tempArrowPreview2.style.visibility = 'hidden'; appState.isDrawingArrow = false; appState.arrowStartPoint = null; document.removeEventListener('mousemove', handleArrowDrawingMove, false); document.removeEventListener('mouseup', handleArrowDrawingEnd, false); console.log("Arrow drawing cancelled."); setActiveTool('select'); }
            else if (appState.isDrawingFreehand) { dom.tempFreehandPreview.style.visibility = 'hidden'; dom.tempFreehandPreview.setAttribute('d', ''); appState.isDrawingFreehand = false; appState.freehandPoints = []; document.removeEventListener('mousemove', handleFreehandDrawingMove, false); document.removeEventListener('mouseup', handleFreehandDrawingEnd, false); console.log("Freehand drawing cancelled."); setActiveTool('select'); }
            else if (appState.isEditingText) { cancelTextInput(); setActiveTool('select'); }
            else if (appState.continuousNumberingActive) { appState.continuousNumberingActive = false; appState.nextNumberToPlace = 0; console.log("Continuous numbering cancelled."); setActiveTool('select'); }
            else if (appState.isSelectingRect) { appState.isSelectingRect = false; dom.selectionRect.setAttribute('visibility', 'hidden'); console.log("Marquee selection cancelled."); }
            else if (appState.selectedElements.size > 0) { clearSelection(); }
        }
    });
    populateCustomFieldSelector(); populateCustomPlayerSelector(); populateCustomEquipmentSelector(); populateCustomMovementSelector(); populateCustomPassShotSelector(); populateCustomNumberSelector();
    setActiveTool(DEFAULT_PLAYER_TOOL_ID);
    console.log("Initialization Complete.");
}
// Start
document.addEventListener("DOMContentLoaded", init);
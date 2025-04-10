// js/app.js - Main entry point
import { dom } from './dom.js';
import { appState } from './state.js';
import {
    DEFAULT_PLAYER_TOOL_ID, drawingToolMap, PLAYER_RADIUS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT,
    NUMBER_FONT_SIZE, TEXT_FONT_SIZE
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
    createArrowElement, createNumberElement, createTextElement
} from './elements.js';
import { svgPoint } from './utils.js';
import { clearCollisionHighlights, getCollidingElementsByBBox, ensureCollisionIndicatorRect } from './collisions.js';
import { initCustomPlayerSelector, populateCustomPlayerSelector } from "./playerSelector.js";
import { initCustomEquipmentSelector, populateCustomEquipmentSelector } from "./equipmentSelector.js";
import { initCustomMovementSelector, populateCustomMovementSelector } from "./movementSelector.js";
import { initCustomPassShotSelector, populateCustomPassShotSelector } from "./passShotSelector.js";
import { initCustomNumberSelector, populateCustomNumberSelector } from "./numberSelector.js";

// --- State Extensions ---
appState.isDrawingArrow = false;
appState.arrowStartPoint = null;
appState.isEditingText = false;
appState.currentTextElement = null;

// --- Text Input Handling ---
// ... (functions remain the same) ...
function showTextInput(x, y) {
    appState.isEditingText = true;
    const foreignObject = dom.textInputContainer;
    const textarea = dom.textInputField;

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
    }
    else if (event.key === 'Escape') {
        cancelTextInput();
    }
}

function finalizeTextInput() {
    if (!appState.isEditingText) return;
    const textContent = dom.textInputField.value.trim();
    const foreignObject = dom.textInputContainer;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);

    if (textContent && toolConfig) {
        const x = parseFloat(foreignObject.getAttribute('x'));
        const y = parseFloat(foreignObject.getAttribute('y')) + TEXT_FONT_SIZE;

        clearSelection();
        const newTextElement = createTextElement(toolConfig, x, y, textContent);
        dom.svgCanvas.appendChild(newTextElement);
        appState.selectedElements.add(newTextElement);
        updateElementVisualSelection(newTextElement, true);
    }

    cancelTextInput();
    setActiveTool('select');
}

function cancelTextInput() {
    appState.isEditingText = false;
    dom.textInputField.onblur = null;
    dom.textInputField.onkeydown = null;
    dom.textInputContainer.style.display = 'none';
    dom.textInputField.value = '';
}


// --- Arrow Drawing Handling ---
// ... (functions remain the same) ...
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

    dom.tempArrowPreview.setAttribute('x1', appState.arrowStartPoint.x);
    dom.tempArrowPreview.setAttribute('y1', appState.arrowStartPoint.y);
    dom.tempArrowPreview.setAttribute('x2', appState.arrowStartPoint.x);
    dom.tempArrowPreview.setAttribute('y2', appState.arrowStartPoint.y);
    dom.tempArrowPreview.setAttribute('stroke', toolConfig.stroke || 'grey');
    dom.tempArrowPreview.setAttribute('stroke-dasharray', toolConfig.strokeDasharray || '4,4');
    if (toolConfig.markerEndId) {
        dom.tempArrowPreview.setAttribute('marker-end', `url(#${toolConfig.markerEndId})`);
    } else {
        dom.tempArrowPreview.removeAttribute('marker-end');
    }
    dom.tempArrowPreview.style.visibility = 'visible';

    document.addEventListener('mousemove', handleArrowDrawingMove, false);
    document.addEventListener('mouseup', handleArrowDrawingEnd, false);
}

function handleArrowDrawingMove(event) {
    if (!appState.isDrawingArrow || !appState.arrowStartPoint) return;
    event.preventDefault();

    const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!currentPoint) return;

    dom.tempArrowPreview.setAttribute('x2', currentPoint.x);
    dom.tempArrowPreview.setAttribute('y2', currentPoint.y);
}

function handleArrowDrawingEnd(event) {
    if (!appState.isDrawingArrow || !appState.arrowStartPoint) return;
    event.preventDefault();

    const endPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    const startPoint = appState.arrowStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);

    dom.tempArrowPreview.style.visibility = 'hidden';

    appState.isDrawingArrow = false;
    appState.arrowStartPoint = null;
    document.removeEventListener('mousemove', handleArrowDrawingMove, false);
    document.removeEventListener('mouseup', handleArrowDrawingEnd, false);

    if (endPoint && toolConfig && toolConfig.type === 'arrow') {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 100) {
            clearSelection();
            const newArrow = createArrowElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            dom.svgCanvas.appendChild(newArrow);
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
        }
    }
}

// --- Main Init Function ---
function init() {
    console.log("Initializing SVG Drawing App...");

    // --- Load Initial Data & UI ---
    loadActivities();
    loadSvgLibrary();
    initCustomPlayerSelector();
    initCustomEquipmentSelector();
    initCustomMovementSelector();
    initCustomPassShotSelector();
    initCustomNumberSelector();

    // --- Attach Core Event Listeners ---

    // Action Toolbar
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));
    dom.textToolButton?.addEventListener('click', () => setActiveTool('text-tool'));

    // Selectors handled by their init functions

    // Canvas Interaction
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', handleCanvasDrop);
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
    dom.svgCanvas.addEventListener('mousedown', (e) => {
        if (e.target === dom.svgCanvas) {
            const currentToolConfig = drawingToolMap.get(appState.activeDrawingTool);
            if (appState.currentTool === 'draw' && currentToolConfig?.type === 'arrow') {
                startArrowDrawing(e);
            } else if (appState.currentTool === 'select') {
                handleCanvasMouseDown(e);
            }
        }
    });

    // Canvas click
    dom.svgCanvas.addEventListener('click', (e) => {
        document.querySelectorAll('.canvas-element.collision-indicator').forEach(el => {
            if (!appState.currentlyHighlightedCollisions.has(el)) {
                el.classList.remove('collision-indicator');
            }
        });

        if (!appState.isEditingText && e.target === dom.svgCanvas) {
            const toolConfig = drawingToolMap.get(appState.activeDrawingTool);

            if (appState.currentTool === 'text') {
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);
                if (clickPt) showTextInput(clickPt.x, clickPt.y);

            } else if (appState.currentTool === 'draw' && toolConfig && toolConfig.type !== 'arrow') {
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);
                if (clickPt) {
                    // Define types that should NOT check for collisions
                    const noCollisionTypes = ['number', 'text', 'movement', 'passShot'];
                    const skipCollisionCheck = noCollisionTypes.includes(toolConfig.category);

                    let placeElement = true; // Assume placement is allowed initially

                    if (!skipCollisionCheck) {
                        // Calculate Proposed Bounding Box (Only for types needing collision check)
                        let proposedWidth = MIN_ELEMENT_WIDTH, proposedHeight = MIN_ELEMENT_HEIGHT;
                        let offsetX = -proposedWidth / 2, offsetY = -proposedHeight / 2; // Default center

                        if (toolConfig.category === 'player') {
                            proposedWidth = (toolConfig.radius || PLAYER_RADIUS) * 2; proposedHeight = proposedWidth;
                            offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2;
                        } else if (toolConfig.category === 'equipment') {
                            switch (toolConfig.toolId) {
                                case 'ball': proposedWidth = (toolConfig.radius || BALL_RADIUS) * 2; proposedHeight = proposedWidth; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break;
                                case 'many-balls': proposedWidth = (toolConfig.radius || BALL_RADIUS) * 8; proposedHeight = proposedWidth; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break;
                                case 'gate': proposedWidth = toolConfig.width || GATE_WIDTH; proposedHeight = toolConfig.height || GATE_HEIGHT; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break;
                                case 'cone': proposedWidth = (toolConfig.radius || CONE_RADIUS) * 2; proposedHeight = toolConfig.height || CONE_HEIGHT; offsetX = -proposedWidth / 2; offsetY = -proposedHeight; break;
                                case 'barrier-line': proposedWidth = toolConfig.length || 100; proposedHeight = toolConfig.strokeWidth || BARRIER_STROKE_WIDTH; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break;
                                case 'barrier-corner': proposedWidth = toolConfig.radius || BARRIER_CORNER_RADIUS; proposedHeight = proposedWidth; offsetX = 0; offsetY = 0; break;
                            }
                        } // No need to check 'number' here as it skips collision

                        const proposedBox = { left: clickPt.x + offsetX, top: clickPt.y + offsetY, right: clickPt.x + offsetX + proposedWidth, bottom: clickPt.y + offsetY + proposedHeight };
                        const collidingElements = getCollidingElementsByBBox(proposedBox);

                        if (collidingElements.length > 0) {
                            placeElement = false; // Collision detected, don't place
                            console.warn("Cannot place element: Collision detected.");
                            collidingElements.forEach(el => {
                                ensureCollisionIndicatorRect(el);
                                el.classList.add('collision-indicator');
                            });
                            setTimeout(() => collidingElements.forEach(el => el.classList.remove('collision-indicator')), 1500);
                        }
                    } // End collision check block

                    // Place Element if allowed
                    if (placeElement) {
                        clearSelection();
                        let newElement = null;
                        switch (toolConfig.category) {
                            case 'player': newElement = createPlayerElement(toolConfig, clickPt.x, clickPt.y); break;
                            case 'equipment':
                                switch (toolConfig.toolId) {
                                    case 'ball': newElement = createBallElement(toolConfig, clickPt.x, clickPt.y); break;
                                    case 'many-balls': newElement = createManyBallsElement(toolConfig, clickPt.x, clickPt.y); break;
                                    case 'gate': newElement = createGateElement(toolConfig, clickPt.x, clickPt.y); break;
                                    case 'cone': newElement = createConeElement(toolConfig, clickPt.x, clickPt.y); break;
                                    case 'barrier-line': newElement = createLineElement(toolConfig, clickPt.x, clickPt.y); break;
                                    case 'barrier-corner': newElement = createCornerElement(toolConfig, clickPt.x, clickPt.y); break;
                                }
                                break;
                            case 'number': newElement = createNumberElement(toolConfig, clickPt.x, clickPt.y); break;
                            // Text is handled by text tool logic, Arrows by drag logic
                        }
                        if (newElement) {
                            dom.svgCanvas.appendChild(newElement);
                            appState.selectedElements.add(newElement);
                            updateElementVisualSelection(newElement, true);
                        }
                    }
                }
            } else if (!appState.isDrawingArrow && !appState.isSelectingRect) {
                clearSelection();
                if (appState.currentTool !== 'select') {
                    setActiveTool('select');
                }
            }
        }
    });

    // Sidebar Buttons
    // ... (listeners remain the same) ...
    dom.addSvgBtn?.addEventListener('click', () => dom.libraryInput.click());
    dom.libraryInput?.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach(handleLibraryFileRead);
        event.target.value = '';
    });
    dom.importSvgButton?.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput?.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            handleImportFileRead(event.target.files[0]);
        }
    });


    // Persistence Buttons
    // ... (listeners remain the same) ...
    dom.saveButton?.addEventListener('click', saveDrawing);
    dom.loadButton?.addEventListener('click', loadDrawing);
    dom.exportSvgButton?.addEventListener('click', exportDrawing);


    // Global Drag End Cleanup
    // ... (listener remains the same) ...
    document.addEventListener('dragend', () => {
        destroyGhostPreview();
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }, false);

    // --- Populate UI Elements ---
    populateCustomPlayerSelector();
    populateCustomEquipmentSelector();
    populateCustomMovementSelector();
    populateCustomPassShotSelector();
    populateCustomNumberSelector();

    // --- Set Initial Tool ---
    setActiveTool(DEFAULT_PLAYER_TOOL_ID);

    console.log("Initialization Complete.");
}

// --- Start ---
document.addEventListener("DOMContentLoaded", init);
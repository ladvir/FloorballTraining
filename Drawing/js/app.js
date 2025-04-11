// js/app.js - Main entry point
import { dom } from './dom.js';
import { appState } from './state.js';
import {
    DEFAULT_PLAYER_TOOL_ID, drawingToolMap, PLAYER_RADIUS, BALL_RADIUS,
    GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH,
    BARRIER_CORNER_RADIUS, MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT,
    NUMBER_FONT_SIZE, TEXT_FONT_SIZE // Import new constants
} from './config.js';
import { setActiveTool } from './tools.js';
import { clearSelection, handleCanvasMouseDown, updateElementVisualSelection } from './selection.js';
import { loadActivities } from './sidebarActivities.js';
import { loadSvgLibrary, handleLibraryFileRead } from './sidebarLibrary.js';
import { handleCanvasDragOver, handleCanvasDrop, handleCanvasDragLeave, destroyGhostPreview } from './dragDrop.js';
import { saveDrawing, loadDrawing, exportDrawing, handleImportFileRead } from './persistence.js';
// Import ALL element creation functions
import {
    createPlayerElement, createCanvasElement, createBallElement, createGateElement,
    createConeElement, createLineElement, createCornerElement, createManyBallsElement,
    createArrowElement, createNumberElement, createTextElement // Add new ones
} from './elements.js';
import { svgPoint } from './utils.js';
import { clearCollisionHighlights, getCollidingElementsByBBox, ensureCollisionIndicatorRect } from './collisions.js';
import { initCustomPlayerSelector, populateCustomPlayerSelector } from "./playerSelector.js";
import { initCustomEquipmentSelector, populateCustomEquipmentSelector } from "./equipmentSelector.js";
import { initCustomMovementSelector, populateCustomMovementSelector } from "./movementSelector.js"; // Import new selectors
import { initCustomPassShotSelector, populateCustomPassShotSelector } from "./passShotSelector.js";
import { initCustomNumberSelector, populateCustomNumberSelector } from "./numberSelector.js";
import { initCustomFieldSelector, populateCustomFieldSelector } from "./fieldSelector.js"; // Import field selector functions

// --- State Extensions ---
appState.isDrawingArrow = false;
appState.arrowStartPoint = null;
appState.isEditingText = false;
appState.currentTextElement = null; // Reference to the temporary text element/input

// --- Text Input Handling ---
function showTextInput(x, y) {
    appState.isEditingText = true;
    const foreignObject = dom.textInputContainer;
    const textarea = dom.textInputField;

    // Position the foreignObject
    foreignObject.setAttribute('x', x);
    foreignObject.setAttribute('y', y - TEXT_FONT_SIZE); // Position slightly above click point
    foreignObject.setAttribute('width', '150'); // Initial size
    foreignObject.setAttribute('height', '50');
    foreignObject.style.display = 'block';

    // Style and focus the textarea
    textarea.value = '';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.fontSize = `${TEXT_FONT_SIZE}px`;
    textarea.style.border = '1px dashed grey';
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    textarea.style.resize = 'none'; // Or allow resize?
    textarea.style.outline = 'none';
    textarea.style.boxSizing = 'border-box';
    textarea.focus();

    // Add listeners to finalize
    textarea.onblur = finalizeTextInput; // Finalize on blur
    textarea.onkeydown = handleTextInputKeyDown; // Finalize on Enter (without Shift)
}

function handleTextInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent newline in textarea
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
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool); // Should be text-tool

    if (textContent && toolConfig) {
        const x = parseFloat(foreignObject.getAttribute('x'));
        const y = parseFloat(foreignObject.getAttribute('y')) + TEXT_FONT_SIZE; // Adjust back to baseline y

        clearSelection();
        const newTextElement = createTextElement(toolConfig, x, y, textContent);
        dom.contentLayer.appendChild(newTextElement); // Append to content layer
        appState.selectedElements.add(newTextElement);
        updateElementVisualSelection(newTextElement, true);
    }

    cancelTextInput(); // Hide input and reset state
    setActiveTool('select'); // Switch back to select tool
}

function cancelTextInput() {
    appState.isEditingText = false;
    dom.textInputField.onblur = null; // Remove listeners
    dom.textInputField.onkeydown = null;
    dom.textInputContainer.style.display = 'none';
    dom.textInputField.value = '';
}


// --- Arrow Drawing Handling ---
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

    // Show preview line
    dom.tempArrowPreview.setAttribute('x1', appState.arrowStartPoint.x);
    dom.tempArrowPreview.setAttribute('y1', appState.arrowStartPoint.y);
    dom.tempArrowPreview.setAttribute('x2', appState.arrowStartPoint.x); // Initially zero length
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

    // Update preview line endpoint
    dom.tempArrowPreview.setAttribute('x2', currentPoint.x);
    dom.tempArrowPreview.setAttribute('y2', currentPoint.y);
}

function handleArrowDrawingEnd(event) {
    if (!appState.isDrawingArrow || !appState.arrowStartPoint) return;
    event.preventDefault();

    const endPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    const startPoint = appState.arrowStartPoint;
    const toolConfig = drawingToolMap.get(appState.activeDrawingTool);

    // Hide preview
    dom.tempArrowPreview.style.visibility = 'hidden';

    // Clean up state and listeners
    appState.isDrawingArrow = false;
    appState.arrowStartPoint = null;
    document.removeEventListener('mousemove', handleArrowDrawingMove, false);
    document.removeEventListener('mouseup', handleArrowDrawingEnd, false);

    if (endPoint && toolConfig && toolConfig.type === 'arrow') {
        // Check if start and end points are sufficiently different
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 100) { // Only create arrow if longer than 10 pixels
            clearSelection();
            const newArrow = createArrowElement(toolConfig, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            dom.contentLayer.appendChild(newArrow); // Append to content layer
            appState.selectedElements.add(newArrow);
            updateElementVisualSelection(newArrow, true);
            // Optional: Switch back to select tool?
            // setActiveTool('select');
        }
    }
}


// --- Main Init Function ---
function init() {
    console.log("Initializing SVG Drawing App...");

    // --- Load Initial Data & UI ---
    loadActivities();
    loadSvgLibrary();
    initCustomFieldSelector(); // Init field selector
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
    dom.textToolButton?.addEventListener('click', () => setActiveTool('text-tool')); // Text tool button

    // Selectors handled by their init functions

    // Canvas Interaction
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', handleCanvasDrop);
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
    // Mousedown now handles BOTH marquee select AND arrow drawing start
    dom.svgCanvas.addEventListener('mousedown', (e) => {
        // Make sure click is not on an element already placed on contentLayer
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        // Allow mousedown on background or field layer (but not elements within field layer)
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer));

        if (isBackgroundClick) {
            const currentToolConfig = drawingToolMap.get(appState.activeDrawingTool);
            if (appState.currentTool === 'draw' && currentToolConfig?.type === 'arrow') {
                startArrowDrawing(e);
            } else if (appState.currentTool === 'select') {
                handleCanvasMouseDown(e); // Original marquee select handler
            }
            // Click handler handles placement of non-arrow items and text tool start
        }
    });

    // Canvas click (place drawing tool, clear selection, START TEXT INPUT)
    dom.svgCanvas.addEventListener('click', (e) => {
        // Clear temporary collision highlights if click occurs
        document.querySelectorAll('.canvas-element.collision-indicator').forEach(el => {
            if (!appState.currentlyHighlightedCollisions.has(el)) {
                el.classList.remove('collision-indicator');
            }
        });

        // Check if click is on background/field layer, not on an existing element in contentLayer
        const contentLayerClicked = dom.contentLayer.contains(e.target) && e.target !== dom.contentLayer;
        // Allow clicks on background or field layer (but not elements within field layer)
        const isBackgroundClick = (e.target === dom.svgCanvas || (!contentLayerClicked && dom.fieldLayer.contains(e.target) && e.target === dom.fieldLayer));


        if (!appState.isEditingText && isBackgroundClick) {
            const toolConfig = drawingToolMap.get(appState.activeDrawingTool);

            if (appState.currentTool === 'text') {
                // --- Start Text Input ---
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);
                if (clickPt) {
                    showTextInput(clickPt.x, clickPt.y);
                }
            } else if (appState.currentTool === 'draw' && toolConfig && toolConfig.type !== 'arrow') {
                // --- Place Player, Equipment, Number ---
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
                                case 'many-balls': proposedWidth = (toolConfig.radius || BALL_RADIUS) * 8; proposedHeight = proposedWidth; offsetX = -proposedWidth / 2; offsetY = -proposedHeight / 2; break; // Estimate
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
                            dom.contentLayer.appendChild(newElement); // Append to content layer
                            appState.selectedElements.add(newElement);
                            updateElementVisualSelection(newElement, true);
                        }
                    }
                }
            } else if (!appState.isDrawingArrow && !appState.isSelectingRect) { // Not drawing arrow or marquee selecting
                // Clear selection or switch tool
                clearSelection();
                if (appState.currentTool !== 'select') {
                    setActiveTool('select');
                }
            }
        }
        // Clicks on existing elements handled by makeElementInteractive
    });

    // Sidebar Buttons
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
    dom.saveButton?.addEventListener('click', saveDrawing);
    dom.loadButton?.addEventListener('click', loadDrawing);
    dom.exportSvgButton?.addEventListener('click', exportDrawing);

    // Global Drag End Cleanup
    document.addEventListener('dragend', () => {
        destroyGhostPreview();
        clearCollisionHighlights(appState.currentlyHighlightedCollisions);
    }, false);

    // --- Populate UI Elements ---
    populateCustomFieldSelector(); // Populate field selector
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
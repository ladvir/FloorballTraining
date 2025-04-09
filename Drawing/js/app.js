// js/app.js - Main entry point
import { dom } from './dom.js';
import { appState } from './state.js';
import { DEFAULT_PLAYER_TOOL_ID, playerToolMap, PLAYER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';
import { clearSelection, handleCanvasMouseDown, updateElementVisualSelection } from './selection.js';
import { loadActivities } from './sidebarActivities.js';
import { loadSvgLibrary, handleLibraryFileRead } from './sidebarLibrary.js';
import { handleCanvasDragOver, handleCanvasDrop, handleCanvasDragLeave, destroyGhostPreview } from './dragDrop.js';
import { saveDrawing, loadDrawing, exportDrawing, handleImportFileRead } from './persistence.js';
import { createPlayerElement } from './elements.js';
import { svgPoint } from './utils.js';
// Import ensureCollisionIndicatorRect for the temporary highlight
import { clearCollisionHighlights, getCollidingElementsByBBox, ensureCollisionIndicatorRect } from './collisions.js';
import { initCustomPlayerSelector, populateCustomPlayerSelector } from "./playerSelector.js";


function init() {
    console.log("Initializing SVG Drawing App...");

    // --- Load Initial Data & UI ---
    loadActivities();
    loadSvgLibrary();
    initCustomPlayerSelector(); // Attaches listeners for the new custom dropdown

    // --- Attach Core Event Listeners ---

    // Action Toolbar
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));

    // Player Selector handled by initCustomPlayerSelector and its internal listeners

    // Canvas Interaction
    dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver);
    dom.svgCanvas.addEventListener('drop', handleCanvasDrop);
    dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
    dom.svgCanvas.addEventListener('mousedown', handleCanvasMouseDown); // Marquee select start

    // Canvas click (place drawing tool, clear selection)
    dom.svgCanvas.addEventListener('click', (e) => {
        if (e.target === dom.svgCanvas) { // Click on background
            if (appState.currentTool === 'draw' && appState.activeDrawingTool) {
                const toolConfig = playerToolMap.get(appState.activeDrawingTool);
                const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);

                if (toolConfig && clickPt) {
                    const radius = toolConfig.radius || PLAYER_RADIUS;
                    const proposedBox = {
                        left: clickPt.x - radius, top: clickPt.y - radius,
                        right: clickPt.x + radius, bottom: clickPt.y + radius
                    };
                    const collidingElements = getCollidingElementsByBBox(proposedBox);

                    if (collidingElements.length === 0) {
                        // --- No collision: Place the player ---
                        clearSelection();
                        const newPlayer = createPlayerElement(toolConfig, clickPt.x, clickPt.y);
                        appState.selectedElements.add(newPlayer);
                        updateElementVisualSelection(newPlayer, true);
                        // Optional: Switch back to select?
                        // setActiveTool('select');
                    } else {
                        // --- Collision detected ---
                        // Check if any colliding elements are activities
                        const collidingActivities = collidingElements.filter(el => el.dataset.activityId);

                        if (collidingActivities.length > 0) {
                            // --- Collision with ACTIVITY ---
                            console.warn("Cannot place player: Collision with activity detected at proposed location.");
                            // Briefly highlight the colliding activities instead of showing an alert
                            collidingActivities.forEach(act => {
                                ensureCollisionIndicatorRect(act); // Make sure the rect element exists
                                act.classList.add('collision-indicator'); // Show the red dashed border
                            });
                            // Remove the highlight after a short delay
                            setTimeout(() => {
                                collidingActivities.forEach(act => {
                                    act.classList.remove('collision-indicator');
                                });
                            }, 1500); // Highlight duration in milliseconds (e.g., 1.5 seconds)
                        } else {
                            // --- Collision with OTHER elements (players, library items) ---
                            // Keep the alert for collisions with non-activity elements
                            alert("Cannot place element here due to collision with another element.");
                            // Optional: Could also highlight these elements temporarily if desired
                        }
                    }
                }
            } else if (!appState.isSelectingRect) { // Not drawing and not starting marquee
                clearSelection();
                if (appState.currentTool !== 'select') {
                    setActiveTool('select'); // Switch back to select tool if bg clicked
                }
            }
        }
        // Clicks on elements are handled by listeners attached via makeElementInteractive
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
    populateCustomPlayerSelector(); // Populate the new custom dropdown list

    // --- Set Initial Tool ---
    setActiveTool(DEFAULT_PLAYER_TOOL_ID); // Start in draw mode (will also sync dropdown value and trigger)

    console.log("Initialization Complete.");
}

// --- Start ---
document.addEventListener("DOMContentLoaded", init);
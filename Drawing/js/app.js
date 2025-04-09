// js/app.js - Main entry point
import { dom } from './dom.js';
import { appState } from './state.js'; // Import state if needed directly (e.g., for canvas click)
import { DEFAULT_PLAYER_TOOL_ID } from './config.js';
import { setActiveTool } from './tools.js';
import { clearSelection, handleCanvasMouseDown } from './selection.js';
import { loadActivities } from './sidebarActivities.js';
import { loadSvgLibrary, handleLibraryFileRead } from './sidebarLibrary.js';
import { handleCanvasDragOver, handleCanvasDrop, handleCanvasDragLeave, destroyGhostPreview } from './dragDrop.js';
import { saveDrawing, loadDrawing, exportDrawing, handleImportFileRead } from './persistence.js';
import { playerToolMap, PLAYER_RADIUS } from './config.js'; // For canvas click placement
import { createPlayerElement } from './elements.js'; // For canvas click placement
import { svgPoint } from './utils.js'; // For canvas click placement
import {clearCollisionHighlights, getCollidingElementsByBBox} from './collisions.js'; // For canvas click placement

// Ensure necessary functions are imported if needed for the click handler etc.
import { updateElementVisualSelection } from './selection.js';


function init() {
    console.log("Initializing SVG Drawing App...");

    // --- Load Initial Data & UI ---
    loadActivities();
    loadSvgLibrary();
    initPlayerSelector(); // Populates and adds listener

    // --- Attach Core Event Listeners ---

    // Action Toolbar
    dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
    dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
    dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));

    // Player Selector handled by initPlayerSelector

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
                    if (getCollidingElementsByBBox(proposedBox).length === 0) {
                        clearSelection();
                        const newPlayer = createPlayerElement(toolConfig, clickPt.x, clickPt.y);
                        appState.selectedElements.add(newPlayer);
                        updateElementVisualSelection(newPlayer, true); // Need selection module
                        // Optional: Switch back to select?
                        // setActiveTool('select');
                    } else {
                        alert("Cannot place element here due to collision.");
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

    populatePlayerSelector(); // Populate player selector with initial data 
    
    // --- Set Initial Tool ---
    // Set default player icon (if not already done by initPlayerSelector)
    // updateSelectedPlayerIcon(DEFAULT_PLAYER_TOOL_ID);
    setActiveTool(DEFAULT_PLAYER_TOOL_ID); // Start in draw mode
    // OR start in select mode:
    //setActiveTool('select');


    console.log("Initialization Complete.");
}

// --- Start ---
document.addEventListener("DOMContentLoaded", init);

import {initPlayerSelector, populatePlayerSelector} from "./playerSelector.js"; // Re-import for click handler
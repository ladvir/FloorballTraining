// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { drawingToolMap, SVG_NS } from './config.js';
import { updatePlayerTriggerDisplay } from './playerSelector.js';
import { updateEquipmentTriggerDisplay } from './equipmentSelector.js';
import { updateMovementTriggerDisplay } from './movementSelector.js';
import { updatePassShotTriggerDisplay } from './passShotSelector.js';
import { updateNumberTriggerDisplay } from './numberSelector.js';
import { updateFieldTriggerDisplay } from './fieldSelector.js'; // Import field trigger updater

// --- Generate Cursors ---
// ... (generateCursorDataUrl remains the same) ...
function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') { const radius = 8; const diameter = radius * 2; let textElement = ''; if (text) { textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="9" font-weight="bold" style="pointer-events:none;">${text}</text>`; } const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`; return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`; }

export const toolCursors = {};
drawingToolMap.forEach((tool, toolId) => {
    if (tool.category === 'player') {
        toolCursors[toolId] = generateCursorDataUrl(
            tool.fill === 'none' ? 'white' : tool.fill,
            tool.stroke,
            tool.text,
            tool.textColor
        );
    }
});
// Define generic cursors
const crosshairCursor = 'crosshair';
const textCursor = 'text';
const pointerCursor = 'pointer'; // For drag-drawing arrows/freehand

/** Sets the active tool and updates UI. */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);
    const previousToolConfig = drawingToolMap.get(appState.activeDrawingTool);

    // Reset previous state
    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate', 'tool-text'); // Added tool-text reset
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    dom.textToolButton?.classList.remove('active-tool');
    appState.activeDrawingTool = null;
    dom.svgCanvas.style.cursor = '';

    // --- Continuous Number Logic: Reset if switching AWAY from a number tool ---
    if (previousToolConfig?.category === 'number' && toolId !== previousToolConfig.toolId) {
        appState.nextNumberToPlace = null; // Reset sequence
        console.log("Reset continuous number sequence.");
    }
    // --- End Continuous Number Logic ---

    const selectedToolConfig = drawingToolMap.get(toolId);

    // Function to reset all trigger displays
    const resetAllTriggers = () => {
        updatePlayerTriggerDisplay(null);
        updateEquipmentTriggerDisplay(null);
        updateMovementTriggerDisplay(null);
        updatePassShotTriggerDisplay(null);
        updateNumberTriggerDisplay(null);
        // Field trigger is independent of drawing tools
    };

    // Set new state based on toolId
    if (toolId === 'delete') {
        dom.body.classList.add('tool-delete');
        appState.currentTool = 'delete';
        dom.deleteToolButton?.classList.add('active-tool');
        resetAllTriggers();
    } else if (toolId === 'rotate') {
        dom.body.classList.add('tool-rotate');
        appState.currentTool = 'rotate';
        dom.rotateToolButton?.classList.add('active-tool');
        resetAllTriggers();
    } else if (toolId === 'text-tool') {
        dom.body.classList.add('tool-text'); // Use tool-text class
        appState.currentTool = 'text';
        appState.activeDrawingTool = toolId;
        dom.textToolButton?.classList.add('active-tool');
        dom.svgCanvas.style.cursor = textCursor;
        resetAllTriggers();
    } else if (selectedToolConfig) { // Handle tools from selectors
        dom.body.classList.add('tool-draw');
        appState.currentTool = 'draw';
        appState.activeDrawingTool = toolId;

        resetAllTriggers();
        let cursor = crosshairCursor;

        switch (selectedToolConfig.category) {
            case 'player':
                updatePlayerTriggerDisplay(toolId);
                cursor = toolCursors[toolId] || crosshairCursor;
                break;
            case 'equipment':
                updateEquipmentTriggerDisplay(toolId);
                cursor = crosshairCursor;
                break;
            case 'movement':
                updateMovementTriggerDisplay(toolId);
                // Use pointer for both straight and freehand arrows to indicate drag action
                cursor = pointerCursor;
                break;
            case 'passShot':
                updatePassShotTriggerDisplay(toolId);
                cursor = pointerCursor;
                break;
            case 'number':
                updateNumberTriggerDisplay(toolId);
                cursor = crosshairCursor;
                // --- Continuous Number Logic: Set next number when selecting ---
                try {
                    const selectedNum = parseInt(selectedToolConfig.text);
                    if (!isNaN(selectedNum)) {
                        appState.nextNumberToPlace = selectedNum + 1; // Prepare for next click
                        console.log("Set next number to place:", appState.nextNumberToPlace);
                    } else {
                        appState.nextNumberToPlace = null; // Reset if selected tool text isn't a number
                    }
                } catch {
                    appState.nextNumberToPlace = null;
                }
                // --- End Continuous Number Logic ---
                break;
        }
        dom.svgCanvas.style.cursor = cursor;

    } else {
        // Default to select tool
        toolId = 'select';
        dom.body.classList.add('tool-select');
        appState.currentTool = 'select';
        dom.selectToolButton?.classList.add('active-tool');
        resetAllTriggers();
    }

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool, "nextNumber:", appState.nextNumberToPlace);
}
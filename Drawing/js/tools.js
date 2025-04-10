// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { drawingToolMap, SVG_NS } from './config.js';
import { updatePlayerTriggerDisplay } from './playerSelector.js';
import { updateEquipmentTriggerDisplay } from './equipmentSelector.js';
import { updateMovementTriggerDisplay } from './movementSelector.js'; // Import new trigger updaters
import { updatePassShotTriggerDisplay } from './passShotSelector.js';
import { updateNumberTriggerDisplay } from './numberSelector.js';
// import { clearSelection } from './selection.js';

// --- Generate Cursors ---
function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') {
    const radius = 8;
    const diameter = radius * 2;
    let textElement = '';
    if (text) {
        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="9" font-weight="bold" style="pointer-events:none;">${text}</text>`;
    }
    const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`;
    return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`;
}

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
    // Add specific cursors for other types if needed
});
// Define generic cursors
const crosshairCursor = 'crosshair';
const textCursor = 'text'; // For text tool

/** Sets the active tool and updates UI (body class, button styles, cursor). */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);

    // Reset previous state
    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate');
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    dom.textToolButton?.classList.remove('active-tool'); // Reset text tool button
    appState.activeDrawingTool = null;
    dom.svgCanvas.style.cursor = '';

    const selectedToolConfig = drawingToolMap.get(toolId);

    // Function to reset all trigger displays
    const resetAllTriggers = () => {
        updatePlayerTriggerDisplay(null);
        updateEquipmentTriggerDisplay(null);
        updateMovementTriggerDisplay(null);
        updatePassShotTriggerDisplay(null);
        updateNumberTriggerDisplay(null);
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
    } else if (toolId === 'text-tool') { // Handle text tool button
        dom.body.classList.add('tool-draw'); // Still a drawing action
        appState.currentTool = 'text'; // Specific state for text input mode
        appState.activeDrawingTool = toolId; // Store the tool ID
        dom.textToolButton?.classList.add('active-tool');
        dom.svgCanvas.style.cursor = textCursor;
        resetAllTriggers();
    } else if (selectedToolConfig) { // Handle tools from selectors
        dom.body.classList.add('tool-draw');
        appState.currentTool = 'draw'; // General draw state for placing/drawing items
        appState.activeDrawingTool = toolId;

        // Reset all triggers first
        resetAllTriggers();
        let cursor = crosshairCursor; // Default cursor for new types

        // Update the correct dropdown display and set cursor
        switch (selectedToolConfig.category) {
            case 'player':
                updatePlayerTriggerDisplay(toolId);
                cursor = toolCursors[toolId] || crosshairCursor;
                break;
            case 'equipment':
                updateEquipmentTriggerDisplay(toolId);
                cursor = crosshairCursor; // Equipment uses crosshair
                break;
            case 'movement':
                updateMovementTriggerDisplay(toolId);
                cursor = 'pointer'; // Indicate click-and-drag for arrows
                break;
            case 'passShot':
                updatePassShotTriggerDisplay(toolId);
                cursor = 'pointer'; // Indicate click-and-drag for arrows
                break;
            case 'number':
                updateNumberTriggerDisplay(toolId);
                cursor = crosshairCursor; // Numbers use crosshair
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

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool);
}
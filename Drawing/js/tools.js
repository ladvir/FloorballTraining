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
// ... (cursor generation remains the same) ...
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
});
const crosshairCursor = 'crosshair';
const textCursor = 'text';
const pointerCursor = 'pointer'; // For arrows
const defaultCursor = 'default'; // For select/field

/** Sets the active tool and updates UI (body class, button styles, cursor). */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);

    // Reset previous state
    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate', 'tool-text'); // Added tool-text reset
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    dom.textToolButton?.classList.remove('active-tool');
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
        updateFieldTriggerDisplay(null); // Reset field trigger
    };

    // Set new state based on toolId
    if (toolId === 'delete') {
        dom.body.classList.add('tool-delete');
        appState.currentTool = 'delete';
        dom.deleteToolButton?.classList.add('active-tool');
        dom.svgCanvas.style.cursor = crosshairCursor;
        resetAllTriggers();
    } else if (toolId === 'rotate') {
        dom.body.classList.add('tool-rotate');
        appState.currentTool = 'rotate';
        dom.rotateToolButton?.classList.add('active-tool');
        // Cursor set via CSS based on element hover
        resetAllTriggers();
    } else if (toolId === 'text-tool') {
        dom.body.classList.add('tool-text'); // Use specific class for text mode
        appState.currentTool = 'text';
        appState.activeDrawingTool = toolId;
        dom.textToolButton?.classList.add('active-tool');
        dom.svgCanvas.style.cursor = textCursor;
        resetAllTriggers();
    } else if (selectedToolConfig) { // Handle tools from selectors
        // Field tools are handled directly by their selector, then switch back to select
        if (selectedToolConfig.category === 'field') {
            // The field selector already called setFieldBackground and setActiveTool('select')
            // Just ensure the trigger is updated (it should be already, but safe to call again)
            resetAllTriggers();
            updateFieldTriggerDisplay(toolId);
            // Keep current tool as 'select'
            appState.currentTool = 'select';
            dom.selectToolButton?.classList.add('active-tool');
            dom.svgCanvas.style.cursor = defaultCursor;

        } else { // Handle other drawing tools
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
                    cursor = pointerCursor;
                    break;
                case 'passShot':
                    updatePassShotTriggerDisplay(toolId);
                    cursor = pointerCursor;
                    break;
                case 'number':
                    updateNumberTriggerDisplay(toolId);
                    cursor = crosshairCursor;
                    break;
            }
            dom.svgCanvas.style.cursor = cursor;
        }

    } else {
        // Default to select tool
        toolId = 'select';
        dom.body.classList.add('tool-select');
        appState.currentTool = 'select';
        dom.selectToolButton?.classList.add('active-tool');
        dom.svgCanvas.style.cursor = defaultCursor;
        resetAllTriggers();
    }

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool);
}
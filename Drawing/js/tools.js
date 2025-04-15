// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { drawingToolMap, SVG_NS } from './config.js';
import { updatePlayerTriggerDisplay } from './playerSelector.js';
import { updateEquipmentTriggerDisplay } from './equipmentSelector.js';
import { updateMovementTriggerDisplay } from './movementSelector.js';
import { updatePassShotTriggerDisplay } from './passShotSelector.js';
import { updateNumberTriggerDisplay } from './numberSelector.js';
import { updateFieldTriggerDisplay } from './fieldSelector.js';

// --- Generate Cursors ---
function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') { const radius = 8; const diameter = radius * 2; let textElement = ''; if (text) { textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="9" font-weight="bold" style="pointer-events:none;">${text}</text>`; } const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`; return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`; }

export const toolCursors = {};
drawingToolMap.forEach((tool, toolId) => { if (tool.category === 'player') { toolCursors[toolId] = generateCursorDataUrl( tool.fill === 'none' ? 'white' : tool.fill, tool.stroke, tool.text, tool.textColor ); } });
const crosshairCursor = 'crosshair'; const textCursor = 'text'; const pointerCursor = 'pointer'; // Used for arrows/freehand

/** Sets the active tool and updates UI. */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);
    const previousToolConfig = drawingToolMap.get(appState.activeDrawingTool);

    // Reset previous state
    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate', 'tool-text');
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    dom.textToolButton?.classList.remove('active-tool');
    appState.activeDrawingTool = null; // Reset active drawing tool first
    dom.svgCanvas.style.cursor = '';

    // Reset continuous numbering if switching AWAY from a number tool
    if (appState.continuousNumberingActive && previousToolConfig?.category === 'number' && toolId !== previousToolConfig.toolId) {
        appState.continuousNumberingActive = false;
        appState.nextNumberToPlace = 0;
        console.log("Reset continuous number sequence.");
    }

    const selectedToolConfig = drawingToolMap.get(toolId);

    // Function to reset all trigger displays and their descriptions
    const resetAllTriggersAndDescriptions = (activeToolId = null) => {
        const activeCategory = drawingToolMap.get(activeToolId)?.category;

        // Update display, keeping current if its category matches activeToolId, otherwise resetting to default/first
        updatePlayerTriggerDisplay(activeCategory === 'player' ? activeToolId : null);
        updateEquipmentTriggerDisplay(activeCategory === 'equipment' ? activeToolId : null);
        updateMovementTriggerDisplay(activeCategory === 'movement' ? activeToolId : null);
        updatePassShotTriggerDisplay(activeCategory === 'passShot' ? activeToolId : null);
        updateNumberTriggerDisplay(activeCategory === 'number' ? activeToolId : null);

        // Reset text tool description only if text tool is NOT active
        if (activeToolId !== 'text-tool' && dom.textDescription) {
            dom.textDescription.textContent = 'Text';
            dom.textDescription.title = 'Text Tool';
        }
    };

    // Set new state based on toolId
    if (toolId === 'delete') {
        dom.body.classList.add('tool-delete'); appState.currentTool = 'delete'; dom.deleteToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        dom.svgCanvas.style.cursor = crosshairCursor; // Set cursor for delete
    } else if (toolId === 'rotate') {
        dom.body.classList.add('tool-rotate'); appState.currentTool = 'rotate'; dom.rotateToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        // Cursor for rotate is handled by CSS body class
    } else if (toolId === 'text-tool') {
        dom.body.classList.add('tool-text'); appState.currentTool = 'text'; appState.activeDrawingTool = toolId; dom.textToolButton?.classList.add('active-tool'); dom.svgCanvas.style.cursor = textCursor;
        resetAllTriggersAndDescriptions('text-tool');
        if (dom.textDescription) { dom.textDescription.textContent = 'Text'; dom.textDescription.title = 'Text Tool'; }

    } else if (selectedToolConfig) { // Handle tools from selectors
        dom.body.classList.add('tool-draw'); appState.currentTool = 'draw'; appState.activeDrawingTool = toolId;
        resetAllTriggersAndDescriptions(toolId);
        let cursor = crosshairCursor; // Default drawing cursor

        switch (selectedToolConfig.category) {
            case 'player':
                updatePlayerTriggerDisplay(toolId);
                cursor = toolCursors[toolId] || crosshairCursor; // Specific player cursor
                break;
            case 'equipment':
                updateEquipmentTriggerDisplay(toolId);
                cursor = crosshairCursor; // Use crosshair for placing equipment
                break;
            case 'movement':
                updateMovementTriggerDisplay(toolId);
                cursor = pointerCursor; // Use pointer for drag-drawing arrows/freehand
                break;
            case 'passShot':
                updatePassShotTriggerDisplay(toolId);
                cursor = pointerCursor; // Use pointer for drag-drawing arrows
                break;
            case 'number':
                updateNumberTriggerDisplay(toolId);
                cursor = crosshairCursor; // Use crosshair for placing numbers
                if (!appState.continuousNumberingActive) {
                    try { const selectedNum = parseInt(selectedToolConfig.text); if (!isNaN(selectedNum)) { appState.nextNumberToPlace = selectedNum; appState.continuousNumberingActive = true; console.log("Started continuous number sequence at:", appState.nextNumberToPlace); } else { appState.continuousNumberingActive = false;} } catch { appState.continuousNumberingActive = false; }
                }
                break;
            default:
                console.warn("Unknown tool category for cursor:", selectedToolConfig.category);
        }
        dom.svgCanvas.style.cursor = cursor;

    } else {
        // Default to select tool
        toolId = 'select'; dom.body.classList.add('tool-select'); appState.currentTool = 'select'; dom.selectToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        // Cursor set by CSS body class for select tool
    }

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool, "nextNumber:", appState.nextNumberToPlace, "continuousNumActive:", appState.continuousNumberingActive);
}
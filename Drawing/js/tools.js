// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { drawingToolMap, SVG_NS } from './config.js';
import { updatePlayerTriggerDisplay } from './playerSelector.js';
import { updateEquipmentTriggerDisplay } from './equipmentSelector.js';
import { updateMovementTriggerDisplay } from './movementSelector.js';
import { updatePassShotTriggerDisplay } from './passShotSelector.js';
import { updateNumberTriggerDisplay } from './numberSelector.js';
import { updateShapeTriggerDisplay } from './shapeSelector.js'; // Added shape display update
import { updateFieldTriggerDisplay } from './fieldSelector.js'; // Keep field display update

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
drawingToolMap.forEach((tool, toolId) => {  toolCursors[toolId] = generateCursorDataUrl( tool.fill === 'none' ? 'white' : tool.fill, tool.stroke, tool.text, tool.textColor ); } );
const crosshairCursor = 'crosshair'; const textCursor = 'text'; const pointerCursor = 'pointer'; // Used for arrows/freehand/lines

/** Sets the active tool and updates UI. */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);
    const previousToolConfig = drawingToolMap.get(appState.activeDrawingTool);

    // Reset previous state
    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate', 'tool-text');
    // Deactivate all action toolbar buttons
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    dom.textToolButton?.classList.remove('active-tool');
    // Deactivate all drawing tool triggers (will be reactivated later if needed)
    document.querySelectorAll('#drawing-toolbar .custom-select-trigger').forEach(btn => btn.classList.remove('active-tool')); // Example reset

    appState.activeDrawingTool = null; // Reset active drawing tool first
    dom.svgCanvas.style.cursor = ''; // Reset cursor

    // Reset continuous numbering if switching AWAY from a number tool
    if (appState.continuousNumberingActive && previousToolConfig?.category === 'number' && toolId !== previousToolConfig.toolId) {
        appState.continuousNumberingActive = false;
        appState.nextNumberToPlace = 0;
        console.log("Reset continuous number sequence.");
    }

    const selectedToolConfig = drawingToolMap.get(toolId);

    // Function to reset all selector trigger displays (except the potentially active one)
    const resetAllTriggersAndDescriptions = (activeToolId = null) => {
        const activeCategory = drawingToolMap.get(activeToolId)?.category;

        if (activeCategory !== 'player') updatePlayerTriggerDisplay(null);
        if (activeCategory !== 'equipment') updateEquipmentTriggerDisplay(null);
        if (activeCategory !== 'movement') updateMovementTriggerDisplay(null);
        if (activeCategory !== 'passShot') updatePassShotTriggerDisplay(null);
        if (activeCategory !== 'shape') updateShapeTriggerDisplay(null); // Reset shapes if not active
        if (activeCategory !== 'number') updateNumberTriggerDisplay(null);

        // Reset text tool description only if text tool is NOT active
        if (activeToolId !== 'text-tool' && dom.textDescription) {
            dom.textDescription.textContent = 'Text';
            dom.textDescription.title = 'Text Tool';
        }
    };

    // Set new state based on toolId
    if (toolId === 'delete') {
        dom.body.classList.add('tool-delete'); appState.currentTool = 'delete'; dom.deleteToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        dom.svgCanvas.style.cursor = crosshairCursor;
    } else if (toolId === 'rotate') {
        dom.body.classList.add('tool-rotate'); appState.currentTool = 'rotate'; dom.rotateToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        // Cursor for rotate is handled by CSS body class + element type
    } else if (toolId === 'text-tool') {
        dom.body.classList.add('tool-text'); appState.currentTool = 'text'; appState.activeDrawingTool = toolId; dom.textToolButton?.classList.add('active-tool'); dom.svgCanvas.style.cursor = textCursor;
        resetAllTriggersAndDescriptions('text-tool'); // Pass ID to prevent resetting its own display
        if (dom.textDescription) { dom.textDescription.textContent = 'Text'; dom.textDescription.title = 'Text Tool'; }
    } else if (selectedToolConfig) { // Handle tools from selectors (Player, Equipment, Movement, Pass/Shot, Shape, Number)
        dom.body.classList.add('tool-draw'); appState.currentTool = 'draw'; appState.activeDrawingTool = toolId;
        resetAllTriggersAndDescriptions(toolId); // Pass ID to prevent resetting its own display

        let cursor = crosshairCursor; // Default drawing cursor

        switch (selectedToolConfig.category) {
            case 'player':
                updatePlayerTriggerDisplay(toolId); // Update specific trigger
               
                dom.customPlayerSelectTrigger?.classList.add('active-tool'); // Highlight trigger
                break;
            case 'equipment':
                updateEquipmentTriggerDisplay(toolId);
                cursor = crosshairCursor;
                dom.customEquipmentSelectTrigger?.classList.add('active-tool');
                break;
            case 'movement':
                updateMovementTriggerDisplay(toolId);
                cursor = pointerCursor; // Drag-drawing cursor
                dom.customMovementSelectTrigger?.classList.add('active-tool');
                break;
            case 'passShot':
                updatePassShotTriggerDisplay(toolId);
                cursor = pointerCursor; // Drag-drawing cursor
                dom.customPassShotSelectTrigger?.classList.add('active-tool');
                break;
            case 'shape': // Added shape handling
                updateShapeTriggerDisplay(toolId);
                if (selectedToolConfig.type === 'line') {
                    cursor = pointerCursor; // Use pointer for drawing lines
                } else {
                    cursor = crosshairCursor; // Use crosshair for placing shapes
                }
                dom.customShapeSelectTrigger?.classList.add('active-tool');
                break;
            case 'number':
                updateNumberTriggerDisplay(toolId);
                cursor = crosshairCursor;
                dom.customNumberSelectTrigger?.classList.add('active-tool');
                // Handle continuous numbering start
                if (!appState.continuousNumberingActive) {
                    try { const selectedNum = parseInt(selectedToolConfig.text); if (!isNaN(selectedNum)) { appState.nextNumberToPlace = selectedNum; appState.continuousNumberingActive = true; console.log("Started continuous number sequence at:", appState.nextNumberToPlace); } else { appState.continuousNumberingActive = false;} } catch { appState.continuousNumberingActive = false; }
                }
                break;
            default:
                console.warn("Unknown tool category:", selectedToolConfig.category);
        }
        cursor = toolCursors[toolId] || crosshairCursor;
        dom.svgCanvas.style.cursor = cursor;

    } else {
        // Default to select tool if toolId is unknown or null
        toolId = 'select';
        dom.body.classList.add('tool-select'); appState.currentTool = 'select'; dom.selectToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        // Cursor set by CSS body class for select tool
    }

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool);
}
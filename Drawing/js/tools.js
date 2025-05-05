//***** js/tools.js ******




// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { drawingToolMap, SVG_NS, NUMBER_TOOL_ID } from './config.js'; // Added NUMBER_TOOL_ID
import { updatePlayerTriggerDisplay } from './playerSelector.js';
import { updateEquipmentTriggerDisplay } from './equipmentSelector.js';
import { updateMovementTriggerDisplay } from './movementSelector.js';
import { updatePassShotTriggerDisplay } from './passShotSelector.js';
// Removed number trigger update
import { updateShapeTriggerDisplay } from './shapeSelector.js';
import { updateFieldTriggerDisplay } from './fieldSelector.js'; // Keep field display update

// --- Generate Cursors ---
// This function will now be used dynamically for the number tool as well
function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') {
    const radius = 10; // Slightly larger cursor for better visibility of number
    const diameter = radius * 2;
    let textElement = '';
    // Show the actual text (number) in the cursor
    if (text) {
        // Adjust font size based on number of digits for better fit
        const numDigits = String(text).length;
        let fontSize = 12; // Default font size
        if (numDigits === 2) fontSize = 10;
        else if (numDigits >= 3) fontSize = 8;

        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="bold" style="pointer-events:none;">${text}</text>`;
    }
    const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`;
    return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`;
}

// Generate static cursors for other tools
export const toolCursors = {};
drawingToolMap.forEach((tool, toolId) => {
    // Skip number tool for static generation
    if (toolId !== NUMBER_TOOL_ID) {
        toolCursors[toolId] = generateCursorDataUrl( tool.fill === 'none' ? 'white' : tool.fill, tool.stroke, tool.text, tool.textColor );
    }
});
const crosshairCursor = 'crosshair'; const textCursor = 'text'; const pointerCursor = 'pointer'; // Used for arrows/freehand/lines


/** Updates the number tool button description */
export function updateNumberToolDisplay() {
    if(dom.numberDescription) {
        dom.numberDescription.textContent = `Next: ${appState.nextNumberToPlace}`;
        dom.numberDescription.title = `Next number in sequence: ${appState.nextNumberToPlace}`;
    }
}

/** Updates the cursor specifically for the number tool */
export function updateNumberCursor() {
    if (appState.activeDrawingTool === NUMBER_TOOL_ID) {
        const toolConfig = drawingToolMap.get(NUMBER_TOOL_ID);
        const nextNumStr = String(appState.nextNumberToPlace);
        dom.svgCanvas.style.cursor = generateCursorDataUrl(
            toolConfig.fill, // Use base color from config
            'black',       // Standard stroke
            nextNumStr,    // The next number
            'white'        // Standard text color
        );
    }
    // No else needed, setActiveTool handles resetting cursor for other tools
}

/** Toggles visibility between Number Tool button and Reset button */
export function toggleNumberButtonsVisibility(showResetButton) {
    if (dom.numberToolButton && dom.resetNumberButton) {
        dom.numberToolButton.style.display = showResetButton ? 'none' : 'flex';
        dom.resetNumberButton.style.display = showResetButton ? 'flex' : 'none';
    } else {
        console.error("Number tool button or Reset button not found in DOM");
    }
}


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
    // Deactivate all drawing tool triggers/buttons
    document.querySelectorAll('#drawing-toolbar .custom-select-trigger, #drawing-toolbar .tool-item').forEach(btn => btn.classList.remove('active-tool'));

    appState.activeDrawingTool = null; // Reset active drawing tool first
    dom.svgCanvas.style.cursor = ''; // Reset cursor

    const selectedToolConfig = drawingToolMap.get(toolId);

    // Function to reset all selector trigger displays AND descriptions (except the potentially active one)
    const resetAllTriggersAndDescriptions = (activeToolId = null) => {
        const activeCategory = drawingToolMap.get(activeToolId)?.category;

        if (activeCategory !== 'player') updatePlayerTriggerDisplay(null);
        if (activeCategory !== 'equipment') updateEquipmentTriggerDisplay(null);
        if (activeCategory !== 'movement') updateMovementTriggerDisplay(null);
        if (activeCategory !== 'passShot') updatePassShotTriggerDisplay(null);
        if (activeCategory !== 'shape') updateShapeTriggerDisplay(null); // Reset shapes if not active
        // No number trigger to reset

        // Reset descriptions for simple buttons if not active
        if (activeToolId !== NUMBER_TOOL_ID && dom.numberDescription) {
            dom.numberDescription.textContent = 'Number';
            dom.numberDescription.title = 'Number Tool (Sequence)';
        }
        if (activeToolId !== 'text-tool' && dom.textDescription) {
            dom.textDescription.textContent = 'Text';
            dom.textDescription.title = 'Text Tool';
        }
    };

    // Default: Hide Reset button, show Number button
    // This will be overridden if the number tool is selected
    toggleNumberButtonsVisibility(false);

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
    } else if (toolId === NUMBER_TOOL_ID) { // Check for the specific Number Tool ID
        dom.body.classList.add('tool-draw'); appState.currentTool = 'draw'; appState.activeDrawingTool = toolId;
        // No need to add active-tool class here, handled by the visibility swap
        resetAllTriggersAndDescriptions(NUMBER_TOOL_ID);
        updateNumberToolDisplay(); // Update description on activation
        updateNumberCursor();      // Update cursor on activation
        toggleNumberButtonsVisibility(true); // Show Reset, hide Number tool button
    } else if (selectedToolConfig) { // Handle tools from selectors (Player, Equipment, Movement, Pass/Shot, Shape)
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
            case 'shape':
                updateShapeTriggerDisplay(toolId);
                if (selectedToolConfig.type === 'line') {
                    cursor = pointerCursor; // Use pointer for drawing lines
                } else {
                    cursor = crosshairCursor; // Use crosshair for placing shapes
                }
                dom.customShapeSelectTrigger?.classList.add('active-tool');
                break;
            // Number category handled above by specific ID check
            default:
                console.warn("Unknown tool category:", selectedToolConfig.category);
        }
        // Use static cursor if defined, otherwise default
        cursor = toolCursors[toolId] || cursor;
        dom.svgCanvas.style.cursor = cursor;

    } else {
        // Default to select tool if toolId is unknown or null
        toolId = 'select';
        dom.body.classList.add('tool-select'); appState.currentTool = 'select'; dom.selectToolButton?.classList.add('active-tool'); resetAllTriggersAndDescriptions();
        // Cursor set by CSS body class for select tool
    }

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool);
}
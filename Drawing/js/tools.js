//***** js/tools.js ******
// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import {drawingToolMap, SVG_NS, NUMBER_TOOL_ID, TEXT_TOOL_ID, AVAILABLE_FONTS, DEFAULT_PLAYER_TOOL_ID} from './config.js';

// Import new player selector update functions
import { updateTeamAPlayerTriggerDisplay } from './teamAPlayerSelector.js';
import { updateTeamBPlayerTriggerDisplay } from './teamBPlayerSelector.js';
import { updateOtherPlayerTriggerDisplay } from './otherPlayerSelector.js';

import { updateEquipmentTriggerDisplay } from './equipmentSelector.js';
import { updateMovementTriggerDisplay } from './movementSelector.js';
import { updatePassShotTriggerDisplay } from './passShotSelector.js';
import { updateShapeTriggerDisplay } from './shapeSelector.js';
// updateFieldTriggerDisplay is not needed here as field is not a "tool"

// --- Generate Cursors ---
function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') {
    const radius = 10;
    const diameter = radius * 2;
    let textElement = '';
    if (text) {
        const numDigits = String(text).length;
        let fontSize = 12;
        if (numDigits === 2) fontSize = 10;
        else if (numDigits >= 3) fontSize = 8;
        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="bold" style="pointer-events:none;">${text}</text>`;
    }
    const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`;
    return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`;
}

export const toolCursors = {};
drawingToolMap.forEach((tool, toolId) => {
    if (toolId !== NUMBER_TOOL_ID) { // Exclude number tool from static generation
        if (tool.category === 'player' || tool.category === 'equipment') { // Only generate for these placeable items initially
            toolCursors[toolId] = generateCursorDataUrl( tool.fill === 'none' ? 'white' : tool.fill, tool.stroke, tool.text, tool.textColor );
        }
    }
});
const crosshairCursor = 'crosshair'; const textCursor = 'text'; const pointerCursor = 'pointer';

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
            toolConfig.fill,
            'black',
            nextNumStr,
            'white'
        );
    }
}

/** Toggles visibility between Number Tool button and Reset button, and description clickability */
export function toggleNumberButtonsVisibility(showResetButton) {
    if (dom.numberToolButton && dom.resetNumberButton && dom.numberDescription) {
        dom.numberToolButton.style.display = showResetButton ? 'none' : 'flex';
        dom.resetNumberButton.style.display = showResetButton ? 'flex' : 'none';
        if (showResetButton) {
            dom.numberDescription.classList.add('clickable');
            dom.numberDescription.title = `Click to set next number (currently ${appState.nextNumberToPlace})`;
        } else {
            dom.numberDescription.classList.remove('clickable');
            dom.numberDescription.title = 'Number Tool (Sequence)';
        }
    } else {
        console.error("Number tool button, Reset button, or description not found in DOM");
    }
}


/** Sets the active tool and updates UI. */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);

    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate', 'tool-text');
    if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'none';

    // Deactivate all action toolbar buttons
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    dom.textToolButton?.classList.remove('active-tool');
    // Deactivate all drawing tool triggers/buttons
    document.querySelectorAll('#drawing-toolbar .custom-select-trigger, #drawing-toolbar .tool-item').forEach(btn => btn.classList.remove('active-tool'));

    appState.activeDrawingTool = null;
    dom.svgCanvas.style.cursor = '';

    const selectedToolConfig = drawingToolMap.get(toolId);

    // Function to reset all selector trigger displays AND descriptions
    const resetAllTriggersAndDescriptions = (activeToolId = null) => {
        const activeTool = drawingToolMap.get(activeToolId);
        const currentActivePlayerCat = activeTool?.playerCategory; // e.g., 'teamA', 'teamB', 'other'
        const currentActiveCategory = activeTool?.category; // e.g., 'player', 'equipment'

        // Reset player selectors
        if (currentActivePlayerCat !== 'teamA') updateTeamAPlayerTriggerDisplay(null);
        if (currentActivePlayerCat !== 'teamB') updateTeamBPlayerTriggerDisplay(null);
        // For 'other' players, if the active tool is an 'other' player, don't reset its display.
        // If the active tool is NOT an 'other' player (or not a player at all), reset to default 'other' player.
        if (currentActivePlayerCat !== 'other') updateOtherPlayerTriggerDisplay(DEFAULT_PLAYER_TOOL_ID);


        // Reset other category selectors
        if (currentActiveCategory !== 'equipment') updateEquipmentTriggerDisplay(null);
        if (currentActiveCategory !== 'movement') updateMovementTriggerDisplay(null);
        if (currentActiveCategory !== 'passShot') updatePassShotTriggerDisplay(null);
        if (currentActiveCategory !== 'shape') updateShapeTriggerDisplay(null);

        // Reset simple button descriptions
        if (activeToolId !== NUMBER_TOOL_ID && dom.numberDescription) {
            dom.numberDescription.textContent = 'Number';
            dom.numberDescription.title = 'Number Tool (Sequence)';
            dom.numberDescription.classList.remove('clickable');
        }
        if (activeToolId !== TEXT_TOOL_ID && dom.textDescription) {
            dom.textDescription.textContent = 'Text';
            dom.textDescription.title = 'Text Tool';
        }
    };

    toggleNumberButtonsVisibility(false); // Default: hide reset, show number tool button

    if (toolId === 'delete') {
        dom.body.classList.add('tool-delete');
        appState.currentTool = 'delete';
        dom.deleteToolButton?.classList.add('active-tool');
        resetAllTriggersAndDescriptions();
        dom.svgCanvas.style.cursor = crosshairCursor;
    } else if (toolId === 'rotate') {
        dom.body.classList.add('tool-rotate');
        appState.currentTool = 'rotate';
        dom.rotateToolButton?.classList.add('active-tool');
        resetAllTriggersAndDescriptions();
        // Rotate cursor is handled by CSS body class + element type
    } else if (toolId === TEXT_TOOL_ID) {
        dom.body.classList.add('tool-text');
        appState.currentTool = 'text';
        appState.activeDrawingTool = toolId;
        dom.textToolButton?.classList.add('active-tool');
        dom.svgCanvas.style.cursor = textCursor;
        resetAllTriggersAndDescriptions(TEXT_TOOL_ID);
        if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'flex';
        updateTextPropertyControls();
    } else if (toolId === NUMBER_TOOL_ID) {
        dom.body.classList.add('tool-draw');
        appState.currentTool = 'draw';
        appState.activeDrawingTool = toolId;
        resetAllTriggersAndDescriptions(NUMBER_TOOL_ID);
        updateNumberToolDisplay();
        updateNumberCursor();
        toggleNumberButtonsVisibility(true); // Show Reset button
    } else if (selectedToolConfig) { // Handle tools from selectors
        dom.body.classList.add('tool-draw');
        appState.currentTool = 'draw';
        appState.activeDrawingTool = toolId;
        resetAllTriggersAndDescriptions(toolId); // Reset others, keep this one if its category matches

        let cursor = crosshairCursor; // Default drawing cursor

        switch (selectedToolConfig.category) {
            case 'player':
                // Update the specific player category trigger and highlight it
                if (selectedToolConfig.playerCategory === 'teamA') {
                    updateTeamAPlayerTriggerDisplay(toolId);
                    dom.customTeamAPlayerSelectTrigger?.classList.add('active-tool');
                } else if (selectedToolConfig.playerCategory === 'teamB') {
                    updateTeamBPlayerTriggerDisplay(toolId);
                    dom.customTeamBPlayerSelectTrigger?.classList.add('active-tool');
                } else if (selectedToolConfig.playerCategory === 'other') {
                    updateOtherPlayerTriggerDisplay(toolId);
                    dom.customOtherPlayerSelectTrigger?.classList.add('active-tool');
                }
                cursor = toolCursors[toolId] || crosshairCursor; // Player tools have specific cursors
                break;
            case 'equipment':
                updateEquipmentTriggerDisplay(toolId);
                dom.customEquipmentSelectTrigger?.classList.add('active-tool');
                cursor = toolCursors[toolId] || crosshairCursor;
                break;
            case 'movement':
                updateMovementTriggerDisplay(toolId);
                dom.customMovementSelectTrigger?.classList.add('active-tool');
                cursor = pointerCursor; // Drag-drawing cursor for arrows/lines
                break;
            case 'passShot':
                updatePassShotTriggerDisplay(toolId);
                dom.customPassShotSelectTrigger?.classList.add('active-tool');
                cursor = pointerCursor; // Drag-drawing cursor
                break;
            case 'shape':
                updateShapeTriggerDisplay(toolId);
                dom.customShapeSelectTrigger?.classList.add('active-tool');
                if (selectedToolConfig.type === 'line') {
                    cursor = pointerCursor;
                } else {
                    cursor = crosshairCursor;
                }
                break;
            default:
                console.warn("Unknown tool category for drawing:", selectedToolConfig.category);
        }
        dom.svgCanvas.style.cursor = cursor;

    } else { // Default to select tool
        toolId = 'select';
        dom.body.classList.add('tool-select');
        appState.currentTool = 'select';
        dom.selectToolButton?.classList.add('active-tool');
        resetAllTriggersAndDescriptions(); // Reset all drawing tool displays
        // Cursor set by CSS body class for select tool
        // If elements are selected, check if text properties should be shown
        if (appState.selectedElements.size === 1) {
            const selectedEl = appState.selectedElements.values().next().value;
            if (selectedEl.dataset.elementType === 'text') {
                if (dom.textPropertiesToolbar) dom.textPropertiesToolbar.style.display = 'flex';
                updateTextPropertyControls(selectedEl);
            }
        }
    }
    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool);
}

export function initTextPropertyControls() {
    if (dom.fontFamilySelect) {
        AVAILABLE_FONTS.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font.split(',')[0];
            dom.fontFamilySelect.appendChild(option);
        });
        dom.fontFamilySelect.value = appState.currentFontFamily;
    }
    if (dom.fontSizeInput) {
        dom.fontSizeInput.value = String(appState.currentFontSize);
    }
    if (dom.fontBoldButton) {
        dom.fontBoldButton.classList.toggle('active', appState.currentFontWeight === 'bold');
    }
    if (dom.fontItalicButton) {
        dom.fontItalicButton.classList.toggle('active', appState.currentFontStyle === 'italic');
    }
}

export function updateTextPropertyControls(selectedElement = null) {
    if (!dom.textPropertiesToolbar) return;
    let fontFamily, fontSize, fontWeight, fontStyle;
    if (selectedElement && selectedElement.dataset.elementType === 'text') {
        fontFamily = selectedElement.dataset.fontFamily || appState.currentFontFamily;
        fontSize = parseInt(selectedElement.dataset.fontSize, 10) || appState.currentFontSize;
        fontWeight = selectedElement.dataset.fontWeight || appState.currentFontWeight;
        fontStyle = selectedElement.dataset.fontStyle || appState.currentFontStyle;
    } else {
        fontFamily = appState.currentFontFamily;
        fontSize = appState.currentFontSize;
        fontWeight = appState.currentFontWeight;
        fontStyle = appState.currentFontStyle;
    }
    if (dom.fontFamilySelect) dom.fontFamilySelect.value = fontFamily;
    if (dom.fontSizeInput) dom.fontSizeInput.value = String(fontSize);
    if (dom.fontBoldButton) dom.fontBoldButton.classList.toggle('active', fontWeight === 'bold');
    if (dom.fontItalicButton) dom.fontItalicButton.classList.toggle('active', fontStyle === 'italic');
}
// js/tools.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { playerToolMap, SVG_NS } from './config.js';
import { updateSelectedPlayerIcon } from './playerSelector.js';
// import { clearSelection } from './selection.js'; // Potentially needed if tool change clears selection

// --- Generate Cursors --- (Moved here as it's tool-related)
function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') {
    const radius = 8; // Small radius for cursor version
    const diameter = radius * 2;
    let textElement = '';
    if (text) {
        // Use smaller font size for cursor
        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="9" font-weight="bold" style="pointer-events:none;">${text}</text>`;
    }
    const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`;
    // Base64 encode the SVG and format as data URL
    return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`; // Center hotspot
}

// Generate cursors on module load
export const toolCursors = {};
playerToolMap.forEach((tool, toolId) => {
    toolCursors[toolId] = generateCursorDataUrl(
        tool.fill === 'none' ? 'white' : tool.fill,
        tool.stroke,
        tool.text,
        tool.textColor
    );
});

/** Sets the active tool and updates UI (body class, button styles, cursor). */
export function setActiveTool(toolId) {
    console.log("setActiveTool:", toolId);

    // Reset previous state
    dom.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate');
    dom.selectToolButton?.classList.remove('active-tool');
    dom.rotateToolButton?.classList.remove('active-tool');
    dom.deleteToolButton?.classList.remove('active-tool');
    appState.activeDrawingTool = null; // Reset drawing tool selection
    dom.svgCanvas.style.cursor = ''; // Reset cursor (will be set by body class or specific tool)

    // Set new state based on toolId
    if (toolId === 'delete') {
        dom.body.classList.add('tool-delete');
        appState.currentTool = 'delete';
        dom.deleteToolButton?.classList.add('active-tool');
    } else if (toolId === 'rotate') {
        dom.body.classList.add('tool-rotate');
        appState.currentTool = 'rotate';
        dom.rotateToolButton?.classList.add('active-tool');
    } else if (playerToolMap.has(toolId)) {
        dom.body.classList.add('tool-draw');
        appState.currentTool = 'draw';
        appState.activeDrawingTool = toolId;
        // Sync dropdown and update icon (handled by playerSelector module now)
        if (dom.playerSelect && dom.playerSelect.value !== toolId) {
            dom.playerSelect.value = toolId;
        }
        updateSelectedPlayerIcon(toolId);
        // Set specific drawing cursor
        dom.svgCanvas.style.cursor = toolCursors[toolId] || 'crosshair';
    } else {
        // Default to select tool if unknown or 'select' is passed
        toolId = 'select';
        dom.body.classList.add('tool-select');
        appState.currentTool = 'select';
        dom.selectToolButton?.classList.add('active-tool');
    }

    console.log(" New state -> currentTool:", appState.currentTool, "activeDrawingTool:", appState.activeDrawingTool);

    // Decide if changing tool should clear selection (optional)
    // if (appState.currentTool !== 'select') {
    //    clearSelection();
    // }
}
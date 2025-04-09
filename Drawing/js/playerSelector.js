// js/playerSelector.js
import {dom} from './dom.js';
import {DEFAULT_PLAYER_TOOL_ID, PLAYER_RADIUS, playerToolMap, playerTools} from './config.js';
import {setActiveTool} from './tools.js'; // To link select change to tool change

/** Populates the player select dropdown */
export function populatePlayerSelector() {
    if (!dom.playerSelect) return;
    dom.playerSelect.innerHTML = ''; // Clear existing options
    playerTools.forEach(tool => {
        const option = document.createElement('option');
        option.value = tool.toolId;
        option.textContent = tool.label; // Text for the option
        option.title = tool.label;     // Tooltip for the option
        if (tool.toolId === DEFAULT_PLAYER_TOOL_ID) {
            option.selected = true; // Set default selection
        }
        dom.playerSelect.appendChild(option);
    });
}

/** Updates the icon display next to the player select dropdown */
export function updateSelectedPlayerIcon(toolId) {
    const tool = playerToolMap.get(toolId);
    if (tool && dom.selectedPlayerIcon) {
        const radius = PLAYER_RADIUS - 1; // Use slightly smaller radius for the icon?
        let textElement = '';
        if (tool.text) {
            textElement = `<text x="15" y="15" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" fill="${tool.textColor}" font-size="10" font-weight="bold" style="pointer-events: none;">${tool.text}</text>`;
        }
        // Create SVG markup matching the tool's appearance
        dom.selectedPlayerIcon.innerHTML = `
            <svg viewBox="0 0 30 30" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                <circle cx="15" cy="15" r="${radius}" fill="${tool.fill === 'none' ? 'white' : tool.fill}" stroke="${tool.stroke}" stroke-width="1"/>
                ${textElement}
            </svg>`;
        dom.selectedPlayerIcon.title = `Current: ${tool.label}`; // Update tooltip for the icon display

    } else if (dom.selectedPlayerIcon) {
        dom.selectedPlayerIcon.innerHTML = ''; // Clear icon if tool not found
        dom.selectedPlayerIcon.title = `Current Player Tool`;
    }
}

/** Initializes the player selector event listener */
export function initPlayerSelector() {
    if (dom.playerSelect) {
        dom.playerSelect.addEventListener('change', (event) => {
            const selectedToolId = event.target.value;
            setActiveTool(selectedToolId); // Set the selected player as the active drawing tool
        });
    }
    // Set initial icon based on default value
    updateSelectedPlayerIcon(DEFAULT_PLAYER_TOOL_ID);
}
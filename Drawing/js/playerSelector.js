// js/playerSelector.js
import { dom } from './dom.js';
// Import the consolidated tools and map, and the default ID
import { DEFAULT_PLAYER_TOOL_ID, drawingTools, drawingToolMap } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;

/** Helper function to generate the small SVG icon markup for players */
function generatePlayerIconSvg(tool, width = 20, height = 20) {
    // Ensure we only process player tools
    if (!tool || tool.category !== 'player') return '';
    const radius = Math.min(width, height) / 2;
    let textElement = '';
    if (tool.text) {
        const fontSize = Math.max(6, Math.min(10, radius * 0.8));
        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" fill="${tool.textColor}" font-size="${fontSize}" font-weight="bold" style="pointer-events: none;">${tool.text}</text>`;
    }
    return `
        <svg viewBox="0 0 ${radius * 2} ${radius * 2}" width="${width}" height="${height}" aria-hidden="true" focusable="false">
            <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${tool.fill === 'none' ? 'white' : tool.fill}" stroke="${tool.stroke}" stroke-width="1"/>
            ${textElement}
        </svg>`;
}

/** Updates the content of the player trigger button */
export function updatePlayerTriggerDisplay(toolId) {
    // Use the consolidated drawingToolMap
    const tool = drawingToolMap.get(toolId);
    if (dom.customPlayerSelectTrigger) {
        // Check if the tool exists and is a player
        if (tool && tool.category === 'player') {
            const iconSvg = generatePlayerIconSvg(tool);
            dom.customPlayerSelectTrigger.innerHTML = `
                <span class="player-option-icon">${iconSvg}</span>
                <span>${tool.label}</span>
            `;
            dom.customPlayerSelectTrigger.dataset.value = toolId;
        } else {
            // Reset if no tool or wrong category
            dom.customPlayerSelectTrigger.innerHTML = `<span>Select Player...</span>`;
            dom.customPlayerSelectTrigger.dataset.value = '';
        }
    }
}

/** Toggles the visibility of the custom player dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customPlayerSelectOptions || !dom.customPlayerSelectTrigger) return;

    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;

    if (shouldBeOpen) {
        dom.customPlayerSelectOptions.classList.add('open');
        dom.customPlayerSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customPlayerSelectOptions.classList.remove('open');
        dom.customPlayerSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom player select dropdown list (ul) */
export function populateCustomPlayerSelector() {
    if (!dom.playerOptionsList) {
        console.error("Custom player options list not found!");
        return;
    }
    dom.playerOptionsList.innerHTML = ''; // Clear existing options

    // Iterate over the consolidated drawingTools array
    drawingTools.forEach(tool => {
        // Filter: Only add tools with category 'player'
        if (tool.category !== 'player') return;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;

        const iconSvg = generatePlayerIconSvg(tool);
        li.innerHTML = `
            <span class="player-option-icon">${iconSvg}</span>
            <span>${tool.label}</span>
        `;

        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updatePlayerTriggerDisplay(selectedToolId); // Update the button appearance
                setActiveTool(selectedToolId);       // Set the tool in the app state
                toggleDropdown(false);               // Close the dropdown
            }
            e.stopPropagation(); // Prevent body click listener from firing
        });

        dom.playerOptionsList.appendChild(li);
    });

    // Set initial trigger display based on default (check if it's a player tool)
    const defaultTool = drawingToolMap.get(DEFAULT_PLAYER_TOOL_ID);
    if (defaultTool?.category === 'player') {
        updatePlayerTriggerDisplay(DEFAULT_PLAYER_TOOL_ID);
    } else {
        updatePlayerTriggerDisplay(null); // Reset if default isn't a player
    }
}

/** Initializes event listeners for the custom player dropdown */
export function initCustomPlayerSelector() {
    // Listener for the trigger button
    dom.customPlayerSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation(); // Prevent body click listener from firing
    });

    // Listener to close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.playerToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Optional: Add keyboard support (basic example)
    dom.customPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
        } else if (e.key === 'Escape' && isDropdownOpen) {
            toggleDropdown(false);
        }
    });
}
// js/playerSelector.js
import { dom } from './dom.js';
import { DEFAULT_PLAYER_TOOL_ID, playerToolMap, playerTools, PLAYER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js'; // To link select change to tool change

let isDropdownOpen = false;

/** Helper function to generate the small SVG icon markup */
function generateSmallIconSvg(tool, width = 20, height = 20) {
    if (!tool) return '';
    const radius = Math.min(width, height) / 2; // Base radius on size
    let textElement = '';
    if (tool.text) {
        // Adjust font size based on radius slightly
        const fontSize = Math.max(6, Math.min(10, radius * 0.8));
        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" fill="${tool.textColor}" font-size="${fontSize}" font-weight="bold" style="pointer-events: none;">${tool.text}</text>`;
    }
    return `
        <svg viewBox="0 0 ${radius * 2} ${radius * 2}" width="${width}" height="${height}" aria-hidden="true" focusable="false">
            <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${tool.fill === 'none' ? 'white' : tool.fill}" stroke="${tool.stroke}" stroke-width="1"/>
            ${textElement}
        </svg>`;
}

/** Updates the content of the trigger button */
function updateTriggerDisplay(toolId) {
    const tool = playerToolMap.get(toolId);
    if (tool && dom.customPlayerSelectTrigger) {
        const iconSvg = generateSmallIconSvg(tool);
        dom.customPlayerSelectTrigger.innerHTML = `
            <span class="player-option-icon">${iconSvg}</span>
            <span>${tool.label}</span>
        `;
        dom.customPlayerSelectTrigger.dataset.value = toolId; // Store current value
    } else if (dom.customPlayerSelectTrigger) {
        // Fallback if tool not found
        dom.customPlayerSelectTrigger.innerHTML = `<span>Select Player...</span>`;
        dom.customPlayerSelectTrigger.dataset.value = '';
    }
}

/** Toggles the visibility of the custom dropdown options */
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

    playerTools.forEach(tool => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;

        const iconSvg = generateSmallIconSvg(tool);
        li.innerHTML = `
            <span class="player-option-icon">${iconSvg}</span>
            <span>${tool.label}</span>
        `;

        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updateTriggerDisplay(selectedToolId); // Update the button appearance
                setActiveTool(selectedToolId);       // Set the tool in the app state (THIS SETS THE CURSOR)
                toggleDropdown(false);               // *** CLOSE the dropdown ***
            }
            e.stopPropagation(); // Prevent body click listener from firing
        });

        dom.playerOptionsList.appendChild(li);
    });

    // Set initial trigger display based on default
    updateTriggerDisplay(DEFAULT_PLAYER_TOOL_ID);
}

/** Initializes event listeners for the custom dropdown */
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
    // More complex keyboard nav for options would go here (focus management, up/down arrows)
}
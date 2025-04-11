// js/playerSelector.js
import { dom } from './dom.js';
import { DEFAULT_PLAYER_TOOL_ID, drawingTools, drawingToolMap, PLAYER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 30; // Define icon size
const ICON_HEIGHT = 30;

/** Helper function to generate the small SVG icon markup for players */
function generatePlayerIconSvg(tool, width = ICON_WIDTH, height = ICON_HEIGHT) {
    if (!tool || tool.category !== 'player') return '';
    const radius = Math.min(width, height) / 2;
    let textElement = '';
    if (tool.text) {
        // Adjust font size based on new icon size
        const fontSize = Math.max(8, Math.min(12, radius * 0.7));
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
    const tool = drawingToolMap.get(toolId);
    if (dom.customPlayerSelectTrigger) {
        if (tool && tool.category === 'player') {
            const iconSvg = generatePlayerIconSvg(tool);
            // Set innerHTML to only the icon span
            dom.customPlayerSelectTrigger.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
            // Set the title attribute for tooltip
            dom.customPlayerSelectTrigger.title = tool.label;
            dom.customPlayerSelectTrigger.dataset.value = toolId;
        } else {
            // Reset with a placeholder if needed, or leave blank
            dom.customPlayerSelectTrigger.innerHTML = `<span class="player-option-icon"></span>`; // Placeholder
            dom.customPlayerSelectTrigger.title = 'Select Player Tool';
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
    dom.playerOptionsList.innerHTML = '';

    drawingTools.forEach(tool => {
        if (tool.category !== 'player') return;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        // Set title for tooltip
        li.title = tool.label;
        const iconSvg = generatePlayerIconSvg(tool);
        // Set innerHTML to only the icon span
        li.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updatePlayerTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.playerOptionsList.appendChild(li);
    });

    const defaultTool = drawingToolMap.get(DEFAULT_PLAYER_TOOL_ID);
    if (defaultTool?.category === 'player') {
        updatePlayerTriggerDisplay(DEFAULT_PLAYER_TOOL_ID);
    } else {
        updatePlayerTriggerDisplay(null);
    }
}

/** Initializes event listeners for the custom player dropdown */
export function initCustomPlayerSelector() {
    dom.customPlayerSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.playerToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}
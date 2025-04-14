// js/playerSelector.js
import { dom } from './dom.js';
import { DEFAULT_PLAYER_TOOL_ID, drawingTools, drawingToolMap, PLAYER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
// Define NEW icon size constants based on CSS
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;


/** Helper function to generate the SVG icon markup for players */
function generatePlayerIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) { // Default to list item size
    if (!tool || tool.category !== 'player') return '';
    const radius = Math.min(width, height) / 2;
    let textElement = '';
    if (tool.text) {
        const fontSize = Math.max(10, Math.min(16, radius * 0.7)); // Larger font for larger icon
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
            // Use larger size for the trigger button display
            const iconSvg = generatePlayerIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            dom.customPlayerSelectTrigger.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
            dom.customPlayerSelectTrigger.title = tool.label;
            dom.customPlayerSelectTrigger.dataset.value = toolId;
        } else {
            // Show first player icon as default if no tool selected
            const firstPlayerTool = drawingTools.find(t => t.category === 'player');
            if (firstPlayerTool) {
                const iconSvg = generatePlayerIconSvg(firstPlayerTool, ICON_WIDTH, ICON_HEIGHT);
                dom.customPlayerSelectTrigger.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
                dom.customPlayerSelectTrigger.title = firstPlayerTool.label; // Default tooltip
                dom.customPlayerSelectTrigger.dataset.value = firstPlayerTool.toolId; // Store default value
            } else {
                dom.customPlayerSelectTrigger.innerHTML = `<span class="player-option-icon">?</span>`; // Fallback
                dom.customPlayerSelectTrigger.title = 'Select Player Tool';
                dom.customPlayerSelectTrigger.dataset.value = '';
            }
        }
    }
}

/** Toggles the visibility of the custom player dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customPlayerSelectOptions || !dom.customPlayerSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return; // No change needed

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
    let firstPlayerToolId = null; // Track the first player tool

    drawingTools.forEach(tool => {
        if (tool.category !== 'player') return;
        if (firstPlayerToolId === null) firstPlayerToolId = tool.toolId; // Store the first one found

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label; // Tooltip for list item
        const iconSvg = generatePlayerIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Generate structure with text below icon
        li.innerHTML = `
            <span class="player-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updatePlayerTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                // Close handled by mouseleave
            }
            e.stopPropagation();
        });
        dom.playerOptionsList.appendChild(li);
    });

    // Set initial trigger display to the first player tool found
    updatePlayerTriggerDisplay(firstPlayerToolId);
}

/** Initializes event listeners for the custom player dropdown */
export function initCustomPlayerSelector() {
    const container = dom.playerToolSelector;
    if (!container) return;

    container.addEventListener('mouseenter', () => toggleDropdown(true));
    container.addEventListener('mouseleave', () => toggleDropdown(false));

    dom.customPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}
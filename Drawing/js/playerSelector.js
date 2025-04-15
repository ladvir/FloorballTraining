// js/playerSelector.js
import { dom } from './dom.js';
import { DEFAULT_PLAYER_TOOL_ID, drawingTools, drawingToolMap, PLAYER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for players */
function generatePlayerIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    // **** DEBUG ****
    console.log("DEBUG: generatePlayerIconSvg called with tool:", tool);
    // **** END DEBUG ****

    if (!tool || tool.category !== 'player') {
        console.log("DEBUG: generatePlayerIconSvg returning empty (invalid tool or category)"); // DEBUG
        return '';
    }
    const radius = Math.min(width, height) / 2;
    let textElement = '';
    if (tool.text) {
        const fontSize = Math.max(10, Math.min(16, radius * 0.7));
        textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" fill="${tool.textColor}" font-size="${fontSize}" font-weight="bold" style="pointer-events: none;">${tool.text}</text>`;
    }
    const svgString = `
        <svg viewBox="0 0 ${radius * 2} ${radius * 2}" width="${width}" height="${height}" aria-hidden="true" focusable="false">
            <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${tool.fill === 'none' ? 'white' : tool.fill}" stroke="${tool.stroke}" stroke-width="1"/>
            ${textElement}
        </svg>`;

    // **** DEBUG ****
    console.log("DEBUG: generatePlayerIconSvg generated SVG:", svgString.substring(0, 100) + "..."); // Log start of SVG
    // **** END DEBUG ****
    return svgString;
}

/** Updates the content of the player trigger button AND description */
export function updatePlayerTriggerDisplay(toolId) {
    // **** DEBUG ****
    console.log(`DEBUG: updatePlayerTriggerDisplay called with toolId: ${toolId}`);
    // **** END DEBUG ****

    const tool = drawingToolMap.get(toolId);
    // **** DEBUG ****
    console.log(`DEBUG: updatePlayerTriggerDisplay found tool from map:`, tool);
    // **** END DEBUG ****

    const triggerButton = dom.customPlayerSelectTrigger;
    const descriptionSpan = dom.playerDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'player') {
            const iconSvg = generatePlayerIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            console.log(`DEBUG: updatePlayerTriggerDisplay - Tool ID '${toolId}' not found or not a player. Setting default.`); // DEBUG
            const firstPlayerTool = drawingTools.find(t => t.category === 'player');
            if (firstPlayerTool) {
                const iconSvg = generatePlayerIconSvg(firstPlayerTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstPlayerTool.label;
                triggerButton.dataset.value = firstPlayerTool.toolId;
                descriptionSpan.textContent = firstPlayerTool.label;
                descriptionSpan.title = firstPlayerTool.label;
            } else {
                triggerButton.innerHTML = `<span class="player-option-icon">?</span>`;
                triggerButton.title = 'Select Player Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'N/A';
                descriptionSpan.title = '';
            }
        }
    } else {
        console.error("DEBUG: Trigger button or description span not found in updatePlayerTriggerDisplay"); // DEBUG
    }
}

/** Toggles the visibility of the custom player dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customPlayerSelectOptions || !dom.customPlayerSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

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
    let firstPlayerToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'player') return;
        if (firstPlayerToolId === null) firstPlayerToolId = tool.toolId;

        // **** DEBUG ****
        console.log(`DEBUG: Populating player option for: ${tool.label} (ID: ${tool.toolId})`, tool);
        // **** END DEBUG ****

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generatePlayerIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="player-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
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

    // **** DEBUG ****
    console.log(`DEBUG: Setting initial player trigger display to ID: ${firstPlayerToolId}`);
    // **** END DEBUG ****
    updatePlayerTriggerDisplay(firstPlayerToolId);
}

/** Initializes event listeners for the custom player dropdown */
export function initCustomPlayerSelector() {
    const container = dom.playerToolSelector;
    if (!container) {
        console.error("Player selector container not found during init!"); // DEBUG
        return;
    }

    // Use click listener on trigger
    dom.customPlayerSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    // Outside click listener
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.playerToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keydown listener
    dom.customPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}   
// js/otherPlayerSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, DEFAULT_PLAYER_TOOL_ID } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for players */
function generatePlayerIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'player') {
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
    return svgString;
}

/** Updates the content of the Other player trigger button AND description */
export function updateOtherPlayerTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customOtherPlayerSelectTrigger;
    const descriptionSpan = dom.otherPlayerDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'player' && tool.playerCategory === 'other') {
            const iconSvg = generatePlayerIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            // Default to the globally defined DEFAULT_PLAYER_TOOL_ID or first 'other' player
            const defaultOtherPlayerTool = drawingToolMap.get(DEFAULT_PLAYER_TOOL_ID) || drawingTools.find(t => t.category === 'player' && t.playerCategory === 'other');
            if (defaultOtherPlayerTool) {
                const iconSvg = generatePlayerIconSvg(defaultOtherPlayerTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
                triggerButton.title = defaultOtherPlayerTool.label;
                triggerButton.dataset.value = defaultOtherPlayerTool.toolId;
                descriptionSpan.textContent = defaultOtherPlayerTool.label;
                descriptionSpan.title = defaultOtherPlayerTool.label;
            } else {
                triggerButton.innerHTML = `<span class="player-option-icon">O?</span>`;
                triggerButton.title = 'Select Other Player';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'Other';
                descriptionSpan.title = 'Other Players';
            }
        }
    }
}

/** Toggles the visibility of the custom Other player dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customOtherPlayerSelectOptions || !dom.customOtherPlayerSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customOtherPlayerSelectOptions.classList.add('open');
        dom.customOtherPlayerSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customOtherPlayerSelectOptions.classList.remove('open');
        dom.customOtherPlayerSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom Other player select dropdown list (ul) */
export function populateCustomOtherPlayerSelector() {
    if (!dom.otherPlayerOptionsList) return;
    dom.otherPlayerOptionsList.innerHTML = '';
    let firstOtherPlayerToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'player' || tool.playerCategory !== 'other') return;
        if (firstOtherPlayerToolId === null) firstOtherPlayerToolId = tool.toolId;

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
                updateOtherPlayerTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.otherPlayerOptionsList.appendChild(li);
    });
    // Use DEFAULT_PLAYER_TOOL_ID if it's an 'other' player, otherwise the first found 'other' player
    const initialToolId = (drawingToolMap.get(DEFAULT_PLAYER_TOOL_ID)?.playerCategory === 'other')
        ? DEFAULT_PLAYER_TOOL_ID
        : firstOtherPlayerToolId;
    updateOtherPlayerTriggerDisplay(initialToolId);
}

/** Initializes event listeners for the custom Other player dropdown */
export function initCustomOtherPlayerSelector() {
    dom.customOtherPlayerSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.otherPlayerSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    dom.customOtherPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}
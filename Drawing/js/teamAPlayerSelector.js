//***** js/teamAPlayerSelector.js ******
// js/teamAPlayerSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap } from './config.js';
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

/** Updates the content of the Team A player trigger button AND description */
export function updateTeamAPlayerTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customTeamAPlayerSelectTrigger;
    const descriptionSpan = dom.teamAPlayerDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'player' && tool.playerCategory === 'teamA') {
            const iconSvg = generatePlayerIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            // Default to the first Team A player if toolId is null or not a Team A player
            const firstTeamAPlayer = drawingTools.find(t => t.category === 'player' && t.playerCategory === 'teamA');
            if (firstTeamAPlayer) {
                const iconSvg = generatePlayerIconSvg(firstTeamAPlayer, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstTeamAPlayer.label;
                triggerButton.dataset.value = firstTeamAPlayer.toolId;
                descriptionSpan.textContent = firstTeamAPlayer.label;
                descriptionSpan.title = firstTeamAPlayer.label;
            } else { // Fallback if no Team A players defined
                triggerButton.innerHTML = `<span class="player-option-icon">A?</span>`;
                triggerButton.title = 'Select Team A Player';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'Team A';
                descriptionSpan.title = 'Team A Players';
            }
        }
    }
}

/** Toggles the visibility of the custom Team A player dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customTeamAPlayerSelectOptions || !dom.customTeamAPlayerSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customTeamAPlayerSelectOptions.classList.add('open');
        dom.customTeamAPlayerSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customTeamAPlayerSelectOptions.classList.remove('open');
        dom.customTeamAPlayerSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom Team A player select dropdown list (ul) */
export function populateCustomTeamAPlayerSelector() {
    if (!dom.teamAPlayerOptionsList) return;
    dom.teamAPlayerOptionsList.innerHTML = '';
    let firstTeamAPlayerToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'player' || tool.playerCategory !== 'teamA') return;
        if (firstTeamAPlayerToolId === null) firstTeamAPlayerToolId = tool.toolId;

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
                updateTeamAPlayerTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.teamAPlayerOptionsList.appendChild(li);
    });
    updateTeamAPlayerTriggerDisplay(firstTeamAPlayerToolId); // Set initial display
}

/** Initializes event listeners for the custom Team A player dropdown */
export function initCustomTeamAPlayerSelector() {
    dom.customTeamAPlayerSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.teamAPlayerSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    dom.customTeamAPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}
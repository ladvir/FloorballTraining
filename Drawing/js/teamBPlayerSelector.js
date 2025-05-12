//***** js/teamBPlayerSelector.js ******
// js/teamBPlayerSelector.js
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

/** Updates the content of the Team B player trigger button AND description */
export function updateTeamBPlayerTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customTeamBPlayerSelectTrigger;
    const descriptionSpan = dom.teamBPlayerDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'player' && tool.playerCategory === 'teamB') {
            const iconSvg = generatePlayerIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            const firstTeamBPlayer = drawingTools.find(t => t.category === 'player' && t.playerCategory === 'teamB');
            if (firstTeamBPlayer) {
                const iconSvg = generatePlayerIconSvg(firstTeamBPlayer, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="player-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstTeamBPlayer.label;
                triggerButton.dataset.value = firstTeamBPlayer.toolId;
                descriptionSpan.textContent = firstTeamBPlayer.label;
                descriptionSpan.title = firstTeamBPlayer.label;
            } else {
                triggerButton.innerHTML = `<span class="player-option-icon">B?</span>`;
                triggerButton.title = 'Select Team B Player';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'Team B';
                descriptionSpan.title = 'Team B Players';
            }
        }
    }
}

/** Toggles the visibility of the custom Team B player dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customTeamBPlayerSelectOptions || !dom.customTeamBPlayerSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customTeamBPlayerSelectOptions.classList.add('open');
        dom.customTeamBPlayerSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customTeamBPlayerSelectOptions.classList.remove('open');
        dom.customTeamBPlayerSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom Team B player select dropdown list (ul) */
export function populateCustomTeamBPlayerSelector() {
    if (!dom.teamBPlayerOptionsList) return;
    dom.teamBPlayerOptionsList.innerHTML = '';
    let firstTeamBPlayerToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'player' || tool.playerCategory !== 'teamB') return;
        if (firstTeamBPlayerToolId === null) firstTeamBPlayerToolId = tool.toolId;

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
                updateTeamBPlayerTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.teamBPlayerOptionsList.appendChild(li);
    });
    updateTeamBPlayerTriggerDisplay(firstTeamBPlayerToolId);
}

/** Initializes event listeners for the custom Team B player dropdown */
export function initCustomTeamBPlayerSelector() {
    dom.customTeamBPlayerSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.teamBPlayerSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    dom.customTeamBPlayerSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}
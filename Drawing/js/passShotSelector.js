// js/passShotSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE, ARROW_COLOR, ARROW_MARKER_SIZE_SHOT, MARKER_ARROW_SHOT_LARGE_ID, MARKER_ARROW_PASS_ID } from './config.js'; // Added marker IDs
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 30;
const ICON_HEIGHT = 30;

/** Helper function to generate the small SVG icon markup for pass/shots */
function generatePassShotIconSvg(tool, width = ICON_WIDTH, height = ICON_HEIGHT) {
    if (!tool || tool.category !== 'passShot') return '';

    const strokeWidth = 2;
    const midY = height / 2;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const color = ARROW_COLOR;
    let markerId = `icon-${tool.markerEndId}`; // Use the actual marker ID from config
    let markerSize = ARROW_MARKER_SIZE * 1.2;
    let markerRefX = 8;

    let lines = `<line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                       stroke="${color}" stroke-width="${strokeWidth}"
                       marker-end="url(#${markerId})" />`;

    if (tool.isDoubleLine) {
        const offset = strokeWidth * 1.5;
        // Use the larger shot marker size and adjusted refX for the icon definition
        markerId = `icon-${MARKER_ARROW_SHOT_LARGE_ID}`; // Use large marker ID for icon def
        markerSize = ARROW_MARKER_SIZE_SHOT * 1.0;
        markerRefX = 1; // Use adjusted refX

        lines = `
            <line x1="${startX}" y1="${midY - offset/2}" x2="${endX}" y2="${midY - offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY + offset/2}" x2="${endX}" y2="${midY + offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}" stroke="none" stroke-width="1" marker-end="url(#${markerId})" />
            `;
    } else {
        // Ensure pass uses its specific marker ID for the icon def
        markerId = `icon-${MARKER_ARROW_PASS_ID}`;
    }

    // Define the marker locally within the icon SVG
    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <defs>
                <marker id="${markerId}" viewBox="0 0 10 10" refX="${markerRefX}" refY="5"
                        markerUnits="strokeWidth" markerWidth="${markerSize}" markerHeight="${markerSize}"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}" />
                </marker>
            </defs>
            ${lines}
        </svg>`;
}


/** Updates the content of the pass/shot trigger button */
export function updatePassShotTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customPassShotSelectTrigger) {
        if (tool && tool.category === 'passShot') {
            const iconSvg = generatePassShotIconSvg(tool);
            dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
            dom.customPassShotSelectTrigger.title = tool.label;
            dom.customPassShotSelectTrigger.dataset.value = toolId;
        } else {
            dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon"></span>`;
            dom.customPassShotSelectTrigger.title = 'Select Pass/Shot Tool';
            dom.customPassShotSelectTrigger.dataset.value = '';
        }
    }
}

/** Toggles the visibility of the custom pass/shot dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customPassShotSelectOptions || !dom.customPassShotSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen) {
        dom.customPassShotSelectOptions.classList.add('open');
        dom.customPassShotSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customPassShotSelectOptions.classList.remove('open');
        dom.customPassShotSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom pass/shot select dropdown list (ul) */
export function populateCustomPassShotSelector() {
    if (!dom.passShotOptionsList) return;
    dom.passShotOptionsList.innerHTML = '';
    drawingTools.forEach(tool => {
        if (tool.category !== 'passShot') return;
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generatePassShotIconSvg(tool);
        li.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updatePassShotTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.passShotOptionsList.appendChild(li);
    });
    updatePassShotTriggerDisplay(null);
}

/** Initializes event listeners for the custom pass/shot dropdown */
export function initCustomPassShotSelector() {
    dom.customPassShotSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.passShotToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customPassShotSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}